const express = require('express');
const router = express.Router();
const transcriptController = require('../controllers/transcriptController');

// Transcripts are computed/read-only data
router.get('/student/:studentId', transcriptController.getByStudentId);

module.exports = router;
