// routes/cariesRoutes.js
const express = require('express');
const router = express.Router();
const { saveCariesDiagnosis } = require('../controllers/cariesController');

// API endpoint called when "Continue & Proceed" button is clicked from UI
router.post('/save-diagnosis', saveCariesDiagnosis);

module.exports = router;