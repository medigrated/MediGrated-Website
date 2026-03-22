import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { UploadCloud, FileText, CheckCircle, Copy, Download, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportScanner() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrOpen, setOcrOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
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
    setIsDragOver(false);
    const dt = e.dataTransfer;
    const f = dt.files && dt.files[0];
    if (f) onFileChange(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const copyOcr = async () => {
    try {
      await navigator.clipboard.writeText(ocrText || "");
    } catch (err) {}
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
      const escaped = term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
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
    <div className="min-h-[calc(100vh-80px)] w-full py-8 px-4 flex justify-center items-start">
      <div className="w-full max-w-5xl bg-card text-card-foreground rounded-3xl shadow-large border border-border p-6 md:p-10 animate-fade-in backdrop-blur-xl bg-card/95">
        
        {/* Header */}
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-primary bg-clip-text text-transparent inline-block">
            Medical Report Scanner
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
            Upload your medical reports (PDF or Image) for instant, AI-driven insights and structural OCR extraction.
          </p>
        </div>

        {/* Upload Section */}
        <div className="space-y-6">
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative group flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-3xl transition-all duration-300 p-6 cursor-pointer
              ${isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted/30 hover:border-primary/50 hover:bg-muted/5"}
            `}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => onFileChange(e.target.files[0])}
            />
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-4">
              {filePreview ? (
                <div className="relative">
                  <img src={filePreview} alt="preview" className="h-24 w-24 object-cover rounded-2xl shadow-md border border-border" />
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8" />
                </div>
              )}
              
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-foreground">
                  {file ? file.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">
                  SVG, PNG, JPG, or PDF (MAX 15MB)
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={handleUpload}
              disabled={loading || !file}
              className="h-12 px-8 rounded-full bg-gradient-primary text-white font-bold tracking-wide shadow-glow-primary hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 min-w-[200px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                "Analyze Report"
              )}
            </Button>
            
            {(file || analysis || ocrText) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setAnalysis("");
                  setOcrText("");
                  if (filePreview) URL.revokeObjectURL(filePreview);
                  setFilePreview(null);
                }}
                className="h-12 px-6 rounded-full font-semibold border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
                disabled={loading}
              >
                Reset
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 mt-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {(analysis || ocrText) && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            
            {/* OCR PANE */}
            <div className="flex flex-col bg-muted/20 border border-border rounded-3xl overflow-hidden shadow-soft">
              <div 
                className="flex items-center justify-between p-4 bg-muted/30 border-b border-border cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => setOcrOpen(!ocrOpen)}
              >
                <div className="flex items-center gap-2 font-bold text-foreground mx-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Extracted Text (OCR)
                </div>
                <div className="flex items-center gap-2">
                  {ocrOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </div>

              {ocrOpen && (
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Search text..."
                      value={searchTerm}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <Button variant="outline" size="icon" onClick={copyOcr} className="rounded-xl border-border bg-background hover:bg-muted" title="Copy to clipboard">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={downloadOcr} className="rounded-xl border-border bg-background hover:bg-muted" title="Download Text">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 bg-background border border-border rounded-2xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto font-mono text-sm leading-relaxed text-foreground/80 shadow-inner">
                    {ocrText ? (
                        highlightParts(ocrText, searchTerm).map((part, i) =>
                          typeof part === "string" ? (
                            <span key={i}>{part}</span>
                          ) : (
                            <mark key={part.key} className="bg-amber-200 text-amber-900 px-1 rounded-sm">
                              {part.match}
                            </mark>
                          )
                        )
                    ) : (
                      <p className="text-muted-foreground italic text-center mt-10">No OCR extracted.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI ANALYSIS PANE */}
            <div className="flex flex-col bg-muted/20 border border-border rounded-3xl overflow-hidden shadow-soft">
              <div className="flex items-center gap-2 p-4 bg-muted/30 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-foreground">AI Medical Analysis</span>
              </div>
              <div className="p-4 flex-1">
                <div className="w-full h-full min-h-[300px] max-h-[500px] overflow-y-auto bg-gradient-to-b from-background to-background/50 border border-border rounded-2xl p-5 text-sm leading-relaxed text-foreground shadow-inner whitespace-pre-wrap">
                  {analysis || <span className="text-muted-foreground italic">Analysis results will appear here...</span>}
                </div>
              </div>
            </div>

          </div>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Disclaimer: This tool provides AI-driven insights and is not a substitute for professional medical advice. Always consult a licensed doctor.</p>
        </div>

      </div>
    </div>
  );
}
