// src/controllers/admin/supervisor.controller.js
const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const User = require('../../models/User');
const { hashPassword } = require('../../utils/auth');
const db = require('../../config/database');

/**
 * @desc    Get All Supervisors
 * @route   GET /api/v1/admin/supervisors
 * @access  Private (Admin only)
 */
exports.getAllSupervisors = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const {
        page = 1,
        limit = 20,
        search = '',
        status = '',
        sort_by = 'created_at',
        sort_order = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const validSortColumns = ['name', 'created_at', 'last_login_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build WHERE clause
    let whereClause = 'WHERE u.lga_id = ? AND u.role = "supervisor"';
    const params = [lgaId];

    if (search) {
        whereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
        const isActive = status === 'active' ? 1 : 0;
        whereClause += ' AND u.is_active = ?';
        params.push(isActive);
    }

    // Get total count
    const countResult = await db.query(`
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
    `, params);

    const total = countResult && countResult[0] ? countResult[0].total : 0;

    // Get supervisors with officer count
    const sql = `
        SELECT 
            u.id as supervisor_id,
            u.name,
            u.email,
            u.phone,
            u.is_active as status,
            u.created_at,
            u.last_login_at as last_login,
            (SELECT COUNT(*) FROM users WHERE supervisor_id = u.id AND is_active = 1) as officers_count
        FROM users u
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    const supervisors = await db.query(sql, params);

    // Format response
    const formattedSupervisors = supervisors.map(supervisor => ({
        supervisor_id: `sup_${supervisor.supervisor_id}`,
        name: supervisor.name,
        email: supervisor.email,
        phone: supervisor.phone || 'N/A',
        status: supervisor.status ? 'active' : 'inactive',
        officers_count: supervisor.officers_count,
        created_at: supervisor.created_at,
        last_login: supervisor.last_login,
        permissions: [
            'view_dashboard',
            'manage_officers',
            'view_reports'
        ]
    }));

    const responseData = {
        supervisors: formattedSupervisors,
        pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / parseInt(limit)),
            total_items: total,
            items_per_page: parseInt(limit)
        }
    };

    return ApiResponse.success(res, responseData, 'Supervisors retrieved successfully');
});

/**
 * @desc    Get Supervisor Details
 * @route   GET /api/v1/admin/supervisors/:supervisor_id
 * @access  Private (Admin only)
 */
exports.getSupervisorDetails = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const supervisorId = req.params.supervisor_id.replace('sup_', '');

    // Get supervisor details
    const supervisor = await db.query(`
        SELECT 
            u.id as supervisor_id,
            u.name,
            u.email,
            u.phone,
            u.is_active as status,
            u.lga_id,
            u.created_at,
            u.last_login_at as last_login,
            l.name as lga_name,
            c.name as created_by_name
        FROM users u
        LEFT JOIN lgas l ON u.lga_id = l.id
        LEFT JOIN users c ON u.created_by = c.id
        WHERE u.id = ? AND u.lga_id = ? AND u.role = 'supervisor'
    `, [supervisorId, lgaId]);

    if (!supervisor || supervisor.length === 0) {
        throw new ApiError(404, 'Supervisor not found');
    }

    const supervisorData = supervisor[0];

    // Get assigned officers
    const officers = await db.query(`
        SELECT 
            id as officer_id,
            name,
            email,
            is_active as status,
            (SELECT COUNT(*) FROM stickers WHERE activated_by = users.id) as activations_count
        FROM users
        WHERE supervisor_id = ? AND role = 'officer'
    `, [supervisorId]);

    // Get statistics
    const statistics = await db.query(`
        SELECT 
            COUNT(DISTINCT o.id) as total_officers,
            SUM(CASE WHEN o.is_active = 1 THEN 1 ELSE 0 END) as active_officers,
            COUNT(s.id) as total_activations,
            COALESCE(SUM(s.price / 100), 0) as total_revenue
        FROM users o
        LEFT JOIN stickers s ON o.id = s.activated_by AND s.status IN ('active', 'expired')
        WHERE o.supervisor_id = ? AND o.role = 'officer'
    `, [supervisorId]);

    const responseData = {
        supervisor_id: `sup_${supervisorData.supervisor_id}`,
        name: supervisorData.name,
        email: supervisorData.email,
        phone: supervisorData.phone || 'N/A',
        status: supervisorData.status ? 'active' : 'inactive',
        lga_id: `lga_${supervisorData.lga_id}`,
        lga_name: supervisorData.lga_name,
        created_at: supervisorData.created_at,
        created_by: supervisorData.created_by_name || 'System',
        last_login: supervisorData.last_login,
        permissions: [
            'view_dashboard',
            'manage_officers',
            'view_reports'
        ],
        assigned_officers: officers.map(officer => ({
            officer_id: `off_${officer.officer_id}`,
            name: officer.name,
            email: officer.email,
            status: officer.status ? 'active' : 'inactive',
            activations_count: officer.activations_count
        })),
        statistics: {
            total_officers: statistics[0].total_officers || 0,
            active_officers: statistics[0].active_officers || 0,
            total_activations: statistics[0].total_activations || 0,
            total_revenue: parseFloat(statistics[0].total_revenue || 0)
        }
    };

    return ApiResponse.success(res, responseData, 'Supervisor details retrieved successfully');
});

/**
 * @desc    Create Supervisor
 * @route   POST /api/v1/admin/supervisors
 * @access  Private (Admin only)
 */
exports.createSupervisor = asyncHandler(async (req, res) => {
    try {
        console.log('=== CREATE SUPERVISOR REQUEST ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('User LGA ID:', req.user.lga_id);
        console.log('User Role:', req.user.role);

        const lgaId = req.user.lga_id;
        const { name, email, phone, password, permissions } = req.body;

        // Validation
        console.log('Starting validation...');

        if (!name || name.length < 3) {
            console.log('VALIDATION ERROR: Name validation failed');
            throw new ApiError(400, 'Name must be at least 3 characters');
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.log('VALIDATION ERROR: Email validation failed');
            throw new ApiError(400, 'Valid email is required');
        }

        if (!phone) {
            console.log('VALIDATION ERROR: Phone validation failed');
            throw new ApiError(400, 'Phone number is required');
        }

        if (!password || password.length < 8) {
            console.log('VALIDATION ERROR: Password validation failed');
            throw new ApiError(400, 'Password must be at least 8 characters');
        }

        console.log('Validation passed. Checking for existing email...');

        // Check if email already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            console.log('EMAIL CONFLICT: Email already exists:', email);
            throw new ApiError(409, 'Email already exists');
        }

        console.log('Email is unique. Hashing password...');

        // Hash password
        const hashedPassword = await hashPassword(password);
        console.log('Password hashed successfully');

        // Create supervisor
        const username = email.split('@')[0]; // Generate username from email
        const userData = {
            name,
            email,
            username,
            password: hashedPassword,
            role: 'supervisor',
            lga_id: lgaId,
            phone,
            is_active: true
        };

        console.log('Creating supervisor with data:', { ...userData, password: '[REDACTED]' });

        const supervisor = await User.create(userData);
        console.log('Supervisor created successfully:', supervisor.id);

        const responseData = {
            supervisor_id: `sup_${supervisor.id}`,
            name: supervisor.name,
            email: supervisor.email,
            phone: supervisor.phone,
            status: 'active',
            lga_id: `lga_${lgaId}`,
            lga_name: supervisor.lga_name || 'N/A',
            created_at: supervisor.created_at,
            temporary_password: password,
            must_change_password: true
        };

        console.log('Sending success response:', JSON.stringify(responseData, null, 2));
        console.log('=== CREATE SUPERVISOR SUCCESS ===');

        return ApiResponse.success(res, responseData, 'Supervisor created successfully', 201);

    } catch (error) {
        console.error('=== CREATE SUPERVISOR ERROR ===');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Error Status:', error.statusCode || 'N/A');
        console.error('Error Stack:', error.stack);
        console.error('=================================');
        throw error; // Re-throw to be handled by asyncHandler
    }
});

/**
 * @desc    Update Supervisor
 * @route   PUT /api/v1/admin/supervisors/:supervisor_id
 * @access  Private (Admin only)
 */
exports.updateSupervisor = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const supervisorId = req.params.supervisor_id.replace('sup_', '');
    const { name, email, phone, status, permissions } = req.body;

    // Check if supervisor exists
    const supervisor = await db.query(
        'SELECT * FROM users WHERE id = ? AND lga_id = ? AND role = "supervisor"',
        [supervisorId, lgaId]
    );

    if (!supervisor || supervisor.length === 0) {
        throw new ApiError(404, 'Supervisor not found');
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name) {
        updates.push('name = ?');
        params.push(name);
    }

    if (email) {
        // Check if new email is taken by another user
        const existingEmail = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, supervisorId]
        );
        if (existingEmail && existingEmail.length > 0) {
            throw new ApiError(409, 'Email already exists');
        }
        updates.push('email = ?');
        params.push(email);
    }

    if (phone) {
        updates.push('phone = ?');
        params.push(phone);
    }

    if (status) {
        const isActive = status === 'active' ? 1 : 0;
        updates.push('is_active = ?');
        params.push(isActive);
    }

    if (updates.length === 0) {
        throw new ApiError(400, 'No fields to update');
    }

    params.push(supervisorId);

    await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
    );

    // Get updated supervisor
    const updatedSupervisor = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [supervisorId]
    );

    const responseData = {
        supervisor_id: `sup_${updatedSupervisor[0].id}`,
        name: updatedSupervisor[0].name,
        email: updatedSupervisor[0].email,
        phone: updatedSupervisor[0].phone,
        status: updatedSupervisor[0].is_active ? 'active' : 'inactive',
        permissions: permissions || [
            'view_dashboard',
            'manage_officers',
            'view_reports'
        ],
        updated_at: updatedSupervisor[0].updated_at
    };

    return ApiResponse.success(res, responseData, 'Supervisor updated successfully');
});

/**
 * @desc    Delete/Deactivate Supervisor
 * @route   DELETE /api/v1/admin/supervisors/:supervisor_id
 * @access  Private (Admin only)
 */
exports.deleteSupervisor = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const supervisorId = req.params.supervisor_id.replace('sup_', '');
    const { permanent = false } = req.query;

    // Check if supervisor exists
    const supervisor = await db.query(
        'SELECT * FROM users WHERE id = ? AND lga_id = ? AND role = "supervisor"',
        [supervisorId, lgaId]
    );

    if (!supervisor || supervisor.length === 0) {
        throw new ApiError(404, 'Supervisor not found');
    }

    // Get count of officers under this supervisor
    const officersCount = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?',
        [supervisorId]
    );

    if (permanent === 'true') {
        // Permanent delete (not recommended if they have officers)
        if (officersCount[0].count > 0) {
            throw new ApiError(400, 'Cannot permanently delete supervisor with assigned officers. Reassign officers first.');
        }
        await db.query('DELETE FROM users WHERE id = ?', [supervisorId]);
    } else {
        // Soft delete
        await db.query(
            'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [supervisorId]
        );
    }

    const responseData = {
        supervisor_id: `sup_${supervisorId}`,
        status: 'inactive',
        deactivated_at: new Date(),
        officers_reassigned: officersCount[0].count
    };

    return ApiResponse.success(res, responseData, 'Supervisor deactivated successfully');
});

/**
 * @desc    Reset Supervisor Password
 * @route   POST /api/v1/admin/supervisors/:supervisor_id/reset-password
 * @access  Private (Admin only)
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const supervisorId = req.params.supervisor_id.replace('sup_', '');
    const { new_password, send_email = false } = req.body;

    if (!new_password || new_password.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters');
    }

    // Check if supervisor exists
    const supervisor = await db.query(
        'SELECT * FROM users WHERE id = ? AND lga_id = ? AND role = "supervisor"',
        [supervisorId, lgaId]
    );

    if (!supervisor || supervisor.length === 0) {
        throw new ApiError(404, 'Supervisor not found');
    }

    // Hash new password
    const hashedPassword = await hashPassword(new_password);

    // Update password
    await db.query(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, supervisorId]
    );

    // TODO: Send email notification if send_email is true

    const responseData = {
        supervisor_id: `sup_${supervisorId}`,
        email_sent: send_email,
        must_change_password: true
    };

    return ApiResponse.success(res, responseData, 'Password reset successfully');
});
