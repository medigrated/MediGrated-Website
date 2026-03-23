from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
import io
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_image(file_bytes):
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image)

def extract_text_from_pdf(file_bytes):
    pages = convert_from_bytes(file_bytes)
    text = ""
    for page in pages:
        text += pytesseract.image_to_string(page)
    return text

@app.post("/analyze")
async def analyze_report(file: UploadFile = File(...)):
    contents = await file.read()

    if file.filename.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(contents)
    else:
        extracted_text = extract_text_from_image(contents)

    prompt = f"""
You are a professional medical report analyzer.

Tasks:
1. Identify key test results
2. Highlight abnormal values
3. Explain in simple language
4. Provide general health suggestions what can be done for the particular values and also for improving the health
5. Add disclaimer: "Consult a licensed doctor for medical advice."
6. Dont use bold in the responses
Medical Report:
{extracted_text}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a medical AI assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        return {
            "analysis": response.choices[0].message.content,
            "ocr_text": extracted_text
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Return a clear JSON error so frontend can show the server reason
        return JSONResponse(status_code=500, content={
            "error": "Analysis failed on server.",
            "details": str(e)
        })

@app.get("/health")
async def health():
    return {"status": "ok"}
