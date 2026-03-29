from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import requests
import json
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from io import BytesIO
from fastapi.responses import StreamingResponse
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"

logger.info(f"Using Ollama with model: {MODEL_NAME}")
logger.info(f"Ollama API URL: {OLLAMA_API_URL}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptimizationRequest(BaseModel):
    resume_text: str
    job_text: str

@app.get("/")
def home():
    return {"message": "Resume Optimizer API is running"}

@app.post("/optimize")
def optimize_resume(data: OptimizationRequest):
    try:
        if not data.resume_text or not data.job_text:
            raise HTTPException(status_code=400, detail="Resume and job description are required")

        logger.info("Processing optimization request...")
        
        prompt = f"""You are an expert resume writer and career advisor. Your task is to:
1. Compare the provided resume with the job description
2. Rewrite the resume to better match the job description
3. Identify missing skills or experience gaps
4. Provide specific suggestions for improvement

Resume:
{data.resume_text}

Job Description:
{data.job_text}

Please provide a comprehensive analysis including:
- Rewritten resume sections (tailored to the job)
- List of missing skills
- Recommendations for improvement
- Match score (0-100%)"""

        logger.info("Calling Ollama API...")
        
        try:
            response = requests.post(
                OLLAMA_API_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.7
                },
                timeout=120
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
            
            result = response.json()
            logger.info("Successfully received response from Ollama")
            return {"result": result.get("response", "No response generated")}
            
        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to Ollama. Make sure it's running: ollama serve")
            raise HTTPException(status_code=500, detail="Error: Ollama is not running. Please start it with: ollama serve")
        except requests.exceptions.Timeout:
            logger.error("Ollama request timed out")
            raise HTTPException(status_code=500, detail="Error: Request timed out. Ollama is slow to respond.")

    except HTTPException as he:
        logger.error(f"HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error during optimization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


class DownloadRequest(BaseModel):
    resume_text: str
    optimized_text: str


@app.post("/download-resume")
def download_resume(data: DownloadRequest):
    """Generate and download resume as Word document with professional formatting"""
    try:
        logger.info("Generating Word document...")
        
        # Create a new Document
        doc = Document()
        
        # Set document margins
        sections = doc.sections
        for section in sections:
            section.top_margin = Inches(0.5)
            section.bottom_margin = Inches(0.5)
            section.left_margin = Inches(0.75)
            section.right_margin = Inches(0.75)
        
        # Add title - extract name from resume if possible
        title = doc.add_heading('OPTIMIZED RESUME', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.LEFT
        title_format = title.runs[0]
        title_format.font.size = Pt(24)
        title_format.font.color.rgb = RGBColor(0, 51, 102)
        
        # Add subtitle
        subtitle = doc.add_paragraph('AI-Optimized for Job Match')
        subtitle.alignment = WD_ALIGN_PARAGRAPH.LEFT
        subtitle_format = subtitle.runs[0]
        subtitle_format.font.size = Pt(10)
        subtitle_format.font.color.rgb = RGBColor(100, 100, 100)
        subtitle_format.italic = True
        
        # Add a line separator
        doc.add_paragraph('_' * 80)
        
        # Parse and add the optimized content
        doc.add_heading('OPTIMIZED CONTENT', level=1)
        
        content_lines = data.optimized_text.split('\n')
        current_section = None
        
        for line in content_lines:
            line = line.strip()
            if not line:
                continue
            
            # Skip code markers
            if line.startswith('```'):
                continue
            
            # Handle section headers (text between **)
            if line.startswith('**') and line.endswith('**'):
                section_name = line.replace('**', '').strip()
                if section_name:
                    p = doc.add_heading(section_name, level=2)
                    p_format = p.runs[0]
                    p_format.font.size = Pt(12)
                    p_format.font.bold = True
                    p_format.font.color.rgb = RGBColor(0, 51, 102)
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    
                    # Add spacing before section header
                    p.paragraph_format.space_before = Pt(10)
                    p.paragraph_format.space_after = Pt(8)
                    
                current_section = section_name
            
            # Handle bullet points
            elif line.startswith('-') or line.startswith('•'):
                bullet_text = line[1:].strip()
                p = doc.add_paragraph(bullet_text, style='List Bullet')
                p_format = p.paragraph_format
                p_format.line_spacing = 1.15
                p_format.space_after = Pt(6)
                p_format.left_indent = Inches(0.25)  # Proper bullet indentation
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            
            # Handle numbered items
            elif line and line[0].isdigit() and (line[1] == '.' or line[1] == ')'):
                item_text = line[2:].strip() if len(line) > 2 else ''
                if item_text:
                    p = doc.add_paragraph(item_text, style='List Number')
                    p_format = p.paragraph_format
                    p_format.line_spacing = 1.15
                    p_format.space_after = Pt(6)
                    p_format.left_indent = Inches(0.25)  # Proper list indentation
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            
            # Regular text
            elif line:
                p = doc.add_paragraph(line)
                p_format = p.paragraph_format
                p_format.line_spacing = 1.15
                p_format.space_after = Pt(6)
                p_format.left_indent = Inches(0.0)  # Explicit left alignment
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        
        # Add page break
        doc.add_page_break()
        
        # Add original resume section for reference
        doc.add_heading('ORIGINAL RESUME (Reference)', level=1)
        
        original_lines = data.resume_text.split('\n')
        for line in original_lines:
            line = line.strip()
            if line:
                if line.startswith('-') or line.startswith('•'):
                    p = doc.add_paragraph(line[1:].strip(), style='List Bullet')
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                else:
                    p = doc.add_paragraph(line)
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    p.paragraph_format.line_spacing = 1.15
                    p.paragraph_format.space_after = Pt(3)
        
        # Add footer with generation info
        footer_para = doc.add_paragraph()
        footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        footer_para.add_run('\n\nGenerated by Resume Career Optimizer - AI Powered Resume Enhancement Tool').font.size = Pt(8)
        footer_para.runs[-1].font.color.rgb = RGBColor(150, 150, 150)
        footer_para.runs[-1].italic = True
        
        # Save to BytesIO
        doc_io = BytesIO()
        doc.save(doc_io)
        doc_io.seek(0)
        
        logger.info("Word document generated successfully")
        
        # Return the file as streaming response
        return StreamingResponse(
            iter([doc_io.getvalue()]),
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            headers={"Content-Disposition": "attachment; filename=optimized-resume.docx"}
        )
        
    except Exception as e:
        logger.error(f"Error generating Word document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating Word document: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server on http://127.0.0.1:8000")
    logger.info("Press Ctrl+C to stop the server")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")