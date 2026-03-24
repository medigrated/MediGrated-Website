# OCR Analysis Service

This is a Python FastAPI service that handles OCR extraction and AI-powered medical report analysis using Groq API.

## Prerequisites

- Python 3.8+
- Tesseract OCR installed on your system
- Groq API key

### Installing Tesseract OCR

**Windows:**
1. Download the installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer (default path: `C:\Program Files\Tesseract-OCR`)
3. Add to your system PATH or set `PYTESSERACT_PATH` environment variable

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

## Setup

1. Create a `.env` file in this directory:
```bash
cp .env.example .env
```

2. Add your Groq API key to `.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

The service will be available at `http://localhost:8000`

## API Endpoints

### POST /analyze
Analyzes a medical report (image or PDF) and returns OCR text and AI analysis.

**Request:**
- `file`: Image or PDF file (multipart/form-data)

**Response:**
```json
{
  "analysis": "AI-generated analysis of the report",
  "ocr_text": "Extracted text from the image/PDF"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Environment Variables

- `GROQ_API_KEY`: Your Groq API key (required)

## Troubleshooting

### Tesseract not found
If you get "tesseract is not installed" error:
1. Ensure Tesseract is installed on your system
2. Set the path in your code or environment:
   ```python
   import pytesseract
   pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
   ```

### GROQ_API_KEY not set
Make sure your `.env` file has the correct API key and is in the same directory as `app.py`.

### Port already in use
Change the port when running:
```bash
uvicorn app:app --host 0.0.0.0 --port 8001
```

Then update `PYTHON_SERVICE_URL` in your Node.js `.env` file.
