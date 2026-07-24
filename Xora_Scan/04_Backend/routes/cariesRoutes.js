// routes/cariesRoutes.js
const express = require('express');
const router = express.Router();
const { saveCariesDiagnosis } = require('../controllers/cariesController');
const { authenticate } = require('../middleware/auth');

// API endpoint called when "Continue & Proceed" button is clicked from UI
router.post('/save-diagnosis', authenticate, saveCariesDiagnosis);

module.exports = router;