// server/routes/patient-routes.js
const express = require('express');
const { getPatientDashboard } = require('../../controllers/patient/patient-controller');
const { authMiddleware } = require('../../controllers/auth/auth-controller');

const router = express.Router();

router.get('/dashboard', authMiddleware, getPatientDashboard);

module.exports = router;
