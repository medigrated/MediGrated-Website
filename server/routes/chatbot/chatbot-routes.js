// server/routes/chatbot/chatbot-routes.js
const express = require('express');
const router = express.Router();
const { postMessage, getHistory, clearHistory } = require('../../controllers/chatbot/chatbot-controller');
const { authMiddleware } = require('../../controllers/auth/auth-controller');

// protect these routes so cookie JWT is required
router.post('/message', authMiddleware, postMessage);
router.get('/history', authMiddleware, getHistory);
router.delete('/history', authMiddleware, clearHistory);

module.exports = router;
