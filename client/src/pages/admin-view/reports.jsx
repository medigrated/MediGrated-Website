import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function Reports() {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const dropRef = useRef(null);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const onFileChange = (f) => {
    setFile(f);
    setError('');
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (f && f.type && f.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    const f = dt.files && dt.files[0];
    if (f) onFileChange(f);
    dropRef.current.classList.remove('drag-over');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add('drag-over');
  };

  const handleDragLeave = () => {
    dropRef.current.classList.remove('drag-over');
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || ''}/api/reports/analyze`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );

      if (response.data && response.data.error) {
        setError(response.data.error || 'Analysis failed');
        setAnalysis('');
        setOcrText('');
      } else {
        setAnalysis(response.data.analysis || JSON.stringify(response.data.analysis || {} , null, 2));
        setOcrText(response.data.ocr_text || '');
      }
    } catch (err) {
      if (err.message === 'Network Error') {
        setError('Unable to reach server. Make sure backend is running on port 5000.');
      } else {
        setError(err.response?.data?.error || err.message || 'Error analyzing report.');
      }
      console.error('analyze error', err);
      setAnalysis('');
      setOcrText('');
    }

    setLoading(false);
  };

  const copyOcr = async () => {
    try {
      await navigator.clipboard.writeText(ocrText || '');
    } catch (err) {
      // ignore
    }
  };

  const downloadOcr = () => {
    const blob = new Blob([ocrText || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name || 'ocr') + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Report Scanner</h1>

      <section
        className="uploader"
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ marginTop: 16 }}
      >
        <div className="file-input">
          <input
            id="file"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => onFileChange(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <label htmlFor="file" className="file-label" style={{ cursor: 'pointer' }}>
            <div className="file-label-inner">
              <div className="file-meta">
                <strong>{file ? file.name : 'Choose a PDF or image file'}</strong>
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

        <div className="actions" style={{ marginTop: 12 }}>
          <button className="primary" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Report'}
          </button>
          <button
            className="ghost"
            onClick={() => {
              setFile(null);
              setAnalysis('');
              setOcrText('');
              if (filePreview) {
                URL.revokeObjectURL(filePreview);
              }
              setFilePreview(null);
            }}
          >
            Reset
          </button>
        </div>

        {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
      </section>

      <section className="results" style={{ marginTop: 18 }}>
        <div className="pane ocr-pane">
          <div className="pane-header">
            <h2>Extracted Text (OCR)</h2>
            <div className="pane-actions">
              <input
                placeholder="Search OCR..."
                onClick={(e) => e.stopPropagation()}
                onChange={() => {}}
                style={{ padding: 8, borderRadius: 8, border: '1px solid #eef4ff' }}
              />
              <button className="icon-btn" title="Copy" onClick={copyOcr}>
                Copy
              </button>
              <button className="icon-btn" title="Download" onClick={downloadOcr}>
                Download
              </button>
            </div>
          </div>

          <div className="ocr-collapse open" style={{ marginTop: 6 }}>
            {ocrText ? (
              <pre className="ocr-box">{ocrText}</pre>
            ) : (
              <div className="placeholder">No OCR output yet.</div>
            )}
          </div>
        </div>

        <div className="pane" style={{ marginLeft: 16 }}>
          <h2>AI Analysis</h2>
          <pre className="analysis-box">{analysis || 'No analysis yet.'}</pre>
        </div>
      </section>

    </div>
  );
}

export default Reports;
