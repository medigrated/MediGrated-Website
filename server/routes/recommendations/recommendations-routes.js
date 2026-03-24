// server/routes/recommendations/recommendations-routes.js
const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../../controllers/recommendations/recommendations-controller');
// const { authMiddleware } = require('../../controllers/auth/auth-controller');

// For development/testing keep it open, later use authMiddleware
router.get('/', /*authMiddleware,*/ getRecommendations);

module.exports = router;
