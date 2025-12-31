const LGA = require('../../models/LGA');
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');
const asyncHandler = require('../../middleware/asyncHandler');
const { hashPassword } = require('../../utils/auth');
const { formatCurrency } = require('../../utils/helpers');
const { pool } = require('../../config/database');

/**
 * @desc    Get all LGAs with optional filtering, search, and pagination
 * @route   GET /api/v1/super-admin/lgas
 * @access  Private (Super Admin only)
 */
const getLGAs = asyncHandler(async (req, res) => {
    const { search, state, status = 'all', page = 1, limit = 50 } = req.query;

    // Build base SQL query
    let sql = `
        SELECT 
            l.*,
            u.id as admin_id,
            u.name as admin_name,
            u.email as admin_email,
            u.phone as admin_phone
        FROM lgas l
        LEFT JOIN users u ON u.lga_id = l.id AND u.role = 'lga_admin'
        WHERE 1=1
    `;

    const params = [];

    // Apply filters
    if (search) {
        sql += ' AND (l.name LIKE ? OR l.code LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
    }

    if (state) {
        sql += ' AND l.state = ?';
        params.push(state);
    }

    if (status === 'active') {
        sql += ' AND l.is_active = TRUE';
    } else if (status === 'inactive') {
        sql += ' AND l.is_active = FALSE';
    }

    sql += ' ORDER BY l.created_at DESC';

    const [allLGAs] = await pool.execute(sql, params);

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = parseInt(page) * parseInt(limit);
    const total = allLGAs.length;
    const paginatedLGAs = allLGAs.slice(startIndex, endIndex);

    // Get stats for each LGA
    const lgasWithStats = await Promise.all(
        paginatedLGAs.map(async (lga) => {
            // Get revenue stats
            const [revenueResult] = await pool.execute(
                'SELECT COALESCE(SUM(amount_paid), 0) as total_revenue FROM activations WHERE lga_id = ?',
                [lga.id]
            );

            // Get officer count
            const [officersResult] = await pool.execute(
                'SELECT COUNT(*) as count FROM users WHERE lga_id = ? AND role = "officer"',
                [lga.id]
            );

            // Get supervisor count
            const [supervisorsResult] = await pool.execute(
                'SELECT COUNT(*) as count FROM users WHERE lga_id = ? AND role = "supervisor"',
                [lga.id]
            );

            // Get sticker counts
            const [stickersResult] = await pool.execute(
                'SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as activated FROM stickers WHERE lga_id = ?',
                [lga.id]
            );

            // Note: activations table doesn't have payment_status column
            // All activations are considered paid upon creation
            // Set pending_payments to 0 for now
            const pendingPayments = 0;

            return {
                id: lga.id,
                name: lga.name,
                lga_code: lga.code,
                state: lga.state,
                status: lga.is_active ? 'active' : 'inactive',
                address: lga.address,
                phone: lga.phone,
                email: lga.email,
                sticker_price: parseInt(lga.sticker_price),
                created_at: lga.created_at,
                admin: lga.admin_id ? {
                    id: lga.admin_id,
                    name: lga.admin_name,
                    email: lga.admin_email,
                    phone: lga.admin_phone
                } : null,
                stats: {
                    total_revenue: parseInt(revenueResult[0].total_revenue),
                    total_officers: officersResult[0].count,
                    total_supervisors: supervisorsResult[0].count,
                    total_stickers: stickersResult[0].total,
                    activated_stickers: stickersResult[0].activated || 0,
                    pending_payments: pendingPayments
                }
            };
        })
    );

    // Pagination metadata
    const pagination = {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_count: total,
        per_page: parseInt(limit),
        has_next: endIndex < total,
        has_prev: startIndex > 0
    };

    res.status(200).json({
        success: true,
        message: 'LGAs retrieved successfully',
        data: {
            lgas: lgasWithStats,
            pagination
        }
    });
});

/**
 * @desc    Create new LGA with admin user
 * @route   POST /api/v1/super-admin/lgas
 * @access  Private (Super Admin only)
 */
