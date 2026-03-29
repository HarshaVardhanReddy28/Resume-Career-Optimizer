# Resume Career Optimizer - Design Document

## 1. Executive Summary

**Resume Career Optimizer** is a full-stack web application that leverages AI to analyze and optimize user resumes against specific job descriptions. The application parses PDF/DOCX resume files, processes them through a locally-hosted AI model (Ollama/Mistral), and generates professionally formatted Word documents with optimized recommendations.

### Key Objectives:
- 🎯 **Free & Unlimited**: No API rate limits or billing concerns
- 🏠 **Locally Hosted**: All processing happens on-device for privacy
- ⚡ **Fast Processing**: Low latency with local Ollama service
- 👨‍🎓 **Student-Friendly**: Simple, intuitive interface for easy resume optimization
- 📄 **Professional Output**: Generate publication-ready Word documents

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER (Frontend)                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      React + Vite Application                      │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │ Input Tab:                                                   │  │  │
│  │  │  • Resume File Upload (PDF/DOCX → Text Extraction)           │  │  │
│  │  │  • Manual Resume Text Input                                  │  │  │
│  │  │  • Job Description Text Input                                │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │ Output Tab:                                                  │  │  │
│  │  │  • AI Analysis Results Display                               │  │  │
│  │  │  • Match Score & Statistics                                  │  │  │
│  │  │  • Copy to Clipboard Functionality                           │  │  │
│  │  │  • Download as DOCX Button                                   │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │ Error Handling & User Feedback:                              │  │  │
│  │  │  • Loading State Indicators                                  │  │  │
│  │  │  • Error Message Display                                     │  │  │
│  │  │  • File Validation                                           │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │ HTTP REST API (Axios)
                                 │ POST /optimize
                                 │ POST /download-resume
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      Backend Server (FastAPI)                            │
│                     Running on http://127.0.0.1:8000                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Request Handler Layer:                                             │  │
│  │  ├── CORS Middleware (Allow all origins for development)           │  │
│  │  ├── Request Validation (Pydantic Models)                          │  │
│  │  └── Error Handling & Logging                                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ API Endpoints:                                                     │  │
│  │  ├── GET  /              - Health Check                            │  │
│  │  ├── POST /optimize      - Resume Analysis & Optimization          │  │
│  │  └── POST /download-resume - Generate Word Document                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Business Logic Layer:                                              │  │
│  │  ├── Resume Analysis Logic                                         │  │
│  │  ├── Prompt Engineering & LLM Communication                        │  │
│  │  └── Document Generation & Formatting                              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │ HTTP API Requests
                                 │ (python-requests library)
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    Ollama Service (Local AI Engine)                      │
│                      Running on http://localhost:11434                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Ollama REST API Server (/api/generate endpoint)                    │  │
│  │  • Stateless HTTP API for text generation                          │  │
│  │  • Streaming & Non-streaming modes                                 │  │
│  │  • Temperature & Parameter control                                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Large Language Model: Mistral 7B (4.4 GB)                          │  │
│  │  • Open-source, privacy-preserving                                 │  │
│  │  • Good performance on text generation tasks                       │  │
│  │  • Quantized for efficient local inference                         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Runtime Infrastructure:                                            │  │
│  │  • Token Generator (text → tokens)                                 │  │
│  │  • Inference Engine (GPU/CPU processing)                           │  │
│  │  • Model Cache (loaded once, reused)                               │  │
│  │  • Context Management (token limits)                               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ Key Advantages:                                                          │
│  ✓ No Internet Required        ✓ Zero Latency Overhead                   │
│  ✓ Privacy Preserved            ✓ Unlimited API Calls                    │
│  ✓ No Rate Limits              ✓ Cost-Free Processing                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Interaction Flow

