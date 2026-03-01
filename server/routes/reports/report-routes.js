// server/routes/reports/report-routes.js
const express = require('express');
const router = express.Router();
const { uploadReport, getMyReports, analyzeReport } = require('../../controllers/reports/report-controller');
const { authMiddleware } = require('../../controllers/auth/auth-controller');
const upload = require('../../middleware/upload');

// POST /api/reports/upload  (multipart/form-data) - protected
router.post('/upload', authMiddleware, upload.single('file'), uploadReport);

// POST /api/reports/analyze  (multipart/form-data) - not protected so that users
// can try the scanner without registering or when DB is down.
router.post('/analyze', upload.single('file'), analyzeReport);

// GET /api/reports/my - protected
router.get('/my', authMiddleware, getMyReports);

module.exports = router;