const createLGA = asyncHandler(async (req, res) => {
    const { lga, admin } = req.body;

    // Check if LGA code already exists
    const codeExists = await LGA.codeExists(lga.code);
    if (codeExists) {
        return res.status(400).json({
            success: false,
            message: 'LGA code already exists'
        });
    }

    // Check if sticker prefix already exists
    const prefixExists = await LGA.prefixExists(lga.sticker_prefix);
    if (prefixExists) {
        return res.status(400).json({
            success: false,
            message: 'Sticker prefix already exists'
        });
    }

    // Check if admin email already exists
    const emailExists = await User.findByEmail(admin.email);
    if (emailExists) {
        return res.status(400).json({
            success: false,
            message: 'Admin email already exists'
        });
    }

    // Check if admin username already exists
    const usernameExists = await User.findByUsername(admin.username);
    if (usernameExists) {
        return res.status(400).json({
            success: false,
            message: 'Admin username already exists'
        });
    }

    // Create LGA
    const newLGA = await LGA.create(
        {
            name: lga.name,
            state: lga.state,
            code: lga.code,
            sticker_prefix: lga.sticker_prefix,
            sticker_price: lga.sticker_price,
            address: lga.address,
            phone: lga.phone,
            email: lga.email
        },
        req.user.id
    );

    // Hash admin password
    const hashedPassword = await hashPassword(admin.password);

    // Create admin user for the LGA
    const adminUser = await User.create({
        lga_id: newLGA.id,
        name: admin.name,
        email: admin.email,
        username: admin.username,
        password: hashedPassword,
        phone: admin.phone,
        role: 'lga_admin'
    });

    // Remove password from response
    delete adminUser.password;

    res.status(201).json({
        success: true,
        message: 'LGA created successfully',
        data: {
            lga: newLGA,
            admin: adminUser
        }
    });
});

/**
 * @desc    Get LGA by ID with detailed information
 * @route   GET /api/v1/super-admin/lgas/:id
 * @access  Private (Super Admin only)
 */
const getLGAById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get LGA
    const lga = await LGA.findById(id);

    if (!lga) {
        return res.status(404).json({
            success: false,
            message: 'LGA not found'
        });
    }

    // Get LGA stats
    const stats = await LGA.getStats(id);

    // Get admin user
    const admin = await LGA.getAdmin(id);

    // Get recent batches
    const recentBatches = await LGA.getRecentBatches(id, 5);

    // Get top supervisors
    const topSupervisors = await LGA.getTopSupervisors(id, 5);

    // Remove password from admin if exists
    if (admin && admin.password) {
        delete admin.password;
    }

    res.status(200).json({
        success: true,
        message: 'LGA details retrieved successfully',
        data: {
            lga: {
                ...lga,
                admin,
                stats: {
                    total_revenue: stats.total_revenue || 0,
                    total_stickers: stats.total_stickers || 0,
                    active_stickers: stats.active_stickers || 0,
                    pending_stickers: stats.pending_stickers || 0,
                    expired_stickers: stats.expired_stickers || 0,
                    total_personnel: stats.total_personnel || 0,
                    supervisors: stats.supervisors || 0,
                    officers: stats.officers || 0,
                    total_batches: stats.total_batches || 0
                },
                recent_batches: recentBatches,
                top_supervisors: topSupervisors
            }
        }
    });
});

/**
 * @desc    Update LGA details
 * @route   PUT /api/v1/super-admin/lgas/:id
 * @access  Private (Super Admin only)
 */
const updateLGA = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Check if LGA exists
    const lga = await LGA.findById(id);
    if (!lga) {
        return res.status(404).json({
            success: false,
            message: 'LGA not found'
        });
    }

    // If updating code, check if it already exists
    if (updates.code && updates.code !== lga.code) {
        const codeExists = await LGA.codeExists(updates.code, id);
        if (codeExists) {
            return res.status(400).json({
                success: false,
                message: 'LGA code already exists'
            });
        }
    }

    // If updating sticker prefix, check if it already exists
    if (updates.sticker_prefix && updates.sticker_prefix !== lga.sticker_prefix) {
        const prefixExists = await LGA.prefixExists(updates.sticker_prefix, id);
        if (prefixExists) {
            return res.status(400).json({
                success: false,
                message: 'Sticker prefix already exists'
            });
        }
    }

    // Update LGA
    const updatedLGA = await LGA.update(id, updates);

    res.status(200).json({
        success: true,
        message: 'LGA updated successfully',
        data: {
            lga: updatedLGA
        }
    });
});

/**
 * @desc    Deactivate LGA (soft delete)
 * @route   DELETE /api/v1/super-admin/lgas/:id
 * @access  Private (Super Admin only)
 */
const deactivateLGA = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if LGA exists
    const lga = await LGA.findById(id);
    if (!lga) {
        return res.status(404).json({
            success: false,
            message: 'LGA not found'
        });
    }

    // Check if already inactive
    if (!lga.is_active) {
        return res.status(400).json({
            success: false,
            message: 'LGA is already deactivated'
        });
    }

    // Deactivate LGA
    await LGA.deactivate(id);

    // Deactivate all users associated with this LGA
    await User.deactivateByLGA(id);

    res.status(200).json({
        success: true,
        message: 'LGA and associated users deactivated successfully',
        data: null
    });
});

