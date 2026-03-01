// server/controllers/reports/report-controller.js

const path = require("path");
const fs = require("fs");
const mongoose = require('mongoose');
const Report = require("../../models/Report");
const axios = require("axios");

/*
  MOCK REPORT PARSER FOR NOW 
  - If PDF/image contains keywords like 'hemoglobin' etc.
  - Later replaced by:
      - Tesseract OCR
      - OpenAI Vision
      - Cloud API medical parsers
      - Your ML model
*/
function mockParseReport(file, ocrText = "") {
  const filename = (file.originalname || "").toLowerCase();

  if (filename.includes("cbc") || filename.includes("blood") || ocrText.toLowerCase().includes("hemoglobin")) {
    return {
      summary: "Detected blood report.",
      values: {
        hemoglobin: "13.2 g/dL",
        wbc: "6,700 /µL",
        platelets: "220,000 /µL"
      },
      flags: ["Hemoglobin slightly low"],
    };
  }

  if (filename.includes("xray")) {
    return {
      summary: "Detected X-ray image.",
      findings: "Lungs appear normal. No obvious issues.",
      confidence: "Mock 82%"
    };
  }

  return {
    summary: "Unrecognized report type. Basic storage only.",
  };
}

/*
  POST /api/reports/upload  
  Protected (authMiddleware)
*/
const uploadReport = async (req, res) => {
  try {
    // multer places file in req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // user info from JWT (may be undefined when auth is skipped)
    const userId = (req.user && req.user.id) ? req.user.id : 'anonymous';

    const file = req.file;

    // parse mock
    const parsed = mockParseReport(file);

    const report = await Report.create({
      user: userId,
      filename: file.originalname,
      storedFilename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: file.path,
      reportType: parsed?.summary?.toLowerCase().includes("blood")
        ? "blood"
        : parsed?.summary?.toLowerCase().includes("x-ray")
        ? "xray"
        : "other",
      parsedData: parsed,
    });

    return res.json({
      success: true,
      message: "Report uploaded and parsed successfully",
      report,
    });

  } catch (err) {
    console.error("uploadReport error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading report",
    });
  }
};

/*
  POST /api/reports/analyze
  Proxies to Python FastAPI service for OCR + AI analysis
*/
const analyzeReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const userId = (req.user && req.user.id) ? req.user.id : 'anonymous';
    const file = req.file;

    // Create FormData to send to Python service
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), file.originalname);

    // Get Python service URL from environment or use default
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    try {
      // Call Python FastAPI service
      const response = await axios.post(
        `${pythonServiceUrl}/analyze`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60000, // 60 second timeout for OCR processing
        }
      );

      const { analysis, ocr_text } = response.data;

      // attempt to save to database if connected
      let report = null;
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const parsed = mockParseReport(file, ocr_text);
          report = await Report.create({
            user: userId,
            filename: file.originalname,
            storedFilename: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            storagePath: file.path,
            reportType: parsed?.summary?.toLowerCase().includes("blood")
              ? "blood"
              : parsed?.summary?.toLowerCase().includes("x-ray")
              ? "xray"
              : "other",
            parsedData: parsed,
            aiAnalysis: analysis,
            ocrText: ocr_text,
          });
        } catch (e) {
          console.warn('Failed to save report to DB:', e.message);
        }
      }

      const responseData = { success: true, analysis, ocr_text };
      if (report) responseData.report = report;
      return res.json(responseData);

    } catch (pythonErr) {
      console.error('Python service error:', pythonErr.message);
      
      // Check if it's a connection error
      if (pythonErr.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: 'OCR service unavailable',
          details: 'The OCR analysis service is not running. Please ensure the Python service is started on port 8000.'
        });
      }

      // Return error from Python service if available
      if (pythonErr.response?.data) {
        return res.status(pythonErr.response.status || 500).json(pythonErr.response.data);
      }

      return res.status(500).json({
        success: false,
        error: 'Analysis failed on server.',
        details: pythonErr.message
      });
    }

  } catch (err) {
    console.error('analyzeReport error:', err);
    return res.status(500).json({ success: false, error: 'Analysis failed on server.' });
  }
};

/*
  GET /api/reports/my
  Returns all reports uploaded by logged-in user
*/
const getMyReports = async (req, res) => {
  try {
    const userId = (req.user && req.user.id) ? req.user.id : 'anonymous';
    const reports = await Report.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      reports,
    });

  } catch (err) {
    console.error("getMyReports error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching reports",
    });
  }
};

module.exports = { uploadReport, getMyReports, analyzeReport };
