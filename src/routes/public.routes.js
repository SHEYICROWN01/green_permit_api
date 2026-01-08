// src/routes/public.routes.js
const express = require('express');
const router = express.Router();
const { verifySticker } = require('../controllers/public/verification.controller');

// Test endpoint to verify body parsing
router.post('/test-body', (req, res) => {
    res.json({
        success: true,
        bodyReceived: req.body,
        headers: req.headers,
        contentType: req.get('Content-Type')
    });
});

// Public verification endpoint - no authentication required
router.post('/verify-sticker', verifySticker);

module.exports = router;
