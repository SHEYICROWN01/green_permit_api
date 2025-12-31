// src/controllers/admin/profile.controller.js
const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const User = require('../../models/User');
const { hashPassword, comparePassword } = require('../../utils/auth');
const db = require('../../config/database');

/**
 * @desc    Get Admin Profile
 * @route   GET /api/v1/admin/profile
 * @access  Private (Admin only)
 */
exports.getProfile = asyncHandler(async (req, res) => {
    const adminId = req.user.id;

    const [admin] = await db.query(`
        SELECT 
            u.id as admin_id,
            u.name,
            u.email,
            u.phone,
            u.lga_id,
            l.name as lga_name,
            l.state,
            u.role,
            u.is_active as status,
            u.created_at,
            u.last_login_at as last_login
        FROM users u
        LEFT JOIN lgas l ON u.lga_id = l.id
        WHERE u.id = ?
    `, [adminId]);

    if (!admin || admin.length === 0) {
        throw new ApiError(404, 'Admin not found');
    }

    const adminData = admin[0];

    const responseData = {
        admin_id: `admin_${adminData.admin_id}`,
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone || 'N/A',
        lga_id: `lga_${adminData.lga_id}`,
        lga_name: adminData.lga_name,
        state: adminData.state,
        role: 'admin',
        status: adminData.status ? 'active' : 'inactive',
        created_at: adminData.created_at,
        last_login: adminData.last_login,
        permissions: [
            'view_dashboard',
            'manage_supervisors',
            'manage_officers',
            'view_reports',
            'activate_stickers'
        ]
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Profile retrieved successfully'));
});

/**
 * @desc    Update Admin Profile
 * @route   PUT /api/v1/admin/profile
 * @access  Private (Admin only)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { name, phone, email } = req.body;

    const updates = [];
    const params = [];

    if (name) {
        if (name.length < 3) {
            throw new ApiError(400, 'Name must be at least 3 characters');
        }
        updates.push('name = ?');
        params.push(name);
    }

    if (phone) {
        updates.push('phone = ?');
        params.push(phone);
    }

    if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ApiError(400, 'Valid email is required');
        }

        // Check if email is taken by another user
        const [existingEmail] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, adminId]
        );

        if (existingEmail && existingEmail.length > 0) {
            throw new ApiError(409, 'Email already exists');
        }

        updates.push('email = ?');
        params.push(email);
    }

    if (updates.length === 0) {
        throw new ApiError(400, 'No fields to update');
    }

    params.push(adminId);

    await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
    );

    // Get updated admin info
    const [updatedAdmin] = await db.query(
        'SELECT id, name, email, phone, updated_at FROM users WHERE id = ?',
        [adminId]
    );

    const responseData = {
        admin_id: `admin_${updatedAdmin[0].id}`,
        name: updatedAdmin[0].name,
        email: updatedAdmin[0].email,
        phone: updatedAdmin[0].phone,
        updated_at: updatedAdmin[0].updated_at
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Profile updated successfully'));
});

/**
 * @desc    Change Password
 * @route   POST /api/v1/admin/profile/change-password
 * @access  Private (Admin only)
 */
exports.changePassword = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    // Validation
    if (!current_password || !new_password || !confirm_password) {
        throw new ApiError(400, 'All password fields are required');
    }

    if (new_password !== confirm_password) {
        throw new ApiError(400, 'New password and confirm password do not match');
    }

    if (new_password.length < 8) {
        throw new ApiError(400, 'New password must be at least 8 characters');
    }

    // Password complexity check
    const hasUpperCase = /[A-Z]/.test(new_password);
    const hasLowerCase = /[a-z]/.test(new_password);
    const hasNumber = /[0-9]/.test(new_password);
    const hasSpecial = /[!@#$%^&*]/.test(new_password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
        throw new ApiError(400, 'Password must contain uppercase, lowercase, number, and special character');
    }

    // Get current user
    const admin = await User.findById(adminId);

    if (!admin) {
        throw new ApiError(404, 'Admin not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(current_password, admin.password);

    if (!isCurrentPasswordValid) {
        throw new ApiError(401, 'Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(new_password);

    // Update password
    await db.query(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, adminId]
    );

    const responseData = {
        password_changed_at: new Date()
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Password changed successfully'));
});
