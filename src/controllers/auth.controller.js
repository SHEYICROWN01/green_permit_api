const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { comparePassword, generateToken } = require('../utils/auth');

/**
 * @desc    Super Admin Login
 * @route   POST /api/auth/super-admin/login
 * @access  Public
 */
const superAdminLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        throw new ApiError(400, 'Username and password are required');
    }

    // Find user by username
    const user = await User.findByUsername(username);

    if (!user) {
        throw new ApiError(401, 'Invalid username or password');
    }

    // Check if user is super admin
    if (user.role !== 'super_admin') {
        throw new ApiError(403, 'Access denied. Super Admin credentials required.');
    }

    // Check if account is active
    if (!user.is_active) {
        throw new ApiError(403, 'Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid username or password');
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    // Remove password from response
    delete user.password;

    // Send response
    ApiResponse.success(
        res,
        {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                is_active: user.is_active,
                last_login_at: new Date().toISOString(),
            },
        },
        'Login successful'
    );
});

/**
 * @desc    Supervisor Login
 * @route   POST /api/v1/auth/supervisor/login
 * @access  Public
 */
const supervisorLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        throw new ApiError(400, 'Username and password are required');
    }

    // Find user by username or email (support both)
    let user = await User.findByUsername(username);
    if (!user) {
        user = await User.findByEmail(username);
    }

    if (!user) {
        throw new ApiError(401, 'Invalid username or password');
    }

    // Check if user is supervisor
    if (user.role !== 'supervisor') {
        throw new ApiError(403, 'Access denied. Supervisor credentials required.');
    }

    // Check if account is active
    if (!user.is_active) {
        throw new ApiError(403, 'Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid username or password');
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Get full user details with LGA info
    const userDetails = await User.findById(user.id);

    // Generate JWT token
    const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        lga_id: user.lga_id
    });

    // Supervisor permissions
    const permissions = [
        'manage_officers',
        'view_activations',
        'view_reports'
    ];

    // Send response
    ApiResponse.success(
        res,
        {
            token,
            user: {
                id: userDetails.id,
                name: userDetails.name,
                email: userDetails.email,
                username: userDetails.username,
                role: userDetails.role,
                phone: userDetails.phone,
                lga_id: userDetails.lga_id,
                lga_name: userDetails.lga_name,
                state: userDetails.state || 'Ogun State',
                supervisor_id: userDetails.supervisor_id || null,
                is_active: userDetails.is_active,
                last_login_at: new Date().toISOString(),
                permissions,
                created_at: userDetails.created_at,
                updated_at: userDetails.updated_at
            },
        },
        'Login successful'
    );
});

/**
 * @desc    Logout (client-side token removal, optionally blacklist token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    // In a simple JWT implementation, logout is handled client-side by removing the token
    // For enhanced security, implement token blacklisting here

    ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Remove password from response
    delete user.password;

    ApiResponse.success(res, { user }, 'User profile retrieved successfully');
});

module.exports = {
    superAdminLogin,
    supervisorLogin,
    logout,
    getCurrentUser,
};