/**
 * @desc    Get comprehensive LGA details with stats, charts, and activity
 * @route   GET /api/v1/super-admin/lgas/:id/details
 * @access  Private (Super Admin only)
 */
const getLGADetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        include_stats = 'true',
        include_admin = 'true',
        include_charts = 'true',
        include_top_officers = 'true',
        include_recent_activity = 'true'
    } = req.query;

    console.log(`🔍 getLGADetails called with ID: ${id}, Type: ${typeof id}`);

    // Get basic LGA info
    const lga = await LGA.findById(id);

    console.log(`🔍 LGA.findById result:`, lga ? `Found: ${lga.name}` : 'NULL/UNDEFINED');

    if (!lga) {
        console.log(`❌ LGA not found for ID: ${id}`);
        return res.status(404).json({
            success: false,
            message: 'LGA not found',
            error: {
                code: 'LGA_NOT_FOUND',
                details: `No LGA exists with ID: ${id}`
            }
        });
    }

    console.log(`✅ LGA found: ${lga.name} (ID: ${lga.id})`);

    // Build response object
    const response = {
        id: lga.id,
        name: lga.name,
        state: lga.state,
        code: lga.code,
        sticker_prefix: lga.sticker_prefix,
        address: lga.address,
        phone: lga.phone,
        email: lga.email,
        sticker_price: lga.sticker_price,
        sticker_price_formatted: formatCurrency(lga.sticker_price),
        is_active: lga.is_active,
        status: lga.is_active ? 'active' : 'inactive',
        created_at: lga.created_at,
        updated_at: lga.updated_at
    };

    // Fetch data in parallel based on query parameters
    const promises = [];
    const keys = [];

    if (include_admin === 'true') {
        keys.push('admin');
        promises.push(LGA.getAdmin(id));
    }

    if (include_stats === 'true') {
        keys.push('stats');
        promises.push(LGA.getDetailedStats(id));
    }

    if (include_charts === 'true') {
        keys.push('monthly_revenue_chart');
        promises.push(LGA.getMonthlyRevenueChart(id));

        keys.push('weekly_activations_chart');
        promises.push(LGA.getWeeklyActivationsChart(id, lga.sticker_price));
    }

    if (include_top_officers === 'true') {
        keys.push('top_officers');
        promises.push(LGA.getTopOfficers(id, 5));
    }

    if (include_recent_activity === 'true') {
        keys.push('recent_activities');
        promises.push(ActivityLog.getRecent(id, 10));
    }

    const results = await Promise.all(promises);

    // Map results to response
    results.forEach((result, index) => {
        const key = keys[index];

        if (key === 'stats' && result) {
            // Format stats
            response.stats = {
                ...result,
                total_revenue_formatted: formatCurrency(result.total_revenue),
                monthly_revenue_formatted: formatCurrency(result.monthly_revenue),
                weekly_revenue_formatted: formatCurrency(result.weekly_revenue),
                daily_revenue_formatted: formatCurrency(result.daily_revenue)
            };
        } else if (key === 'monthly_revenue_chart') {
            // Format monthly revenue chart
            response.monthly_revenue_chart = result.map(item => ({
                month: item.month,
                month_full: item.month_full,
                value: item.value,
                value_formatted: formatCurrency(item.value),
                activations: item.activations,
                year: item.year,
                month_number: item.month_number
            }));
        } else if (key === 'weekly_activations_chart') {
            // Format weekly activations chart
            response.weekly_activations_chart = result.map((item, idx) => ({
                week: `Week ${idx + 1}`,
                value: item.value,
                start_date: item.start_date,
                end_date: item.end_date,
                revenue: item.revenue,
                revenue_formatted: formatCurrency(item.revenue)
            }));
        } else if (key === 'top_officers') {
            // Format top officers
            response.top_officers = result.map((officer, idx) => ({
                id: officer.id,
                name: officer.name,
                email: officer.email,
                phone: officer.phone,
                supervisor_id: officer.supervisor_id,
                supervisor_name: officer.supervisor_name,
                total_activations: officer.total_activations,
                active_stickers: officer.active_stickers,
                total_revenue: officer.total_revenue,
                total_revenue_formatted: formatCurrency(officer.total_revenue),
                rank: idx + 1,
                is_active: officer.is_active,
                joined_date: officer.joined_date
            }));
        } else if (key === 'admin') {
            // Format admin info
            if (result) {
                response.admin = {
                    id: result.id,
                    name: result.name,
                    email: result.email,
                    phone: result.phone,
                    username: result.username,
                    role: 'lga_admin',
                    is_active: result.is_active,
                    created_at: result.created_at,
                    last_login: result.last_login_at
                };
            }
        } else {
            response[key] = result;
        }
    });

    res.status(200).json({
        success: true,
        message: 'LGA details retrieved successfully',
        data: response
    });
});

