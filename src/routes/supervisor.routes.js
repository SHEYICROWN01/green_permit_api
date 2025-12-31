const express = require('express');
const router = express.Router();
const authController = require('../controllers/supervisor/auth.controller');
const dashboardController = require('../controllers/supervisor/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

/**
 * @route   POST /api/v1/supervisor/auth/login
 * @desc    Supervisor login
 * @access  Public
 */
router.post('/auth/login', authController.login);

/**
 * @route   POST /api/v1/supervisor/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/auth/refresh', authController.refreshToken);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================
// Apply authentication and authorization middleware to all routes below
const supervisorAuth = [authenticate, authorize('supervisor')];

/**
 * @route   GET /api/v1/supervisor/me
 * @desc    Get current supervisor profile
 * @access  Private (Supervisor)
 */
router.get('/me', supervisorAuth, authController.getProfile);

/**
 * @route   POST /api/v1/supervisor/auth/logout
 * @desc    Supervisor logout
 * @access  Private (Supervisor)
 */
router.post('/auth/logout', supervisorAuth, authController.logout);

/**
 * @route   GET /api/v1/supervisor/dashboard
 * @desc    Get supervisor dashboard statistics
 * @access  Private (Supervisor)
 */
router.get('/dashboard', supervisorAuth, dashboardController.getDashboardStats);

/**
 * @route   GET /api/v1/supervisor/activities
 * @desc    Get recent activities for supervisor's team
 * @access  Private (Supervisor)
 */
router.get('/activities', supervisorAuth, dashboardController.getRecentActivities);

/**
 * @route   GET /api/v1/supervisor/team-performance
 * @desc    Get team performance chart data
 * @access  Private (Supervisor)
 */
router.get('/team-performance', supervisorAuth, dashboardController.getTeamPerformance);

/**
 * @route   GET /api/v1/supervisor/team-status
 * @desc    Get real-time team status (online/offline)
 * @access  Private (Supervisor)
 */
router.get('/team-status', supervisorAuth, dashboardController.getTeamStatus);

/**
 * @route   GET /api/v1/supervisor/team
 * @desc    Get team members list
 * @access  Private (Supervisor)
 */
router.get('/team', supervisorAuth, dashboardController.getTeamMembers);

module.exports = router;
