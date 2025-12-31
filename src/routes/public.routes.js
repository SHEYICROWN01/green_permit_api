// src/routes/public.routes.js
const express = require('express');
const router = express.Router();
const { verifySticker } = require('../controllers/public/verification.controller');

// Public verification endpoint - no authentication required
router.post('/verify-sticker', verifySticker);

module.exports = router;
