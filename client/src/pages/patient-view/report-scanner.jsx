import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./report-scanner.css";

export default function ReportScanner() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrOpen, setOcrOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dropRef = useRef(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || ''}/api/reports/analyze`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.data && response.data.error) {
        setError(response.data.error || response.data.details || "Analysis failed");
        setAnalysis("");
        setOcrText("");
      } else {
        // ensure analysis is a string before rendering; stringify objects
        const raw = response.data.analysis;
        if (raw && typeof raw === "object") {
          setAnalysis(JSON.stringify(raw, null, 2));
        } else {
          setAnalysis(raw || "");
        }
        setOcrText(response.data.ocr_text || "");
      }
    } catch (err) {
      if (err.message === 'Network Error') {
        setError('Unable to reach server. Make sure backend is running on port 5000.');
      } else {
        setError(err.response?.data?.details || err.message || "Error analyzing report.");
      }
      console.error('analyze error', err);
      setAnalysis("");
      setOcrText("");
    }

    setLoading(false);
  };

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const onFileChange = (f) => {
    setFile(f);
    setError("");
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (f && f.type && f.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    const f = dt.files && dt.files[0];
    if (f) onFileChange(f);
    dropRef.current.classList.remove("drag-over");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add("drag-over");
  };

  const handleDragLeave = () => {
    dropRef.current.classList.remove("drag-over");
  };

  const copyOcr = async () => {
    try {
      await navigator.clipboard.writeText(ocrText || "");
    } catch (err) {
      // ignore
    }
  };

  const downloadOcr = () => {
    const blob = new Blob([ocrText || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name || "ocr") + ".txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const highlightParts = (text, term) => {
    if (!term) return [text];
    try {
      const escaped = term.replace(/[.*+?^${""}()|[\\]\\]/g, "\\$&");
      const parts = [];
      let idx = 0;
      const lower = text.toLowerCase();
      const t = term.toLowerCase();
      while (idx < text.length) {
        const pos = lower.indexOf(t, idx);
        if (pos === -1) {
          parts.push(text.slice(idx));
          break;
        }
        if (pos > idx) parts.push(text.slice(idx, pos));
        parts.push({ match: text.slice(pos, pos + t.length), key: pos });
        idx = pos + t.length;
      }
      return parts.length ? parts : [text];
    } catch (e) {
      return [text];
    }
  };

  return (
    <div className="app-root">
      <div className="container">
        <header className="header">
          <h1>Medical Report Analyzer</h1>
          <p className="subtitle">Fast OCR + AI-driven analysis</p>
        </header>

        <section
          className="uploader"
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="file-input">
            <input
              id="file"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => onFileChange(e.target.files[0])}
            />
            <label htmlFor="file" className="file-label">
              <div className="file-label-inner">
                <div className="file-meta">
                  <strong>{file ? file.name : "Choose a PDF or image file"}</strong>
                  <span className="muted">Drag & drop supported</span>
                </div>
                {filePreview ? (
                  <img src={filePreview} alt="preview" className="thumb" />
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="file-icon">
                    <path d="M12 2v10" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 12l7-7 7 7" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </label>
          </div>

          <div className="actions">
            <button className="primary" onClick={handleUpload} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Report"}
            </button>
            <button
              className="ghost"
              onClick={() => {
                setFile(null);
                setAnalysis("");
                setOcrText("");
                if (filePreview) {
                  URL.revokeObjectURL(filePreview);
                }
                setFilePreview(null);
              }}
            >
              Reset
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </section>

        <section className="results">
          <div className="pane ocr-pane">
            <div className="pane-header" onClick={() => setOcrOpen((s) => !s)}>
              <h2>Extracted Text (OCR)</h2>
              <div className="pane-actions">
                <input
                  placeholder="Search OCR..."
                  value={searchTerm}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="icon-btn" title="Copy" onClick={(e) => { e.stopPropagation(); copyOcr(); }}>
                  Copy
                </button>
                <button className="icon-btn" title="Download" onClick={(e) => { e.stopPropagation(); downloadOcr(); }}>
                  Download
                </button>
                <button className={`chev ${ocrOpen ? "open" : ""}`} aria-hidden>
                  ▾
                </button>
              </div>
            </div>

            <div className={`ocr-collapse ${ocrOpen ? "open" : ""}`}>
              {ocrText ? (
                <pre className="ocr-box">
                  {highlightParts(ocrText, searchTerm).map((part, i) =>
                    typeof part === "string" ? (
                      part
                    ) : (
                      <mark key={part.key} className="highlight">
                        {part.match}
                      </mark>
                    )
                  )}
                </pre>
              ) : (
                <div className="placeholder">No OCR output yet.</div>
              )}
            </div>
          </div>

          <div className="pane">
            <h2>AI Analysis</h2>
            <pre className="analysis-box">{analysis || "No analysis yet."}</pre>
          </div>
        </section>

        <footer className="footer">
          Disclaimer: This tool is for informational purposes only. Consult a licensed doctor for medical advice.
        </footer>
      </div>
    </div>
  );
}