/**
 * @desc    Get LGA personnel with filters and pagination
 * @route   GET /api/v1/super-admin/lgas/:id/personnel
 * @access  Private (Super Admin only)
 */
const getLGAPersonnel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        page = 1,
        limit = 20,
        role = 'all',
        status = 'all',
        search = '',
        sort_by = 'name',
        sort_order = 'asc'
    } = req.query;

    // Check if LGA exists
    const lga = await LGA.findById(id);
    if (!lga) {
        return res.status(404).json({
            success: false,
            message: 'LGA not found',
            error: {
                code: 'LGA_NOT_FOUND',
                details: `No LGA exists with ID: ${id}`
            }
        });
    }

    // Get personnel with filters
    const result = await LGA.getPersonnel(id, {
        page,
        limit,
        role,
        status,
        search,
        sort_by,
        sort_order
    });

    // Format personnel data
    const formattedPersonnel = result.personnel.map(person => ({
        id: person.id,
        name: person.name,
        email: person.email,
        phone: person.phone,
        role: person.role,
        supervisor_id: person.supervisor_id,
        supervisor_name: person.supervisor_name,
        zone: person.zone,
        total_activations: person.total_activations,
        active_stickers: person.active_stickers,
        total_revenue: person.total_revenue,
        total_revenue_formatted: formatCurrency(person.total_revenue),
        is_active: person.is_active,
        joined_date: person.joined_date,
        last_login: person.last_login
    }));

    res.status(200).json({
        success: true,
        message: 'Personnel retrieved successfully',
        data: {
            personnel: formattedPersonnel,
            pagination: result.pagination,
            summary: result.summary
        }
    });
});

/**
 * @desc    Get LGA stickers with filters and pagination
 * @route   GET /api/v1/super-admin/lgas/:id/stickers
 * @access  Private (Super Admin only)
 */
const getLGAStickers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        page = 1,
        limit = 50,
        status = 'all',
        search = '',
        officer_id = null,
        date_from = null,
        date_to = null
    } = req.query;

    // Check if LGA exists
    const lga = await LGA.findById(id);
    if (!lga) {
        return res.status(404).json({
            success: false,
            message: 'LGA not found',
            error: {
                code: 'LGA_NOT_FOUND',
                details: `No LGA exists with ID: ${id}`
            }
        });
    }

    // Get stickers with filters
    const result = await LGA.getStickers(id, {
        page,
        limit,
        status,
        search,
        officer_id,
        date_from,
        date_to
    });

    // Format stickers data
    const formattedStickers = result.stickers.map(sticker => ({
        id: sticker.id,
        code: sticker.code,
        status: sticker.status,
        vehicle_plate: sticker.vehicle_plate,
        vehicle_owner: sticker.vehicle_owner,
        vehicle_phone: sticker.vehicle_phone,
        activated_by: sticker.activated_by,
        activated_by_id: sticker.activated_by_id,
        activation_date: sticker.activation_date,
        expiry_date: sticker.expiry_date,
        price: sticker.price,
        price_formatted: formatCurrency(sticker.price),
        days_remaining: sticker.days_remaining
    }));

    res.status(200).json({
        success: true,
        message: 'Stickers retrieved successfully',
        data: {
            stickers: formattedStickers,
            pagination: result.pagination,
            summary: result.summary
        }
    });
});

/**
 * @desc    Get LGA activity logs with filters and pagination
 * @route   GET /api/v1/super-admin/lgas/:id/activities
 * @access  Private (Super Admin only)
 */
const getLGAActivities = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        page = 1,
        limit = 20,
        type = null,
        category = null,
        date_from = null,
        date_to = null
    } = req.query;

    // Check if LGA exists
    const lga = await LGA.findById(id);
    if (!lga) {
        return res.status(404).json({
            success: false,
            message: 'LGA not found',
            error: {
                code: 'LGA_NOT_FOUND',
                details: `No LGA exists with ID: ${id}`
            }
        });
    }

    // Get activities with filters
    const result = await ActivityLog.getByLGA(id, {
        page,
        limit,
        type,
        category,
        date_from,
        date_to
    });

    res.status(200).json({
        success: true,
        message: 'Activities retrieved successfully',
        data: {
            activities: result.activities,
            pagination: result.pagination
        }
    });
});

module.exports = {
    getLGAs,
    createLGA,
    getLGAById,
    updateLGA,
    deactivateLGA,
    getLGADetails,
    getLGAPersonnel,
    getLGAStickers,
    getLGAActivities
};
