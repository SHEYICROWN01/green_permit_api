// src/controllers/admin/auth.controller.js
const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const User = require('../../models/User');
const { comparePassword, generateToken, generateRefreshToken } = require('../../utils/auth');

/**
 * @desc    LGA Admin Login
 * @route   POST /api/v1/admin/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }

    // Validate role matches
    if (role && role !== 'admin') {
        throw new ApiError(400, 'Invalid role specified');
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Check if user is LGA admin
    if (user.role !== 'lga_admin') {
        throw new ApiError(403, 'Access denied. Admin credentials required.');
    }

    // Check if account is active
    if (!user.is_active) {
        throw new ApiError(403, 'Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Get full user details with LGA info
    const userDetails = await User.findById(user.id);

    // Generate JWT token and refresh token
    const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        lga_id: user.lga_id
    });

    const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        role: user.role
    });

    // Get user permissions (you can customize this based on your needs)
    const permissions = [
        'view_dashboard',
        'manage_supervisors',
        'manage_officers',
        'view_reports',
        'activate_stickers'
    ];

    // Send response using ApiResponse.success static method
    ApiResponse.success(
        res,
        {
            token,
            refreshToken,
            user: {
                id: userDetails.id,
                email: userDetails.email,
                name: userDetails.name,
                role: 'admin', // Return as 'admin' for frontend consistency
                lga_id: userDetails.lga_id,
                lga_name: userDetails.lga_name,
                state: userDetails.state || 'Ogun State',
                permissions,
                created_at: userDetails.created_at,
                last_login: userDetails.last_login_at
            }
        },
        'Login successful',
        200
    );
});

/**
 * @desc    LGA Admin Logout
 * @route   POST /api/v1/admin/auth/logout
 * @access  Private (Admin only)
 */
exports.logout = asyncHandler(async (req, res) => {
    // In a real application, you might want to:
    // 1. Invalidate the refresh token in database
    // 2. Add the current token to a blacklist
    // 3. Clear any session data

    // For now, we'll just send a success response
    // The client should remove the token from storage

    ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * @desc    Refresh Access Token
 * @route   POST /api/v1/admin/auth/refresh
 * @access  Public (requires refresh token)
 */
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    let decoded;

    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (!user.is_active) {
        throw new ApiError(403, 'Account is deactivated');
    }

    // Generate new tokens
    const newToken = generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        lga_id: user.lga_id
    });

    const newRefreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        role: user.role
    });

    ApiResponse.success(
        res,
        {
            token: newToken,
            refreshToken: newRefreshToken
        },
        'Token refreshed successfully'
    );
});
