# Resume Career Optimizer - Testing Guide & Running Instructions

## ✅ System Status - ALL SERVICES RUNNING

### Running Services:

| Service | URL | Status | Port | Details |
|---------|-----|--------|------|---------|
| **Ollama AI** | http://localhost:11434 | ✅ Running | 11434 | Mistral 7B Model Loaded |
| **Backend API** | http://127.0.0.1:8000 | ✅ Running | 8000 | FastAPI Server |
| **Frontend UI** | http://localhost:5173 | ✅ Running | 5173 | Vite Dev Server |

---

## 🚀 Quick Start - Running Everything from Scratch

### Step 1: Verify Prerequisites
```bash
# Check if Ollama is installed
which ollama

# Check Python and Node versions
python3 --version  # Should be 3.8+
node --version     # Should be 16+
npm --version
```

### Step 2: Terminal 1 - Start Ollama AI Service
```bash
# Ollama (might already be running)
ollama serve

# Output should show:
# Listening on 127.0.0.1:11434
```

### Step 3: Terminal 2 - Start Backend API Server
```bash
cd /Users/vivek/Downloads/resume-career-optimizer
source venv/bin/activate
cd backend
python3 app.py

# Output should show:
# INFO:__main__:Using Ollama with model: mistral
# INFO:__main__:Ollama API URL: http://localhost:11434/api/generate
# Starting FastAPI server on http://127.0.0.1:8000
```

### Step 4: Terminal 3 - Start Frontend Dev Server
```bash
cd /Users/vivek/Downloads/resume-career-optimizer/frontend
npm run dev

# Output should show:
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

---

## 🧪 Testing the Application

### Test 1: Health Check Endpoint
**In any terminal:**
```bash
curl http://127.0.0.1:8000/

# Expected Response:
# {"message":"Resume Optimizer API is running"}
```

### Test 2: Check Available Models
**In any terminal:**
```bash
curl http://localhost:11434/api/tags | python3 -m json.tool

# Should show:
# "models": [
#   {
#     "name": "mistral:latest",
#     "size": 4372824384,
#     ...
#   }
# ]
```

### Test 3: Manual Browser Testing (RECOMMENDED)

1. **Open Frontend**: Navigate to http://localhost:5173

2. **Input Tab**:
   - Paste your resume text or upload a PDF/DOCX file
   - Paste the job description

3. **Click "Optimize Resume"**:
   - Wait for the AI to analyze (this takes 30-60 seconds for first response)
   - View results in the Output tab
   - Match score will be displayed
   - See missing skills and recommendations

4. **Download Resume**:
   - Click "Download as DOCX"
   - Professional Word document will be generated
   - Check your Downloads folder

### Test 4: Sample Test Data

**Sample Resume:**
```
John Doe
Senior Software Engineer at Tech Corp (2020-2024)
- Built web applications using Python, React, and Node.js
- Led a team of 5 developers
- Implemented microservices architecture
- Experience with AWS, Docker, Kubernetes

Skills: Python, JavaScript, React, Node.js, PostgreSQL, Docker, Kubernetes, AWS, REST APIs
```

**Sample Job Description:**
```
Senior Software Engineer - Full Stack

Requirements:
- 5+ years of software development experience
- Strong Python and JavaScript skills
- Experience with React or Vue.js
- Backend development with Node.js or Django
- Cloud platform experience (AWS or GCP)
- Microservices and containerization (Docker)
- Team leadership or mentoring experience
- Experience with CI/CD pipelines
```

---

## 🔧 Troubleshooting

### Issue: Backend not starting
**Solution:**
```bash
# Kill any existing process on port 8000
lsof -i :8000
kill -9 <PID>

# Then restart backend
cd backend && python3 app.py
```

### Issue: Ollama connection error
**Solution:**
```bash
# Verify Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
ollama serve
```

### Issue: Frontend won't load
**Solution:**
```bash
# Clear npm cache and reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: Slow optimization response
**Normal Behavior:** First LLM response may take 30-120 seconds depending on:
- Mistral model processing time
- System CPU/RAM availability
- Resume and job description length

Subsequent requests are faster as the model stays in memory.

---

## 📊 API Endpoints Reference

### 1. Health Check
```
GET /
curl http://127.0.0.1:8000/
```

**Response:**
```json
{"message": "Resume Optimizer API is running"}
```

---

### 2. Resume Optimization
```
POST /optimize
```

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Your resume here...",
    "job_text": "Job description here..."
  }'
```

**Response:**
```json
{
  "result": "Expert analysis with optimized resume, missing skills, recommendations, and match score..."
}
```

**Time Taken:** 30-120 seconds (first response), 10-30 seconds (subsequent)

---

### 3. Download Optimized Resume
```
POST /download-resume
```

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/download-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "original resume...",
    "optimized_text": "optimized resume from AI..."
  }' \
  --output optimized_resume.docx
```

**Response:** Binary Word document (.docx file)

---

## 📈 System Architecture Overview

```
┌─────────────────────────────────────────┐
│   Browser (React + Vite)               │
│   http://localhost:5173                │
│  ├─ Upload Resume (PDF/DOCX)           │
│  ├─ Enter Job Description              │
│  ├─ Request Optimization               │
│  └─ Display Results                    │
└──────────────┬──────────────────────────┘
               │ HTTP REST API
               │ (Axios)
               ↓
┌──────────────────────────────────────────┐
│   FastAPI Backend                        │
│   http://127.0.0.1:8000                 │
│  ├─ GET  /              (Health Check)   │
│  ├─ POST /optimize      (AI Analysis)    │
│  └─ POST /download-resume (DOCX Export)  │
└──────────────┬──────────────────────────┘
               │ HTTP API
               │ (python-requests)
               ↓
┌──────────────────────────────────────────┐
│   Ollama AI Service                      │
│   http://localhost:11434                │
│  └─ Mistral 7B Model                    │
│     (4.4 GB - Local Inference)          │
└──────────────────────────────────────────┘
```

---

## ✨ Features to Test

- ✅ PDF file upload and text extraction
- ✅ DOCX file upload and text extraction
- ✅ Manual resume text input
- ✅ Job description input
- ✅ AI resume analysis
- ✅ Match score calculation
- ✅ Missing skills identification
- ✅ Professional recommendations
- ✅ Copy to clipboard functionality
- ✅ Download as DOCX document
- ✅ Error handling and validation
- ✅ Loading states and feedback
- ✅ Tab switching (Input/Output)

---

## 🎯 Success Indicators

Your application is working correctly when:

1. ✅ All three services start without errors
2. ✅ Frontend loads at http://localhost:5173
3. ✅ Backend health check returns JSON
4. ✅ Ollama responds with model information
5. ✅ Resume can be uploaded or pasted
6. ✅ Optimization request processes (takes time for LLM)
7. ✅ Results display in Output tab
8. ✅ Can copy results to clipboard
9. ✅ Can download Word document
10. ✅ Word document opens correctly in MS Word

---

## 📝 Notes

- **LLM Processing Time**: Mistral 7B typically takes 30-120 seconds for the first response. This is normal for local LLM inference.
- **Privacy**: All data processing happens locally. No data is sent to any external server.
- **Unlimited**: No API rate limits. Optimize as many resumes as you want.
- **Cost-Free**: No subscription or payment required.
- **Offline**: Once models are downloaded, works completely offline.

---

## 🆘 Support & Debugging

For detailed logging, check the backend terminal for:
- API request details
- Ollama connection status
- Error messages
- Processing times

Look in the browser console (F12) for frontend errors and network requests.

---

Happy testing! 🎉
