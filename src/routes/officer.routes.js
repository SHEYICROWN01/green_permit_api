// src/routes/officer.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const authController = require('../controllers/officer/auth.controller');
const dashboardController = require('../controllers/officer/dashboard.controller');
const stickerController = require('../controllers/officer/sticker.controller');
const reportsController = require('../controllers/officer/reports.controller');
const { activateSticker } = require('../controllers/officer/activation.controller');

// ===================================================
// PUBLIC ROUTES (No authentication required)
// ===================================================

/**
 * @route   POST /api/v1/officer/auth/login
 * @desc    Officer login with officer ID and PIN
 * @access  Public
 */
router.post('/auth/login', authController.login);

/**
 * @route   GET /api/v1/officer/stickers/:stickerID/verify
 * @desc    Verify sticker status (public endpoint for citizens)
 * @access  Public
 */
router.get('/stickers/:stickerID/verify', stickerController.verifySticker);

// ===================================================
// PROTECTED ROUTES (Authentication required)
// ===================================================

/**
 * @route   POST /api/v1/officer/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private (Officer)
 */
router.post('/auth/refresh', authenticate, authController.refreshToken);

/**
 * @route   POST /api/v1/officer/auth/logout
 * @desc    Officer logout
 * @access  Private (Officer)
 */
router.post('/auth/logout', authenticate, authController.logout);

// Apply authentication and role checking to remaining routes
router.use(authenticate);
router.use(requireRole(['field_officer', 'officer', 'supervisor', 'lga_admin', 'super_admin']));

// ===================================================
// DASHBOARD ROUTES
// ===================================================

/**
 * @route   GET /api/v1/officer/dashboard/overview
 * @desc    Get officer dashboard overview (stats, recent activities)
 * @access  Private (Officer)
 */
router.get('/dashboard/overview', dashboardController.getDashboardOverview);

// ===================================================
// STICKER MANAGEMENT ROUTES
// ===================================================

/**
 * @route   GET /api/v1/officer/stickers/:stickerID
 * @desc    Get sticker details by scanning QR code
 * @access  Private (Officer)
 */
router.get('/stickers/:stickerID', stickerController.getStickerDetails);

/**
 * @route   POST /api/v1/officer/stickers/:stickerID/activate
 * @desc    Activate sticker (assign to cart pusher)
 * @access  Private (Officer)
 */
router.post('/stickers/:stickerID/activate', stickerController.activateSticker);

// Legacy activation endpoint (backward compatibility)
router.post('/stickers/activate', activateSticker);

// ===================================================
// REPORTS & ANALYTICS ROUTES
// ===================================================

/**
 * @route   GET /api/v1/officer/activities/breakdown
 * @desc    Get activity breakdown with pagination
 * @access  Private (Officer)
 */
router.get('/activities/breakdown', reportsController.getActivityBreakdown);

/**
 * @route   GET /api/v1/officer/activities
 * @desc    Get activity breakdown (alias for backward compatibility)
 * @access  Private (Officer)
 */
router.get('/activities', reportsController.getActivityBreakdown);

/**
 * @route   GET /api/v1/officer/reports/sales
 * @desc    Get sales reports with analytics
 * @access  Private (Officer)
 */
router.get('/reports/sales', reportsController.getSalesReports);

/**
 * @route   POST /api/v1/officer/reports/export
 * @desc    Export report data (JSON or CSV)
 * @access  Private (Officer)
 */
router.post('/reports/export', reportsController.exportReport);

module.exports = router;
