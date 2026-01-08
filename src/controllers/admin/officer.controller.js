// src/controllers/admin/officer.controller.js
const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const User = require('../../models/User');
const { hashPassword } = require('../../utils/auth');
const db = require('../../config/database');

/**
 * @desc    Get All Officers
 * @route   GET /api/v1/admin/officers
 * @access  Private (Admin only)
 */
exports.getAllOfficers = asyncHandler(async (req, res) => {
    try {
        console.log('=== GET OFFICERS LIST REQUEST ===');
        console.log('Query Params:', req.query);
        console.log('User LGA ID:', req.user.lga_id);

        const lgaId = req.user.lga_id;
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            supervisor_id = '',
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Validate sort_by field
        const validSortFields = ['name', 'activations_count', 'revenue', 'created_at'];
        if (sort_by && !validSortFields.includes(sort_by)) {
            throw new ApiError(400, `Invalid sort_by field. Must be one of: ${validSortFields.join(', ')}`);
        }

        // Validate sort_order
        if (sort_order && !['asc', 'desc'].includes(sort_order.toLowerCase())) {
            throw new ApiError(400, 'Invalid sort_order. Must be either asc or desc');
        }

        // Validate and cap limit at 100
        const parsedLimit = Math.min(parseInt(limit) || 10, 100);
        const parsedPage = parseInt(page) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const sortColumn = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let whereClause = 'WHERE o.lga_id = ? AND o.role = "officer"';
        const params = [lgaId];
        const countParams = [lgaId];

        if (search) {
            whereClause += ' AND (o.name LIKE ? OR o.username LIKE ? OR o.officer_code LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (status) {
            const isActive = status === 'active' ? 1 : 0;
            whereClause += ' AND o.is_active = ?';
            params.push(isActive);
            countParams.push(isActive);
        }

        if (supervisor_id) {
            const supId = supervisor_id.replace('sup_', '');
            whereClause += ' AND o.supervisor_id = ?';
            params.push(supId);
            countParams.push(supId);
        }

        console.log('Fetching total count...');

        // Get total count
        const countResult = await db.query(`
            SELECT COUNT(*) as total
            FROM users o
            ${whereClause}
        `, countParams);

        const total = countResult[0].total;

        console.log(`Total officers found: ${total}`);

        // Build sort clause
        let sortClause = 'ORDER BY ';
        if (sortColumn === 'activations_count') {
            sortClause += `total_activations ${order}`;
        } else if (sortColumn === 'revenue') {
            sortClause += `revenue_generated ${order}`;
        } else {
            sortClause += `o.${sortColumn} ${order}`;
        }

        console.log('Fetching officers with statistics...');

        // Build fresh params array for main query (params was used for count)
        const queryParams = [];
        queryParams.push(lgaId);

        if (search) {
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (status) {
            const isActive = status === 'active' ? 1 : 0;
            queryParams.push(isActive);
        }

        if (supervisor_id) {
            const supId = supervisor_id.replace('sup_', '');
            queryParams.push(supId);
        }

        // Get officers with activation statistics from activations table
        const sql = `
            SELECT 
                o.id as officer_id,
                o.officer_code,
                o.name,
                o.username,
                o.phone,
                o.is_active as status,
                o.lga_id,
                l.name as lga_name,
                o.supervisor_id,
                s.name as supervisor_name,
                s.officer_code as supervisor_code,
                o.created_at,
                o.last_login_at as last_login,
                COUNT(DISTINCT a.id) as total_activations,
                COALESCE(SUM(a.amount_paid), 0) as revenue_generated,
                CASE 
                    WHEN COUNT(DISTINCT a.id) > 0 
                    THEN ROUND((COUNT(DISTINCT a.id) * 100.0 / COUNT(DISTINCT a.id)), 0)
                    ELSE 0 
                END as success_rate,
                CASE 
                    WHEN COUNT(DISTINCT a.id) > 0 AND DATEDIFF(NOW(), MIN(a.created_at)) > 0
                    THEN ROUND(COUNT(DISTINCT a.id) / DATEDIFF(NOW(), MIN(a.created_at)), 2)
                    ELSE 0 
                END as avg_daily_activations,
                MAX(a.created_at) as last_activation_date
            FROM users o
            LEFT JOIN lgas l ON o.lga_id = l.id
            LEFT JOIN users s ON o.supervisor_id = s.id
            LEFT JOIN activations a ON (a.officer_id = o.id OR a.activated_by = o.id) AND a.lga_id = o.lga_id
            ${whereClause}
            GROUP BY o.id, o.officer_code, o.name, o.username, o.phone, o.is_active, 
                     o.lga_id, l.name, o.supervisor_id, s.name, s.officer_code, 
                     o.created_at, o.last_login_at
            ${sortClause}
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(parsedLimit), parseInt(offset));

        const officers = await db.query(sql, queryParams);

        console.log(`Retrieved ${officers.length} officers`);

        // Get summary statistics (simplified - no activation stats for now)
        console.log('Fetching summary statistics...');

        const summaryResult = await db.query(`
            SELECT 
                COUNT(DISTINCT o.id) as total_officers,
                SUM(CASE WHEN o.is_active = 1 THEN 1 ELSE 0 END) as active_officers,
                SUM(CASE WHEN o.is_active = 0 THEN 1 ELSE 0 END) as inactive_officers,
                COUNT(DISTINCT a.id) as total_activations,
                COALESCE(SUM(a.amount_paid), 0) as total_revenue
            FROM users o
            LEFT JOIN activations a ON (a.officer_id = o.id OR a.activated_by = o.id) AND a.lga_id = ?
            WHERE o.lga_id = ? AND o.role = 'officer'
        `, [lgaId, lgaId]);

        const summary = summaryResult[0];

        // Get top performer with actual stats
        const topPerformerResult = await db.query(`
            SELECT 
                o.officer_code,
                o.name,
                COUNT(DISTINCT a.id) as activations_count
            FROM users o
            LEFT JOIN activations a ON (a.officer_id = o.id OR a.activated_by = o.id) AND a.lga_id = ?
            WHERE o.role = 'officer' AND o.lga_id = ?
            GROUP BY o.id, o.officer_code, o.name
            ORDER BY activations_count DESC, o.created_at DESC
            LIMIT 1
        `, [lgaId, lgaId]);

        const topPerformer = topPerformerResult.length > 0 ? topPerformerResult[0] : null;

        const totalPages = Math.ceil(total / parsedLimit);

        const responseData = {
            officers: officers.map(officer => ({
                id: `off_${officer.officer_id}`,
                officer_code: officer.officer_code,
                name: officer.name,
                username: officer.username,
                phone: officer.phone || 'N/A',
                status: officer.status ? 'active' : 'inactive',
                lga_id: `lga_${officer.lga_id}`,
                lga_name: officer.lga_name,
                supervisor_id: officer.supervisor_id ? `sup_${officer.supervisor_id}` : null,
                supervisor_name: officer.supervisor_name || 'N/A',
                supervisor_code: officer.supervisor_code || null,
                statistics: {
                    activations_count: parseInt(officer.total_activations) || 0,
                    total_revenue: parseFloat(officer.revenue_generated) || 0,
                    success_rate: parseFloat(officer.success_rate) || 0,
                    avg_daily_activations: parseFloat(officer.avg_daily_activations) || 0,
                    last_activation_date: officer.last_activation_date || null
                },
                last_login: officer.last_login,
                created_at: officer.created_at
            })),
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total: total,
                total_pages: totalPages,
                has_next: parsedPage < totalPages,
                has_prev: parsedPage > 1
            },
            summary: {
                total_officers: summary.total_officers || 0,
                active_officers: summary.active_officers || 0,
                inactive_officers: summary.inactive_officers || 0,
                total_activations: summary.total_activations || 0,
                total_revenue: parseFloat(summary.total_revenue) || 0,
                avg_success_rate: 97.3, // Placeholder
                top_performer: topPerformer ? {
                    officer_code: topPerformer.officer_code,
                    name: topPerformer.name,
                    activations_count: topPerformer.activations_count
                } : null
            }
        };

        console.log('=== GET OFFICERS LIST SUCCESS ===');

        return ApiResponse.success(res, responseData, 'Officers retrieved successfully', 200);

    } catch (error) {
        console.error('=== GET OFFICERS LIST ERROR ===');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Error Status:', error.statusCode || 'N/A');
        console.error('Error Stack:', error.stack);
        console.error('====================================');
        throw error;
    }
});

/**
 * @desc    Get Officer Details
 * @route   GET /api/v1/admin/officers/:officer_id
 * @access  Private (Admin only)
 */
exports.getOfficerDetails = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const officerId = req.params.officer_id.replace('off_', '');

    const [officer] = await db.query(`
        SELECT 
            o.id as officer_id,
            CONCAT('IFO-OFF-', LPAD(o.id, 3, '0')) as officer_code,
            o.name,
            o.email,
            o.phone,
            o.is_active as status,
            o.lga_id,
            l.name as lga_name,
            o.supervisor_id,
            s.name as supervisor_name,
            o.created_at,
            c.name as created_by,
            o.last_login_at as last_login
        FROM users o
        LEFT JOIN lgas l ON o.lga_id = l.id
        LEFT JOIN users s ON o.supervisor_id = s.id
        LEFT JOIN users c ON o.created_by = c.id
        WHERE o.id = ? AND o.lga_id = ? AND o.role = 'officer'
    `, [officerId, lgaId]);

    if (!officer || officer.length === 0) {
        throw new ApiError(404, 'Officer not found');
    }

    const officerData = officer[0];

    // Get statistics
    const [statistics] = await db.query(`
        SELECT 
            COUNT(st.id) as total_activations,
            COALESCE(SUM(st.price / 100), 0) as revenue_generated,
            ROUND((COUNT(CASE WHEN st.status IN ('active', 'expired') THEN 1 END) * 100.0 / GREATEST(COUNT(st.id), 1)), 1) as success_rate,
            COUNT(CASE WHEN MONTH(st.activated_at) = MONTH(CURRENT_DATE()) THEN 1 END) as this_month_activations,
            COALESCE(SUM(CASE WHEN MONTH(st.activated_at) = MONTH(CURRENT_DATE()) THEN st.price / 100 END), 0) as this_month_revenue,
            COUNT(CASE WHEN MONTH(st.activated_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN 1 END) as last_month_activations,
            COALESCE(SUM(CASE WHEN MONTH(st.activated_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN st.price / 100 END), 0) as last_month_revenue
        FROM stickers st
        WHERE st.activated_by = ?
    `, [officerId]);

    // Get recent activations
    const recentActivations = await db.query(`
        SELECT 
            id as activation_id,
            code as sticker_id,
            price / 100 as amount,
            activated_at as timestamp
        FROM stickers
        WHERE activated_by = ?
        ORDER BY activated_at DESC
        LIMIT 10
    `, [officerId]);

    const responseData = {
        officer_id: `off_${officerData.officer_id}`,
        officer_code: officerData.officer_code,
        name: officerData.name,
        email: officerData.email,
        phone: officerData.phone || 'N/A',
        status: officerData.status ? 'active' : 'inactive',
        lga_id: `lga_${officerData.lga_id}`,
        lga_name: officerData.lga_name,
        supervisor_id: officerData.supervisor_id ? `sup_${officerData.supervisor_id}` : null,
        supervisor_name: officerData.supervisor_name || 'N/A',
        created_at: officerData.created_at,
        created_by: officerData.created_by || 'System',
        last_login: officerData.last_login,
        statistics: {
            total_activations: statistics[0].total_activations || 0,
            revenue_generated: parseFloat(statistics[0].revenue_generated) || 0,
            success_rate: parseFloat(statistics[0].success_rate) || 0,
            average_daily_activations: 0, // Calculate if needed
            this_month: {
                activations: statistics[0].this_month_activations || 0,
                revenue: parseFloat(statistics[0].this_month_revenue) || 0
            },
            last_month: {
                activations: statistics[0].last_month_activations || 0,
                revenue: parseFloat(statistics[0].last_month_revenue) || 0
            }
        },
        recent_activations: recentActivations.map(act => ({
            activation_id: `act_${act.activation_id}`,
            sticker_id: act.sticker_id,
            cart_pusher_name: 'N/A',
            amount: parseFloat(act.amount),
            timestamp: act.timestamp,
            location: null
        }))
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Officer details retrieved successfully'));
});

/**
 * @desc    Create Officer
 * @route   POST /api/v1/admin/officers
 * @access  Private (Admin only)
 */
exports.createOfficer = asyncHandler(async (req, res) => {
    try {
        console.log('=== CREATE OFFICER REQUEST ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('User LGA ID:', req.user.lga_id);
        console.log('User Role:', req.user.role);

        const lgaId = req.user.lga_id;
        const { name, username, email, phone, password, supervisor_id } = req.body;

        // Validation
        console.log('Starting validation...');

        if (!name || name.length < 3 || name.length > 100) {
            console.log('VALIDATION ERROR: Name validation failed');
            throw new ApiError(400, 'Name must be between 3 and 100 characters');
        }

        if (!username || username.length < 3) {
            console.log('VALIDATION ERROR: Username validation failed');
            throw new ApiError(400, 'Username is required and must be at least 3 characters');
        }

        // Validate email if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                console.log('VALIDATION ERROR: Invalid email format');
                throw new ApiError(400, 'Invalid email format');
            }

            // Check if email already exists
            const existingEmail = await db.query(
                'SELECT id FROM users WHERE email = ? AND role = "officer"',
                [email]
            );
            if (existingEmail.length > 0) {
                console.log('EMAIL CONFLICT: Email already exists');
                throw new ApiError(409, 'Email already exists');
            }
        }

        if (!phone) {
            console.log('VALIDATION ERROR: Phone validation failed');
            throw new ApiError(400, 'Phone number is required');
        }

        // Validate Nigerian phone number format
        const phoneRegex = /^(\+234|0)[7-9][0-1]\d{8}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            console.log('VALIDATION ERROR: Invalid phone format');
            throw new ApiError(400, 'Phone number must be a valid Nigerian number');
        }

        if (!password || password.length < 8) {
            console.log('VALIDATION ERROR: Password validation failed');
            throw new ApiError(400, 'Password must be at least 8 characters');
        }

        if (!supervisor_id) {
            console.log('VALIDATION ERROR: Supervisor ID missing');
            throw new ApiError(400, 'Supervisor ID is required');
        }

        console.log('Validation passed. Checking for existing username...');

        // Check if username already exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            console.log('USERNAME CONFLICT: Username already exists:', username);
            throw new ApiError(409, 'Username already exists');
        }

        console.log('Username is unique. Verifying supervisor...');

        const supId = supervisor_id.replace('sup_', '');

        // Verify supervisor exists and belongs to same LGA
        const supervisorResults = await db.query(
            'SELECT * FROM users WHERE id = ? AND lga_id = ? AND role = "supervisor" AND is_active = 1',
            [supId, lgaId]
        );

        if (!supervisorResults || supervisorResults.length === 0) {
            console.log('SUPERVISOR ERROR: Supervisor not found or inactive');
            throw new ApiError(404, 'The specified supervisor does not exist or is inactive');
        }

        const supervisor = supervisorResults[0];

        console.log('Supervisor verified. Checking officer limit...');

        // Check supervisor's officer limit
        const limitResults = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE supervisor_id = ? AND role = "officer" AND is_active = 1',
            [supId]
        );
        const officerCount = limitResults[0].count;

        if (officerCount >= 50) {
            console.log('LIMIT ERROR: Supervisor has reached officer limit');
            throw new ApiError(403, 'This supervisor has reached the maximum number of officers (50)');
        }

        console.log(`Supervisor has ${50 - officerCount} slots remaining. Hashing password...`);

        // Hash password
        const hashedPassword = await hashPassword(password);
        console.log('Password hashed successfully');

        // Get LGA details for officer code
        const lgaResults = await db.query('SELECT name, code FROM lgas WHERE id = ?', [lgaId]);

        if (!lgaResults.length) {
            throw new ApiError(500, 'LGA not found');
        }

        const lga = lgaResults[0];
        const year = new Date().getFullYear();

        // Generate officer code: OFF-{LGA_CODE}-{YEAR}-{SEQUENCE}
        const prefix = `OFF-${lga.code}-${year}`;
        const codeResults = await db.query(
            'SELECT officer_code FROM users WHERE role = "officer" AND officer_code LIKE ? ORDER BY officer_code DESC LIMIT 1',
            [`${prefix}-%`]
        );

        let sequence = 1;
        if (codeResults.length > 0 && codeResults[0].officer_code) {
            const lastCode = codeResults[0].officer_code;
            const lastSequence = parseInt(lastCode.split('-').pop());
            sequence = lastSequence + 1;
        }

        const officerCode = `${prefix}-${sequence.toString().padStart(4, '0')}`;

        console.log('Creating officer with code:', officerCode);

        // Create officer with email field
        const createResult = await db.query(
            `INSERT INTO users (name, email, username, password, phone, role, lga_id, supervisor_id, officer_code, is_active, created_at) 
             VALUES (?, ?, ?, ?, ?, 'officer', ?, ?, ?, 1, NOW())`,
            [name, email || null, username, hashedPassword, phone, lgaId, supId, officerCode]
        );

        const officerId = createResult.insertId;
        console.log('Officer created successfully:', officerId);

        const responseData = {
            officer: {
                id: `off_${officerId}`,
                officer_code: officerCode,
                name: name,
                username: username,
                email: email || null,
                phone: phone,
                status: 'active',
                lga_id: `lga_${lgaId}`,
                lga_name: lga.name,
                supervisor_id: `sup_${supId}`,
                supervisor_name: supervisor.name,
                created_at: new Date().toISOString(),
                created_by: `admin_${req.user.id}`
            },
            temporary_password: password,
            officer_code: officerCode
        };

        console.log('Sending success response');
        console.log('=== CREATE OFFICER SUCCESS ===');

        return ApiResponse.success(res, responseData, 'Officer created successfully', 201);

    } catch (error) {
        console.error('=== CREATE OFFICER ERROR ===');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Error Status:', error.statusCode || 'N/A');
        console.error('Error Stack:', error.stack);
        console.error('=================================');
        throw error;
    }
});

/**
 * @desc    Update Officer
 * @route   PUT /api/v1/admin/officers/:officer_id
 * @access  Private (Admin only)
 */
exports.updateOfficer = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const officerId = req.params.officer_id.replace('off_', '');
    const { name, email, phone, status, supervisor_id } = req.body;

    // Check officer exists
    const [officer] = await db.query(
        'SELECT * FROM users WHERE id = ? AND lga_id = ? AND role = "officer"',
        [officerId, lgaId]
    );

    if (!officer || officer.length === 0) {
        throw new ApiError(404, 'Officer not found');
    }

    const updates = [];
    const params = [];

    if (name) {
        updates.push('name = ?');
        params.push(name);
    }

    if (email) {
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, officerId]
        );
        if (existing && existing.length > 0) {
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
        updates.push('is_active = ?');
        params.push(status === 'active' ? 1 : 0);
    }

    if (supervisor_id) {
        const supId = supervisor_id.replace('sup_', '');
        updates.push('supervisor_id = ?');
        params.push(supId);
    }

    if (updates.length === 0) {
        throw new ApiError(400, 'No fields to update');
    }

    params.push(officerId);

    await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
    );

    // Get updated officer with supervisor name
    const [updated] = await db.query(`
        SELECT o.*, s.name as supervisor_name
        FROM users o
        LEFT JOIN users s ON o.supervisor_id = s.id
        WHERE o.id = ?
    `, [officerId]);

    const responseData = {
        officer_id: `off_${updated[0].id}`,
        officer_code: `IFO-OFF-${String(updated[0].id).padStart(3, '0')}`,
        name: updated[0].name,
        email: updated[0].email,
        phone: updated[0].phone,
        status: updated[0].is_active ? 'active' : 'inactive',
        supervisor_id: updated[0].supervisor_id ? `sup_${updated[0].supervisor_id}` : null,
        supervisor_name: updated[0].supervisor_name,
        updated_at: updated[0].updated_at
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Officer updated successfully'));
});

/**
 * @desc    Delete/Deactivate Officer
 * @route   DELETE /api/v1/admin/officers/:officer_id
 * @access  Private (Admin only)
 */
exports.deleteOfficer = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const officerId = req.params.officer_id.replace('off_', '');
    const { permanent = false, reason = '' } = req.query;

    const [officer] = await db.query(
        'SELECT * FROM users WHERE id = ? AND lga_id = ? AND role = "officer"',
        [officerId, lgaId]
    );

    if (!officer || officer.length === 0) {
        throw new ApiError(404, 'Officer not found');
    }

    if (permanent === 'true') {
        await db.query('DELETE FROM users WHERE id = ?', [officerId]);
    } else {
        await db.query(
            'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [officerId]
        );
    }

    const responseData = {
        officer_id: `off_${officerId}`,
        status: 'inactive',
        deactivated_at: new Date(),
        reason: reason || 'N/A'
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Officer deactivated successfully'));
});

/**
 * @desc    Reassign Officer to Supervisor
 * @route   PATCH /api/v1/admin/officers/:officer_id/reassign
 * @access  Private (Admin only)
 */
exports.reassignOfficer = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const officerId = req.params.officer_id.replace('off_', '');
    const { new_supervisor_id, reason = '' } = req.body;

    if (!new_supervisor_id) {
        throw new ApiError(400, 'New supervisor ID is required');
    }

    const newSupId = new_supervisor_id.replace('sup_', '');

    // Get current officer info
    const [officer] = await db.query(`
        SELECT o.*, s.id as prev_sup_id, s.name as prev_sup_name
        FROM users o
        LEFT JOIN users s ON o.supervisor_id = s.id
        WHERE o.id = ? AND o.lga_id = ? AND o.role = 'officer'
    `, [officerId, lgaId]);

    if (!officer || officer.length === 0) {
        throw new ApiError(404, 'Officer not found');
    }

    // Verify new supervisor exists
    const [newSupervisor] = await db.query(
        'SELECT * FROM users WHERE id = ? AND lga_id = ? AND role = "supervisor"',
        [newSupId, lgaId]
    );

    if (!newSupervisor || newSupervisor.length === 0) {
        throw new ApiError(404, 'New supervisor not found');
    }

    // Update officer
    await db.query(
        'UPDATE users SET supervisor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newSupId, officerId]
    );

    const responseData = {
        officer_id: `off_${officerId}`,
        officer_name: officer[0].name,
        previous_supervisor: {
            supervisor_id: officer[0].prev_sup_id ? `sup_${officer[0].prev_sup_id}` : null,
            supervisor_name: officer[0].prev_sup_name || 'N/A'
        },
        new_supervisor: {
            supervisor_id: new_supervisor_id,
            supervisor_name: newSupervisor[0].name
        },
        reassigned_at: new Date()
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Officer reassigned successfully'));
});

/**
 * @desc    Reset Officer Password
 * @route   POST /api/v1/admin/officers/:officer_id/reset-password
 * @access  Private (Admin only)
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const lgaId = req.user.lga_id;
    const officerId = req.params.officer_id.replace('off_', '');
    const { new_password, send_sms = false } = req.body;

    if (!new_password || new_password.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters');
    }

    const [officer] = await db.query(
        'SELECT * FROM users WHERE id = ? AND lga_id = ? AND role = "officer"',
        [officerId, lgaId]
    );

    if (!officer || officer.length === 0) {
        throw new ApiError(404, 'Officer not found');
    }

    const hashedPassword = await hashPassword(new_password);

    await db.query(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, officerId]
    );

    const responseData = {
        officer_id: `off_${officerId}`,
        sms_sent: send_sms,
        must_change_password: true
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Password reset successfully'));
});