```
User Interaction Flow:
┌─────────────┐
│   User      │
│  Uploads    │
│  Resume     │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────┐
│  File Processing (Frontend)  │
│  - PDF/DOCX Parsing          │
│  - Text Extraction           │
│  - Input Validation          │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│   User enters Job Desc.      │
│   & Triggers Optimization    │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  Frontend State Update           │
│  - Set Loading = true            │
│  - Prepare Request Body          │
│  - Send POST /optimize           │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  Backend Request Handler         │
│  - Validate Input                │
│  - Extract Resume & Job Text     │
│  - Create Optimization Prompt    │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  Ollama LLM Processing           │
│  - Send Prompt to Mistral        │
│  - Generate Optimized Response   │
│  - Stream or Return Full Result  │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  Backend Response Processing     │
│  - Parse LLM Output              │
│  - Return JSON with Result       │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  Frontend Result Display         │
│  - Parse Analysis Results        │
│  - Extract Stats (Match Score)   │
│  - Display Formatted Output      │
│  - Enable Copy/Download Options  │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────┐
│  User Downloads DOCX             │
│  - Trigger POST /download-resume │
│  - Send Resume + Optimized Text  │
│  - Receive Word Document         │
│  - Browser Downloads File        │
└──────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend Technologies
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 19.2.4 | UI rendering, component state management |
| **Build Tool** | Vite | 8.0.1 | Fast development server, optimized bundling |
| **HTTP Client** | Axios | 1.14.0 | API calls to backend, request/response handling |
| **PDF Parser** | pdfjs-dist | 5.5.207 | Extract text from PDF files on the client |
| **DOCX Parser** | mammoth | 1.12.0 | Extract text from Word documents (.docx) |
| **Styling** | CSS3 | Native | Custom UI styling for components |

### 3.2 Backend Technologies
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | Latest | High-performance REST API server |
| **Data Validation** | Pydantic | Built-in | Request/response type validation & serialization |
| **CORS Middleware** | FastAPI CORS | Built-in | Cross-Origin Resource Sharing support |
| **HTTP Client** | Requests | Latest | Communication with Ollama API |
| **Document Gen** | python-docx | Latest | Create & format Word documents (.docx) |
| **Logging** | Python logging | Built-in | Request tracking and error logging |

### 3.3 AI & NLP Services
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **LLM Runtime** | Ollama | Latest | Local LLM inference server |
| **Language Model** | Mistral 7B | Quantized | Open-source LLM for text generation |

---

## 4. Detailed Component Breakdown

### 4.1 Frontend Architecture

#### 4.1.1 Main Application Component (`App.jsx`)
**Purpose**: Root component managing global state and orchestrating all subcomponents.

**Key Responsibilities**:
- Manage resume, job description, and results state
- Handle file uploads and text extraction
- Coordinate API calls and loading states
- Display error messages and user feedback
- Switch between input and output tabs

**State Variables**:
```
- resume: string (extracted resume text)
- job: string (job description text)
- result: string (optimization result from AI)
- loading: boolean (API request in progress)
- error: string (error messages)
- resumeFileName: string (name of uploaded file)
- activeTab: string ('input' | 'output')
```

#### 4.1.2 File Upload & Parsing Module
**Purpose**: Handle various file format uploads and convert them to plain text.

**Supported Formats**:
- **PDF Files** (`application/pdf`)
  - Uses pdf.js library
  - Extracts text from all pages
  - Handles multi-page documents
  
- **Word Documents** (`.docx`)
  - Uses mammoth library
  - Extracts formatted text
  - Supports both new (.docx) and legacy (.doc) formats

**Processing Steps**:
1. User selects file via input element
2. Browser validates file type
3. File converted to ArrayBuffer
4. PDF.js or mammoth extracts text
5. Extracted text stored in state
6. UI updated to show file name

#### 4.1.3 Input Tab Component
**Purpose**: Collect resume and job description inputs from user.

**Features**:
- Resume file upload input
- Resume text area for manual input
- Job description text area
- Clear/reset buttons
- Character counters
- Input validation warnings

#### 4.1.4 Output Tab Component
**Purpose**: Display AI analysis results and provide action buttons.

**Features**:
- Display optimized resume analysis
- Show match score and statistics
- Copy-to-clipboard functionality
- Download as Word document button
- Result formatting and styling

#### 4.1.5 UI Components
**Tab Navigation**:
- Two main tabs: Input | Output
- Smooth tab switching
- Active tab highlighting

**Styling** (`App.css`):
- Responsive design (mobile-friendly)
- Tab panel styling
- Input field styling
- Button styling and hover effects
- Error/success message colors
- Loading spinner animation

---

### 4.2 Backend Architecture

#### 4.2.1 FastAPI Application (`app.py`)
**Purpose**: REST API server handling resume optimization requests.

**Core Components**:

##### Server Configuration
```python
- OLLAMA_API_URL = "http://localhost:11434/api/generate"
- MODEL_NAME = "mistral"
- CORS Middleware enabled for all origins
- Logging configured for request tracking
```

##### Middleware
- **CORS Middleware**: Allows all HTTP methods and origins
- **Error Handling**: Global exception handlers
- **Logging**: Request and response tracking

#### 4.2.2 Data Models (Pydantic)

**OptimizationRequest**:
```
{
  "resume_text": string (user's resume content)
  "job_text": string (job description content)
}
```

**DownloadRequest**:
```
{
  "resume_text": string (original resume)
  "optimized_text": string (AI-generated optimized content)
}
```

#### 4.2.3 API Endpoints

##### Endpoint 1: Health Check
```
GET /
Response: { "message": "Resume Optimizer API is running" }
```
**Purpose**: Verify backend is running

---

##### Endpoint 2: Resume Optimization
```
POST /optimize
Request Body:
{
  "resume_text": "string",
  "job_text": "string"
}
Response:
{
  "result": "string (AI-generated analysis)"
}
```

**Process Flow**:
1. Validate input (both resume and job description provided)
2. Construct detailed resume optimization prompt
3. Send to Ollama API with Mistral model
4. Handle connection errors gracefully
5. Return AI-generated optimization

**Prompt Template**:
```
You are an expert resume writer and career advisor. Your task is to:
1. Compare the provided resume with the job description
2. Rewrite the resume to better match the job description
3. Identify missing skills or experience gaps
4. Provide specific suggestions for improvement

Resume:
[USER'S RESUME]

Job Description:
[JOB DESCRIPTION]

Please provide a comprehensive analysis including:
- Rewritten resume sections (tailored to the job)
- List of missing skills
- Recommendations for improvement
- Match score (0-100%)
```

**Error Handling**:
- Missing input validation (HTTP 400)
- Ollama connection errors (HTTP 500)
- Request timeout handling (HTTP 500)
- Generic exception handling

---

##### Endpoint 3: Download Resume as DOCX
```
POST /download-resume
Request Body:
{
  "resume_text": "string",
  "optimized_text": "string"
}
Response: Binary Word Document (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
```

**Document Generation Process**:
1. Create new Word document
2. Set professional margins (0.5" top/bottom, 0.75" left/right)
3. Add title: "OPTIMIZED RESUME"
4. Add subtitle: "AI-Optimized for Job Match"
5. Add separator line
6. Parse and format optimized content
7. Apply professional styling:
   - Font sizes and colors
   - Alignment and spacing
   - Section headers formatting
8. Stream document to frontend as download

**Formatting Details**:
- Title: 24pt, Dark Blue (RGB 0,51,102)
- Subtitle: 10pt, Gray (RGB 100,100,100), Italic
- Content: Standard 11pt font
- Sections: Formatted with proper indentation
- Margins: Professional 0.75" sides, 0.5" top/bottom

#### 4.2.4 Ollama Integration

**Request Flow to Ollama**:
```
POST http://localhost:11434/api/generate
{
  "model": "mistral",
  "prompt": "[optimized prompt with resume and job desc]",
  "stream": false,
  "temperature": 0.7
}
```

**Response Processing**:
- Receives JSON response with "response" field
- Extracts generated text
- Returns to frontend in JSON format
- Handles connection failures and timeouts

**Ollama Configuration**:
- URL: `localhost:11434`
- Model: Mistral (4.4 GB quantized)
- Temperature: 0.7 (balanced creativity/consistency)
- Stream: False (receive complete response)
- Timeout: 120 seconds

#### 4.2.5 Error Handling Strategy

**Error Types & Handling**:

| Error Type | Status Code | Message | Cause |
|-----------|-------------|---------|-------|
| Empty Input | 400 | "Resume and job description are required" | Missing input |
| Connection Failed | 500 | "Ollama is not running..." | Ollama service down |
| Request Timeout | 500 | "Request timed out. Ollama is slow..." | LLM processing delay |
| Generic Error | 500 | "Error: [exception message]" | Unexpected error |

**Logging**:
- All requests logged with timestamps
- Error details logged with full traceback
- Ollama connectivity status logged
- Request/response sizes tracked

---

## 5. Data Flow & Processing

### 5.1 Resume Optimization Flow

```
STEP 1: User Input (Frontend)
        ┌─────────────────────────┐
        │ Upload Resume or        │
        │ Enter Text & Job Desc   │
        └────────────┬────────────┘
                     │
                     ↓
STEP 2: File Processing (Frontend)
        ┌──────────────────────────────┐
        │ Parse PDF/DOCX or use text   │
        │ Extract raw text             │
        │ Store in resume state        │
        └────────────┬─────────────────┘
                     │
                     ↓
STEP 3: Request Preparation (Frontend)
        ┌──────────────────────────────────┐
        │ Create request payload:          │
        │ {                                │
        │   "resume_text": "...",          │
        │   "job_text": "..."              │
        │ }                                │
        │ Send POST /optimize              │
        └────────────┬─────────────────────┘
                     │ (Axios HTTP Request)
                     ↓
STEP 4: Backend Request Handling
        ┌──────────────────────────────────┐
        │ FastAPI receives request         │
        │ Pydantic validates input         │
        │ Check for empty fields           │
        │ Construct LLM prompt             │
        └────────────┬─────────────────────┘
                     │
                     ↓
STEP 5: Ollama LLM Processing
        ┌──────────────────────────────────┐
        │ Send prompt to Mistral via       │
        │ Ollama REST API                  │
        │ Model generates response         │
        │ Return AI-optimized analysis     │
        └────────────┬─────────────────────┘
                     │
                     ↓
STEP 6: Backend Response Processing
        ┌──────────────────────────────────┐
        │ Extract response from Ollama     │
        │ Format as JSON                   │
        │ Return to frontend               │
        │ HTTP 200 OK                      │
        └────────────┬─────────────────────┘
                     │
                     ↓
STEP 7: Frontend Result Parsing
        ┌──────────────────────────────────┐
        │ Parse AI response                │
        │ Extract match score              │
        │ Extract missing skills           │
        │ Extract recommendations          │
        │ Update result state              │
        └────────────┬─────────────────────┘
                     │
                     ↓
STEP 8: Output Display
        ┌──────────────────────────────────┐
        │ Switch to Output tab             │
        │ Display formatted results        │
        │ Show match score with color      │
        │ Show missing skills list         │
        │ Show recommendations             │
        │ Enable Copy & Download buttons   │
        └──────────────────────────────────┘
```

### 5.2 Document Download Flow

```
User clicks "Download DOCX" button
        ↓
POST /download-resume with resume_text & optimized_text
        ↓
FastAPI receives request, validates data
        ↓
Create new Word document using python-docx
        ↓
Set margins and styling (professional format)
        ↓
Add title: "OPTIMIZED RESUME"
        ↓
Parse optimized_text content
        ↓
Format sections with proper headings & styling
        ↓
Apply professional colors and fonts
        ↓
Generate BytesIO object (in-memory file)
        ↓
Return as StreamingResponse (application/vnd....)
        ↓
Browser receives binary data
        ↓
Triggers download dialog
        ↓
User saves file to computer
```

---

## 6. API Documentation

### 6.1 Resume Optimization Endpoint

**Endpoint**: `POST /optimize`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "resume_text": "John Doe\n\nExperience:\n...",
  "job_text": "Software Engineer - 2+ years Python...\n..."
}
```

**Success Response** (HTTP 200):
```json
{
  "result": "Expert Analysis:\n\nRecommendations:\n1. Add more technical skills...\n\nMatch Score: 75%\n..."
}
```

**Error Responses**:
```json
// HTTP 400 - Missing Input
{
  "detail": "Resume and job description are required"
}

// HTTP 500 - Ollama Not Running
{
  "detail": "Error: Ollama is not running. Please start it with: ollama serve"
}

// HTTP 500 - Timeout
{
  "detail": "Error: Request timed out. Ollama is slow to respond."
}
```

---

### 6.2 Document Download Endpoint

**Endpoint**: `POST /download-resume`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "resume_text": "Original resume text...",
  "optimized_text": "Optimized resume content..."
}
```

**Success Response** (HTTP 200):
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="optimized_resume.docx"

[Binary Word Document Data]
```

---

## 7. Installation & Setup

### 7.1 Prerequisites
- Python 3.8+
- Node.js 16+
- Ollama CLI installed and in PATH
- Mistral model downloaded locally

### 7.2 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install fastapi uvicorn pydantic requests python-docx

# Ensure Ollama is running (in separate terminal)
ollama serve

# Start backend server
python app.py
# or with uvicorn explicitly:
uvicorn app:app --host 127.0.0.1 --port 8000
```

### 7.3 Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Vite will run on http://localhost:5173

# For production build
npm run build
```

---

## 8. Deployment Considerations

### 8.1 Performance Optimization
- **Frontend**: Vite provides tree-shaking and code splitting
- **Backend**: FastAPI is highly optimized for async operations
- **LLM**: Mistral 7B is quantized for efficient inference

### 8.2 Scalability Notes
- Single-user application (local deployment)
- Ollama handles one request at a time
- For multi-user: Consider load balancing or queue management

### 8.3 Security Considerations
- CORS allows all origins (suitable for local development)
- For production: Restrict CORS to specific domains
- Resume data is processed locally (not sent to cloud)
- Private model inference (no external API calls)

---

## 9. Testing Strategy

### 9.1 Frontend Testing
- Test file upload with PDF and DOCX formats
- Verify text extraction accuracy
- Test API error handling and display
- Validate form inputs
- Test copy-to-clipboard functionality

### 9.2 Backend Testing
- Verify API endpoint responses
- Test with various resume/job description lengths
- Test error scenarios (missing input, Ollama down)
- Validate DOCX generation
- Test timeout handling

### 9.3 Integration Testing
- End-to-end resume upload → optimization → download flow
- Verify Ollama connectivity and response times
- Test with realistic resume and job description samples

---

## 10. Future Enhancements

### 10.1 Planned Features
- **Multi-model Support**: Support for different LLMs (Llama 2, Neural Chat)
- **Resume Templates**: Pre-defined resume format templates
- **Batch Processing**: Optimize against multiple job descriptions
- **History**: Save previous optimizations
- **Skill Matching Visualization**: Visual skill gap analysis
- **Industry-Specific Optimization**: Tailored prompts for different industries
- **Export Formats**: Support for PDF export in addition to DOCX
- **Dark Mode**: User interface theme toggle

### 10.2 Performance Improvements
- **Response Streaming**: Stream Ollama responses for faster UX
- **Caching**: Cache common optimization patterns
- **Worker Queue**: Background processing for parallel requests
- **Model Quantization**: Further optimize model size

### 10.3 Advanced Features
- **Resume Parser**: Extract structured data (dates, titles, etc.)
- **ATS Scoring**: Simulate Applicant Tracking System scoring
- **Feedback Loop**: Learn from user feedback and improve suggestions
- **API Versioning**: Support multiple API versions for stability

---

## 11. Architecture Decisions & Rationale

### Why Ollama?
✓ **Privacy**: No data leaves the user's machine
✓ **Cost**: Completely free, no API charges
✓ **Speed**: Local inference with minimal latency
✓ **Unlimited**: No rate limits or quotas

### Why Mistral 7B?
✓ **Open Source**: Available for any use case
✓ **Quality**: Strong performance on text generation
✓ **Size**: 4.4GB fits on most modern systems
✓ **Speed**: 7B parameter model is reasonably fast

### Why React + Vite?
✓ **Developer Experience**: Fast HMR and build times
✓ **Performance**: Optimized production builds
✓ **Ecosystem**: Rich component libraries available
✓ **Modern**: ES6+ support and best practices

### Why FastAPI?
✓ **Speed**: One of the fastest Python frameworks
✓ **Type Hints**: Automatic validation and documentation
✓ **Async**: Native async/await support
✓ **Production**: Built-in dependency injection and middleware

---

## 12. File Structure Reference

```
resume-career-optimizer/
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   └── __pycache__/           # Python cache
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── App.css            # Styling
│   │   ├── main.jsx           # Entry point
│   │   ├── index.css          # Global styles
│   │   └── assets/            # Images, logos, etc.
│   ├── public/                # Static assets
│   ├── package.json           # Node.js dependencies
│   ├── vite.config.js         # Vite configuration
│   └── eslint.config.js       # ESLint rules
├── DESIGN_DOCUMENT.md         # This file
├── GEMINI_SETUP.md            # Gemini integration guide
└── README.md                  # Project overview
```

---

## Summary

Resume Career Optimizer is a well-architected full-stack application that prioritizes **user privacy**, **zero cost**, and **ease of use**. By leveraging local AI through Ollama and maintaining clear separation of concerns between frontend and backend, the application provides a robust, scalable solution for resume optimization without relying on expensive third-party APIs.

The component-based architecture, comprehensive error handling, and professional UI ensure a smooth user experience while remaining cost-effective and deployable by any student or professional.
| DOCX Parser | mammoth | 1.6.0 | DOCX file parsing |
| CSS | Vanilla CSS | - | Modern styling, gradients, responsive |
| Dev Server | Node.js | Latest | Local development environment |

**Key Frontend Features:**
- Tab-based UI (Input tab for uploads, Output tab for results)
- Drag-and-drop file upload support
- Real-time error messages
- Professional stats dashboard with 4 metric cards
- Copy-to-clipboard & Word download buttons

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | FastAPI | Latest | Modern Python API framework |
| Server | Uvicorn | Latest | ASGI server with auto-reload |
| Python | Python | 3.13 | Backend runtime |
| Word Gen | python-docx | 1.2.0 | DOCX file generation |
| Doc Parsing | lxml | 6.0.2 | XML parsing for Word docs |
| CORS | FastAPI Middleware | - | Cross-origin request handling |
| Logging | Python logging | - | Request/error tracking |

**Key Backend Features:**
- REST API endpoints with proper HTTP methods
- CORS enabled for frontend communication
- Comprehensive error handling & logging
- File streaming for large document downloads
- Automatic server reload on code changes

### AI/ML
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| LLM Service | Ollama | Latest | Local AI inference engine |
| Model | Mistral | Latest | Fast, reliable open-source model |
| Inference | requests library | 2.31+ | HTTP communication with Ollama |

**Why Ollama + Mistral?**
- ✅ 100% free (no API costs)
- ✅ Unlimited requests (no rate limits)
- ✅ Privacy-first (data stays local)
- ✅ Fast inference (sub-second responses typical)
- ✅ No authentication needed
- ✅ Student/hobbyist friendly

---

## 4. Detailed Component Architecture

### 4.1 Frontend Architecture

```
/frontend/src/
├── App.jsx                 # Main React component
├── App.css                 # Styling 
├── main.jsx                # React entry point
└── index.css               # Global styles

App.jsx Structure:
├── State Management (useState)
│   ├── resume: Current resume text
│   ├── jobDescription: Current job description
│   ├── result: AI-generated optimization
│   ├── loading: Loading state
│   ├── activeTab: Current tab (input/output)
│   ├── stats: Parsed statistics {matchScore, analysisType, quality, status}
│   └── error: Error message display
│
├── File Parsing Functions
│   ├── extractTextFromPDF() - Uses pdfjs-dist
│   ├── extractTextFromDocx() - Uses mammoth
│   └── handleResumeUpload() - Processes uploaded files
│
├── API Functions
│   ├── handleSubmit() - Calls /optimize endpoint
│   ├── downloadResume() - Calls /download-resume endpoint
│   └── copyToClipboard() - Browser clipboard API
│
├── UI Components
│   ├── Header with gradient background
│   ├── Tab navigation (Input/Output)
│   ├── Input Tab:
│   │   ├── File upload area
│   │   ├── Resume textarea
│   │   ├── Job description textarea
│   │   ├── Optimize button
│   │   └── Error display
│   │
│   ├── Output Tab:
│   │   ├── Stats cards grid (4 metrics)
│   │   ├── Result text display
│   │   ├── Action buttons (Download/Copy/New)
│   │   └── Success messages
│   │
│   └── Footer with styling

CSS Features:
├── Gradient backgrounds (header, buttons)
├── Stats cards with hover effects
├── Responsive grid layout
├── Tab styling & transitions
├── Professional color scheme
├── Loading spinners & animations
├── Error styling
└── Mobile-responsive design (media queries)
```

### 4.2 Backend Architecture

```
/backend/app.py Structure:

Imports & Configuration
├── FastAPI, CORS middleware
├── Pydantic models for validation
├── python-docx for Word generation
├── requests for Ollama API
└── logging for debugging

Models (Pydantic)
├── OptimizationRequest
│   ├── resume_text: str
│   └── job_text: str
│
└── DownloadRequest
    ├── resume_text: str
    └── optimized_text: str

Configuration
├── OLLAMA_API_URL = "http://localhost:11434/api/generate"
├── MODEL_NAME = "mistral"
├── CORS Origins = "*" (allow all for development)
└── Logging = INFO level

Endpoints

1. GET /
   Purpose: Health check
   Response: {"message": "Resume Optimizer API is running"}
   Status Code: 200

2. POST /optimize
   Request Body:
   {
     "resume_text": "Original resume content",
     "job_text": "Job description content"
   }
   
   Processing:
   ├── Validate inputs (non-empty)
   ├── Build AI prompt with context
   ├── Call Ollama API
   ├── Handle errors (connection, timeout, API error)
   └── Return optimized resume
   
   Response:
   {
     "result": "Optimized resume with recommendations..."
   }
   
   Error Handling:
   ├── 400: Missing inputs
   ├── 500: Ollama connection error
   ├── 500: Timeout error
   └── 500: General errors

3. POST /download-resume
   Request Body:
   {
     "resume_text": "Original resume",
     "optimized_text": "AI-optimized resume"
   }
   
   Processing:
   ├── Create Document object (python-docx)
   ├── Set professional margins (0.5", 0.75")
   ├── Add title & subtitle
   ├── Parse & format optimized content
   │  ├── Section headers from **text**
   │  ├── Bullet points from - or •
   │  ├── Numbered lists from 1. or 1)
   │  ├── Regular paragraphs
   │  └── Proper spacing & alignment
   ├── Add original resume on page 2
   ├── Add professional footer
   ├── Save to BytesIO buffer
   └── Stream file to client
   
   Response:
   - Media Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
   - Headers: Content-Disposition: attachment; filename=optimized-resume.docx
   - Body: Binary DOCX file
   
   Error Handling:
   └── 500: Document generation error

AI Integration
├── Ollama Service Communication
│  ├── HTTP requests to http://localhost:11434/api/generate
│  ├── Request format: {"model": "mistral", "prompt": str, "stream": false}
│  └── Response parsing: result["response"]
│
├── Error Scenarios
│  ├── Connection Error: Ollama not running
│  ├── Timeout: Ollama slow to respond
│  └── API Error: Invalid response or model issue
│
└── Logging
   ├── Request received
   ├── Ollama call initiated
   ├── Response received successfully
   └── Error details for debugging
```

---

## 5. Data Flow Diagrams

### 5.1 Resume Optimization Flow

```
User Action: Click "Optimize Resume"
     │
     ↓
Frontend: Validate inputs (resume & job description non-empty)
     │
     ├─→ [ERROR] Show error message → Stop
     │
     ↓
Frontend: Send POST request to /optimize with resume + job description
     │
     ↓
Backend: Receive & validate request
     │
     ├─→ [ERROR] Missing fields → 400 Bad Request → Stop
     │
     ↓
Backend: Create AI prompt combining:
     • Resume content
     • Job description
     • Optimization instructions
     └─ Total prompt ~700-1000 tokens
     │
     ↓
Backend: Call Ollama API at localhost:11434
     │
     ├─→ [ERROR] Connection failed → Return 500 "Ollama not running" → Stop
     ├─→ [ERROR] Timeout → Return 500 "Request timeout" → Stop
     ├─→ [ERROR] API error → Return 500 with error details → Stop
     │
     ↓
Ollama/Mistral: Process prompt
     • Analyze resume vs job match (typically 5-10 seconds)
     • Generate optimized resume sections
     • Identify missing skills
     • Calculate match score insights
     └─ Output: 500-1500 tokens of recommendation text
     │
     ↓
Backend: Receive response from Ollama
     │
     ↓
Backend: Parse AI response & extract:
     • Rewritten resume sections
     • Missing skills list
     • Match score (if present)
     • Improvement recommendations
     │
     ↓
Backend: Return JSON with "result" field
     │
     ↓
Frontend: Receive response
     │
     ↓
Frontend: Parse results for stats:
     • Match Score: Extract percentage from text
     • Analysis Type: Default "Comprehensive" or extract from response
     • Quality: Analyze response length/content quality
     • Status: "Optimized Successfully"
     │
     ↓
Frontend: Display in Output tab:
     • Stats cards with metrics
     • Full optimized resume text
     • Action buttons (Download, Copy, New)
     │
     ↓
User: Can now Download/Copy/Start New Optimization
```

### 5.2 Download Resume Flow

```
User Action: Click "Download as Word (.docx)"
     │
     ↓
Frontend: Collect data:
     • Original resume text
     • Optimized resume text (from results)
     │
     ↓
Frontend: Send POST request to /download-resume with both texts
     │
     ↓
Backend: Receive request
     │
     ↓
Backend: Create Word Document (python-docx)
     │
     ├─→ Set document properties:
     │   ├─ Margins: 0.5" top/bottom, 0.75" left/right
     │   └─ Default font: Calibri 11pt
     │
     ├─→ Add styled header:
     │   ├─ Title: "OPTIMIZED RESUME" (24pt, left-aligned, blue)
     │   ├─ Subtitle: "AI-Optimized for Job Match" (10pt, italic)
     │   └─ Separator line
     │
     ├─→ Add optimized content section:
     │   ├─ Parse lines from optimized_text parameter
     │   ├─ **Text** → Heading 2 (12pt, blue)
     │   ├─ - Text → Bullet point with proper indentation
     │   ├─ 1. Text → Numbered list
     │   └─ Regular text → Normal paragraph
     │   └─ Apply consistent spacing & line height (1.15)
     │
     ├─→ Page break
     │
     ├─→ Add original resume section:
     │   └─ Similar formatting as reference
     │
     ├─→ Add professional footer:
     │   └─ Attribution: "Generated by Resume Career Optimizer"
     │
     └─→ Save document to BytesIO buffer (in-memory file)
     │
     ↓
Backend: Return StreamingResponse:
     • Media type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
     • Headers: Content-Disposition: attachment; filename=optimized-resume.docx
     • Body: Binary DOCX file data
     │
     ↓
Frontend: Receive blob response
     │
     ↓
Frontend: Create blob object from response data:
     new Blob([response.data], {type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"})
     │
     ↓
Frontend: Create download link:
     • Create <a> element
     • Set href to blob URL (using URL.createObjectURL)
     • Set download attribute to "optimized-resume.docx"
     │
     ↓
Frontend: Trigger download:
     • Simulate link.click()
     • Browser automatically downloads file
     │
     ↓
Frontend: Cleanup:
     • Remove link element from DOM
     • Revoke blob URL (URL.revokeObjectURL)
     • Show success alert
     │
     ↓
User: File appears in Downloads folder!
     ├─ Location: /Users/vivek/Downloads/optimized-resume.docx
     └─ Ready to send to employers
```

---

## 6. File Structure

```
resume-career-optimizer/
│
├── backend/
│   ├── app.py                    # Main FastAPI application
│   ├── __pycache__/              # Python cache files (auto-generated)
│   └── .env                      # Environment variables (if needed)
│
├── frontend/
│   ├── package.json              # Node dependencies
│   ├── vite.config.js            # Vite build configuration
│   ├── eslint.config.js          # Linting rules
│   ├── index.html                # HTML entry point
│   ├── README.md                 # Frontend documentation
│   │
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Main React component
│   │   ├── App.css               # Styling
│   │   ├── index.css             # Global styles
│   │   │
│   │   └── assets/               # Static assets (if any)
│   │
│   ├── public/                   # Static files
│   ├── node_modules/             # npm dependencies (auto-generated)
│   └── dist/                     # Production build (auto-generated)
│
└── DESIGN_DOCUMENT.md            # This file
```

---

## 7. Key Implementation Details

### 7.1 PDF Parsing (Frontend)
```javascript
// Uses pdfjs-dist library
async function extractTextFromPDF(file) {
  const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
  let text = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    text += textContent.items.map(item => item.str).join(' ') + '\n';
  }
  
  return text;
}
```

### 7.2 DOCX Parsing (Frontend)
```javascript
// Uses mammoth library
async function extractTextFromDocx(file) {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}
```

### 7.3 AI Prompt Engineering (Backend)
```
The prompt sent to Ollama includes:
1. System context: "You are an expert resume writer and career advisor"
2. Task definition: "Compare resume with job description, rewrite to match better"
3. Resume content: Full user resume
4. Job description: Full job posting
5. Output format: Structured sections, missing skills, match score, recommendations

Total prompt: ~800-1200 tokens
Expected response: ~500-1500 tokens
```

### 7.4 Word Document Formatting (Backend)
```python
# Professional formatting applied:
1. Margins: 0.5" top/bottom, 0.75" left/right (1-inch on all sides)
2. Fonts: Calibri 11pt (default), headers in 12pt-24pt
3. Colors: Dark blue for headings (RGB 0, 51, 102)
4. Spacing: 1.15 line height, 6pt after bullets, 4pt after paragraphs
5. Alignment: Left-aligned throughout (professional standard)
6. Lists: Proper bullet and numbered list formatting
7. Pages: Two-page layout (optimized content + original reference)
```

---

## 8. Error Handling Strategy

### Frontend Error Handling
```javascript
try {
  // Make API call
  const response = await axios.post('/optimize', data);
  
} catch (error) {
  if (error.response?.status === 400) {
    // Bad request - validation error
    alert('Please enter both resume and job description');
  } else if (error.response?.status === 500) {
    // Server error - check error message
    alert(`Error: ${error.response.data.detail}`);
  } else if (error.message === 'Network Error') {
    alert('Cannot connect to backend server. Is it running?');
  } else {
    alert('Unexpected error. Check console for details.');
    console.error(error);
  }
}
```

### Backend Error Handling
```python
@app.post("/optimize")
def optimize_resume(data: OptimizationRequest):
    try:
        # Validate
        if not data.resume_text or not data.job_text:
            raise HTTPException(status_code=400, detail="Both fields required")
        
        # Process
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=120)
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
        
        return {"result": response.json().get("response")}
        
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=500, detail="Ollama is not running")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=500, detail="Request timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
```

---

## 9. Performance Considerations

### Frontend Performance
| Operation | Expected Time | Optimization |
|-----------|---------------|--------------|
| PDF parsing (2-3 pages) | 500ms - 2s | Async, web workers for large files |
| DOCX parsing | 100-500ms | Synchronous (fast) |
| API request | 5-30s | Network dependent |
| UI rendering | <100ms | React optimization |
| Download file generation | 1-2s | Happens server-side |

### Backend Performance
| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Request validation | <10ms | Pydantic validation |
| Prompt building | <50ms | String concatenation |
| Ollama API call | 5-15s | Depends on model size |
| Response parsing | <100ms | Regex/string operations |
| DOCX generation | 1-2s | python-docx serialization |
| Total /optimize request | 6-20s | Dominated by Ollama |
| Total /download-resume request | 2-5s | Dominated by DOCX generation |

### Optimization Strategies
- Frontend: Use Web Workers for large PDF parsing
- Backend: Cache prompt templates
- Backend: Use async/await for I/O operations
- Ollama: Consider quantized models for faster inference
- Network: Use compression for large responses

---

## 10. Security Considerations

### Current Implementation (Development Mode)
```
⚠️ CORS: allow_origins=["*"]  # Allow all origins
⚠️ No authentication required
⚠️ No rate limiting
✅ Data stays local (no external API calls beyond Ollama)
✅ HTTPS not enabled (OK for localhost development)
```

### Production Recommendations
```
🔒 CORS: Restrict to specific frontend domains
🔒 Add authentication/authorization
🔒 Implement rate limiting
🔒 Enable HTTPS/TLS encryption
🔒 Add input validation & sanitization
🔒 Use environment variables for sensitive config
🔒 Add request logging & monitoring
🔒 Implement request size limits
🔒 Add CORS preflight handling
```

---

## 11. Deployment Architecture

### Local Development Setup (Current)
```
User's Machine (macOS)
├── Frontend Development Server
│   ├── URL: http://localhost:5173
│   ├── Command: npm run dev (in /frontend)
│   ├── Auto-reload on file changes
│   └── Dev tools: React DevTools
│
├── Backend Development Server
│   ├── URL: http://127.0.0.1:8000
│   ├── Command: python3 -m uvicorn backend.app:app --reload
│   ├── Auto-reload on code changes
│   └── Swagger docs: http://127.0.0.1:8000/docs
│
└── Ollama AI Service
    ├── URL: http://localhost:11434
    ├── Command: ollama serve (background)
    ├── Models: Mistral loaded (~4.4GB RAM)
    └── Status: brew services list | grep ollama
```

### Potential Cloud Deployment
```
Deployment Option 1: Heroku/Railway
├── Frontend: Deployed to Vercel/Netlify
├── Backend: FastAPI on Heroku/Railway
└── Ollama: Self-hosted dedicated server or AWS SageMaker

Deployment Option 2: Docker Containers
├── Frontend container (Node.js + Vite)
├── Backend container (Python + FastAPI)
└── Ollama container (Local AI service)

Deployment Option 3: AWS/GCP/Azure
├── Frontend: CloudFront/CDN + S3
├── Backend: Lambda/Cloud Run + API Gateway
├── Ollama: EC2/Compute Engine self-hosted
```

---

## 12. API Documentation

### Base URL
```
Local Development: http://127.0.0.1:8000
```

### Available Endpoints

#### 1. Health Check
```
GET /
Response: {"message": "Resume Optimizer API is running"}
Status: 200 OK
```

#### 2. Optimize Resume
```
POST /optimize
Content-Type: application/json

Request Body:
{
  "resume_text": "John Doe\n...[resume content]...",
  "job_text": "Senior Software Engineer\n...[job description]..."
}

Response (200 OK):
{
  "result": "**Optimized Resume Sections**\n... [AI-generated optimization]..."
}

Error Responses:
400 Bad Request: Missing resume_text or job_text
500 Internal Server Error: Ollama not running or other errors
```

#### 3. Download Resume
```
POST /download-resume
Content-Type: application/json

Request Body:
{
  "resume_text": "Original resume content",
  "optimized_text": "AI-optimized resume (result from /optimize)"
}

Response (200 OK):
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename=optimized-resume.docx
[Binary DOCX file]

Error Responses:
500 Internal Server Error: Document generation failed
```

---

## 13. Testing Strategy

### Frontend Testing
```javascript
// Test cases needed:
1. File upload functionality
   - Try uploading PDF
   - Try uploading DOCX
   - Try uploading unsupported format
   
2. Text input validation
   - Submit with empty resume
   - Submit with empty job description
   - Submit with both filled
   
3. API communication
   - Mock successful response
   - Mock error response
   - Mock network timeout
   
4. UI state transitions
   - Tab switching
   - Loading state display
   - Results display
   - Stats calculation
```

### Backend Testing
```python
# Test cases needed:
1. /optimize endpoint
   - Valid request with both fields
   - Missing resume_text
   - Missing job_text
   - Ollama connection error
   - Timeout handling
   
2. /download-resume endpoint
   - Valid document generation
   - Empty content handling
   - Large content handling
   - File corruption scenarios
   
3. Error handling
   - Connection errors to Ollama
   - Timeout scenarios
   - Invalid JSON requests
   - Large payload limits
```

### Integration Testing
```
End-to-end flow testing:
1. User uploads PDF resume
2. User pastes job description
3. User clicks "Optimize Resume"
4. AI optimization completes successfully
5. User sees stats dashboard
6. User downloads Word document
7. Document opens and displays correctly
```

---

## 14. Troubleshooting Guide

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Backend won't start | Port 8000 in use | `lsof -i :8000` then kill process |
| "Ollama is not running" error | Ollama service stopped | `ollama serve` in terminal |
| "Cannot connect to backend" | Frontend/backend URL mismatch | Check both running on correct ports |
| CORS error in console | Frontend port mismatch | Verify axios baseURL in App.jsx |
| PDF parsing fails | Large/corrupted PDF | Try different PDF or check file |
| Word download doesn't work | Browser settings | Check Downloads folder, allow pop-ups |
| Slow optimization | Ollama overloaded | Increase timeout, restart Ollama |
| Out of memory error | Ollama model too large | Reduce model size or increase RAM |

---

## 17. Ollama Implementation Details

### 17.1 What is Ollama?

**Ollama** is an open-source platform that allows you to run large language models locally on your machine without needing cloud APIs. It simplifies the process of downloading, installing, and running LLMs with a simple command-line interface and HTTP API.

#### Key Characteristics:
- **Local-First:** Runs entirely on your machine (or dedicated server)
- **Privacy-Preserving:** No data sent to external services
- **Cost-Free:** No API charges or subscription fees
- **Easy to Use:** Single command to start (`ollama serve`)
- **Multiple Models:** Support for Mistral, Llama, Phi, and 100+ models
- **Fast Inference:** Optimized for CPU and GPU acceleration
- **REST API:** HTTP endpoints for integration with applications

### 17.2 Why Ollama for This Project?

| Requirement | Solution | Benefit |
|------------|----------|---------|
| Free AI processing | Ollama local models | No API costs, unlimited requests |
| No rate limits | Self-hosted inference | Process as many resumes as needed |
| Privacy | Local processing | Data never leaves your machine |
| Student-friendly | Open source | Perfect for learning & experimentation |
| Offline capability | Runs locally | Works without internet connection |
| Fast response | Optimized models | Sub-second inference times |

### 17.3 Ollama Installation & Setup

#### Installation Command
```bash
# macOS (using Homebrew)
brew install ollama

# Or download from ollama.ai
```

#### Starting Ollama Service
```bash
# Start Ollama in background
ollama serve

# Or with brew services (runs as background service)
brew services start ollama

# Verify it's running
brew services list | grep ollama
```

#### Downloading Models
```bash
# Download Mistral model (4.4GB)
ollama pull mistral

# List available models
ollama list

# Show model details
ollama show mistral
```

### 17.4 Ollama API Integration

#### API Endpoint
```
Base URL: http://localhost:11434
Main Endpoint: POST /api/generate
```

#### Request Format
```json
{
  "model": "mistral",
  "prompt": "Your prompt here...",
  "stream": false,
  "temperature": 0.7,
  "top_k": 40,
  "top_p": 0.9,
  "repeat_last_n": 64,
  "repeat_penalty": 1.1
}
```

#### Response Format
```json
{
  "model": "mistral",
  "created_at": "2024-03-28T21:04:44.000Z",
  "response": "Generated response text...",
  "done": true,
  "context": [tokens...],
  "total_duration": 5123456789,
  "load_duration": 1234567,
  "prompt_eval_count": 42,
  "prompt_eval_duration": 2345678,
  "eval_count": 100,
  "eval_duration": 1543210
}
```

### 17.5 Backend Integration with Ollama

#### Python Code Integration
```python
import requests
import json
import logging

OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"

def call_ollama(prompt: str, timeout: int = 120) -> str:
    """
    Call Ollama API with resume optimization prompt
    
    Args:
        prompt: The full prompt including resume and job description
        timeout: Request timeout in seconds
    
    Returns:
        Generated text from Mistral model
    
    Raises:
        ConnectionError: If Ollama service is not running
        TimeoutError: If request takes too long
    """
    try:
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "temperature": 0.7,  # Balanced creativity/consistency
            "top_k": 40,
            "top_p": 0.9
        }
        
        logging.info(f"Calling Ollama with prompt length: {len(prompt)}")
        
        response = requests.post(
            OLLAMA_API_URL,
            json=payload,
            timeout=timeout
        )
        
        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.text}")
        
        result = response.json()
        generated_text = result.get("response", "")
        
        logging.info(f"Ollama response length: {len(generated_text)}")
        logging.info(f"Inference time: {result.get('eval_duration', 0) / 1e9:.2f}s")
        
        return generated_text
        
    except requests.exceptions.ConnectionError:
        logging.error("Cannot connect to Ollama at localhost:11434")
        raise ConnectionError(
            "Ollama service is not running. "
            "Start it with: ollama serve"
        )
    except requests.exceptions.Timeout:
        logging.error("Ollama request timed out")
        raise TimeoutError(
            "Ollama took too long to respond. "
            "Try again or increase timeout."
        )
```

#### Usage in FastAPI Endpoint
```python
@app.post("/optimize")
def optimize_resume(data: OptimizationRequest):
    try:
        # Validate inputs
        if not data.resume_text or not data.job_text:
            raise HTTPException(status_code=400, detail="Both fields required")
        
        # Build detailed optimization prompt
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
        
        # Call Ollama
        result = call_ollama(prompt)
        
        return {"result": result}
        
    except (ConnectionError, TimeoutError) as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 17.6 Model Selection: Why Mistral?

#### Mistral Model Characteristics
```
Name:           Mistral 7B
Size:           4.4 GB (quantized)
Parameters:     7 Billion
Type:           Decoder-only Transformer
Training Data:  1 Trillion tokens (up to Sept 2023)
License:        Apache 2.0 (Open Source)
```

#### Performance Benchmarks
| Task | Score | Speed |
|------|-------|-------|
| MMLU (General Knowledge) | 64.2% | ~50ms per token (CPU) |
| HellaSwag (Reasoning) | 79.5% | ~100ms per token (CPU) |
| TruthfulQA (Truthfulness) | 42.9% | Fast |
| GSM8k (Math) | 35.4% | Moderate |
| Inference Speed (CPU) | Optimized | 5-15s per request |

#### Why Mistral over Alternatives?

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| **Mistral** | 7B | Fast ⚡ | Good ✓ | **Resume Optimization** ✓ |
| Llama 2 | 7B-70B | Medium | Better | Larger projects |
| Phi-2 | 2.7B | Very Fast | Decent | Resource-constrained |
| Neural Chat | 7B | Medium | Good | Chat-focused |
| OpenHermes | 7B | Fast | Very Good | Creative writing |

**Chosen because:** Perfect balance of speed, quality, and size for resume optimization on local machines.

### 17.7 Performance Metrics

#### Typical Request Flow
```
1. Request received by backend          : ~1ms
2. Prompt construction                 : ~10ms
3. Network to Ollama                   : ~5ms
4. Ollama preprocessing                : ~100ms
5. Model inference (main)              : 5-12 seconds ⭐ (main bottleneck)
6. Response streaming                  : ~50ms
7. Response parsing                    : ~10ms
───────────────────────────────────────────────
Total time per request                 : 5-13 seconds
```

#### Resource Usage
```
Memory (RAM):
├── Base system        : ~2-3 GB
├── Model loaded       : ~8-10 GB (Mistral quantized)
├── Active inference   : ~2-4 GB
└── Total recommended  : 16+ GB RAM

CPU/GPU:
├── Ollama supports   : CPU + NVIDIA GPU + Metal (Apple Silicon)
├── Apple Silicon     : Excellent optimization (Metal acceleration)
├── Intel/AMD CPU     : Functional (slower but works)
└── NVIDIA GPU        : Fastest option if available

Disk Space:
├── Mistral model     : 4.4 GB
├── Ollama binary     : ~200 MB
├── Cache & indices   : ~1 GB
└── Total needed      : ~6 GB free space
```

### 17.8 Ollama Service Management

#### Check Service Status
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Get model info
curl http://localhost:11434/api/show -d '{"name":"mistral"}'

# Using brew services
brew services list | grep ollama
```

#### Troubleshooting Ollama

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | Ollama not running | `ollama serve` |
| Port 11434 in use | Another process using port | `lsof -i :11434` then kill |
| Model not found | Model not downloaded | `ollama pull mistral` |
| Out of memory | Insufficient RAM | Close other apps or upgrade RAM |
| Slow responses | CPU bottleneck | Consider GPU or more RAM |
| Model corrupted | Download interrupted | Delete & re-download model |

#### Starting/Stopping Ollama
```bash
# Start in foreground (shows logs)
ollama serve

# Start as background service (macOS)
brew services start ollama

# Stop background service
brew services stop ollama

# Restart service
brew services restart ollama

# View service logs
log stream --predicate 'process == "ollama"'
```

### 17.9 Ollama API Documentation

#### Available Endpoints

**1. Generate Text**
```
POST /api/generate
Purpose: Generate text based on prompt
Request: {model, prompt, stream, temperature, top_k, top_p}
Response: {response, done, context, metrics}
```

**2. List Models**
```
GET /api/tags
Purpose: Get all downloaded models
Response: {models: [{name, size, digest, modified}]}
```

**3. Show Model Details**
```
POST /api/show
Purpose: Get detailed model information
Request: {name: "model-name"}
Response: {modelfile, parameters, template, details}
```

**4. Pull Model**
```
POST /api/pull
Purpose: Download a model
Request: {name: "model-name", stream: false}
Response: {status, digest, total, completed}
```

**5. Embeddings**
```
POST /api/embeddings
Purpose: Generate vector embeddings
Request: {model, prompt}
Response: {embedding: [vector_values]}
```

### 17.10 Future Enhancements with Ollama

```
Phase 2:
├── Multi-model support (Llama, Phi, etc.)
├── Model fine-tuning for resume-specific tasks
├── Embedding-based resume similarity
└── Local RAG (Retrieval Augmented Generation)

Phase 3:
├── Model quantization for faster inference
├── GPU acceleration (CUDA/Metal)
├── Batch processing pipeline
└── Model caching strategies

Phase 4:
├── Custom fine-tuned models
├── Resume database search with embeddings
├── Industry-specific model variants
└── Continuous model improvement
```

---

## 18. Conclusion

## 18. Future Enhancement Roadmap

### Phase 2: Enhanced Features
- [ ] Multiple resume optimization versions
- [ ] Save/load optimization history
- [ ] Custom Ollama model selection
- [ ] Resume template library
- [ ] Batch resume optimization
- [ ] Job market insights
- [ ] Skill gap analysis

### Phase 3: Production Ready
- [ ] User authentication
- [ ] Cloud deployment (AWS/GCP)
- [ ] Mobile responsive improvements
- [ ] Offline mode support
- [ ] Real-time collaboration
- [ ] Export to PDF format
- [ ] Multi-language support

### Phase 4: Advanced AI Features
- [ ] Cover letter generation
- [ ] Interview prep recommendations
- [ ] Salary negotiation insights
- [ ] Job market trend analysis
- [ ] LinkedIn profile optimization
- [ ] Career path recommendations

---

## 19. Conclusion

The **Resume Career Optimizer** demonstrates a modern full-stack architecture combining:
- ✅ React frontend for user-friendly interface
- ✅ FastAPI backend for robust REST API
- ✅ Ollama local AI for unlimited, free optimization
- ✅ Python-docx for professional document generation
- ✅ Error handling & logging throughout

This design provides a **scalable, maintainable, and user-friendly** application perfect for students seeking resume optimization without API costs or rate limits.

---

**Document Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Production Ready (Local Development)
