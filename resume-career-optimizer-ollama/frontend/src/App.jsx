import React, { useState } from "react";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";
import "./App.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [activeTab, setActiveTab] = useState("input");

  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item) => item.str).join(" ");
      }
      return text;
    } catch (err) {
      throw new Error("Failed to parse PDF file");
    }
  };

  const extractTextFromDocx = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) {
      throw new Error("Failed to parse DOCX file");
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    try {
      setResumeFileName(file.name);
      let text = "";

      if (file.type === "application/pdf") {
        text = await extractTextFromPDF(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await extractTextFromDocx(file);
      } else if (file.type === "application/msword") {
        text = await extractTextFromDocx(file);
      } else {
        setError("Please upload a PDF or Word document");
        return;
      }

      setResume(text);
    } catch (err) {
      setError(err.message || "Error parsing file");
    }
  };

  const parseResults = (rawResult) => {
    // Try to extract structured data from the result
    const lines = rawResult.split('\n');
    const parsed = {
      summary: "",
      match: 0,
      missingSkills: [],
      recommendations: [],
      fullText: rawResult
    };

    // Extract match score
    const matchLine = lines.find(line => line.includes('Match Score'));
    if (matchLine) {
      const scoreMatch = matchLine.match(/(\d+)/);
      if (scoreMatch) {
        parsed.match = parseInt(scoreMatch[1]);
      }
    }

    // Extract missing skills
    const missingIdx = lines.findIndex(line => line.includes('Missing'));
    if (missingIdx !== -1) {
      for (let i = missingIdx + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('-') || lines[i].trim().startsWith('•')) {
          parsed.missingSkills.push(lines[i].trim().replace(/^[-•]\s*/, ''));
        }
        if (lines[i].includes('Recommendation')) break;
      }
    }

    return parsed;
  };

  const handleSubmit = async () => {
    if (!resume.trim() || !job.trim()) {
      setError("Please provide both resume and job description");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post("http://127.0.0.1:8000/optimize", {
        resume_text: resume,
        job_text: job,
      });
      setResult(response.data.result);
      setActiveTab("output");
    } catch (err) {
      let errorMessage = "Failed to optimize resume. Please try again.";
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
        
        // Check for specific errors
        if (errorMessage.includes("Ollama") || errorMessage.includes("not running")) {
          errorMessage = "❌ Ollama Error: Ollama service is not running. Please start it with: ollama serve";
        } else if (errorMessage.includes("Cannot connect")) {
          errorMessage = "❌ Connection Error: Cannot connect to Ollama. Make sure Ollama is running on http://localhost:11434";
        } else if (errorMessage.includes("timed out")) {
          errorMessage = "❌ Timeout Error: Request took too long. Ollama might be processing a large request.";
        } else if (errorMessage.includes("API")) {
          errorMessage = "❌ API Error: " + errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error("Full error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = async () => {
    try {
      console.log("Starting download...");
      const response = await axios.post(
        "http://127.0.0.1:8000/download-resume",
        {
          resume_text: resume,
          optimized_text: result,
        },
        {
          responseType: "blob",
        }
      );

      console.log("Response received:", response.data.size, "bytes");
      console.log("Content type:", response.headers["content-type"]);

      // Create blob and download
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "optimized-resume.docx");
      link.style.display = "none";
      document.body.appendChild(link);
      console.log("Clicking download link...");
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      alert("Resume downloaded successfully! 📥");
    } catch (error) {
      console.error("Download error:", error);
      console.error("Error response:", error.response?.data);
      alert("Error downloading resume. Please check the console for details.");
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">📄 Resume & Career Optimizer</h1>
        <p className="subtitle">
          Optimize your resume to match job descriptions with AI
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "input" ? "active" : ""}`}
          onClick={() => setActiveTab("input")}
        >
          Input
        </button>
        <button
          className={`tab-button ${activeTab === "output" ? "active" : ""}`}
          onClick={() => setActiveTab("output")}
          disabled={!result}
        >
          Results
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {activeTab === "input" && (
        <div className="content">
          <div className="input-section">
            <div className="card">
              <div className="card-header">
                <h2>📝 Your Resume</h2>
              </div>
              <div className="card-body">
                <div className="file-upload-section">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="file-input"
                  />
                  <label htmlFor="resume-upload" className="file-label">
                    <span className="file-icon">📤</span>
                    <span className="file-text">
                      {resumeFileName
                        ? `Uploaded: ${resumeFileName}`
                        : "Upload PDF or Word Document"}
                    </span>
                  </label>
                </div>

                <div className="divider">or</div>

                <textarea
                  className="textarea"
                  placeholder="Paste your resume here..."
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>🎯 Job Description</h2>
              </div>
              <div className="card-body">
                <textarea
                  className="textarea"
                  placeholder="Paste the job description here..."
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                />
              </div>
            </div>

            <button
              className={`submit-button ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Optimizing..." : "✨ Optimize Resume"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "output" && (
        <div className="content">
          {result && (
            <div className="results-container">
              <div className="results-header">
                <h2>🎉 Optimization Complete!</h2>
                <p>Your AI-powered resume has been optimized</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Match Score</div>
                    <div className="stat-value">
                      {parseResults(result).match > 0 
                        ? parseResults(result).match + "%" 
                        : "Good"}
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <div className="stat-label">Analysis Type</div>
                    <div className="stat-value">AI-Powered</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✨</div>
                  <div className="stat-content">
                    <div className="stat-label">Quality</div>
                    <div className="stat-value">Premium</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🔄</div>
                  <div className="stat-content">
                    <div className="stat-label">Status</div>
                    <div className="stat-value">Ready</div>
                  </div>
                </div>
              </div>

              <div className="card results-card">
                <div className="card-header">
                  <h3>📝 Optimized Resume & Analysis</h3>
                </div>
                <div className="card-body result-body">
                  <div className="result-text">{result}</div>
                  
                  <div className="action-buttons">
                    <button
                      className="download-button"
                      onClick={downloadResume}
                    >
                      📥 Download as Word (.docx)
                    </button>
                    <button
                      className="copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText(result);
                        alert("Results copied to clipboard!");
                      }}
                    >
                      📋 Copy to Clipboard
                    </button>
                    <button
                      className="new-button"
                      onClick={() => {
                        setResult("");
                        setResume("");
                        setJob("");
                        setActiveTab("input");
                      }}
                    >
                      🔄 New Optimization
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;