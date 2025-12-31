const asyncHandler = require('../../middleware/asyncHandler');
const { formatCurrency } = require('../../utils/helpers');
const db = require('../../config/database');

/**
 * @desc    Get all personnel across the system with pagination, search, and filters
 * @route   GET /api/v1/super-admin/personnel
 * @access  Private (Super Admin only)
 */
const getAllPersonnel = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        search,
        role = 'all',
        lga_id,
        status = 'all',
        sort_by = 'name',
        sort_order = 'asc'
    } = req.query;

    // Validate limit (max 100)
    const perPage = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * perPage;

    // Build WHERE clause
    const whereClauses = [];
    const params = [];

    // Search filter
    if (search) {
        whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    // Role filter
    if (role !== 'all') {
        whereClauses.push('u.role = ?');
        params.push(role);
    }

    // LGA filter
    if (lga_id) {
        whereClauses.push('u.lga_id = ?');
        params.push(lga_id);
    }

    // Status filter
    if (status === 'active') {
        whereClauses.push('u.is_active = TRUE');
    } else if (status === 'inactive') {
        whereClauses.push('u.is_active = FALSE');
    } else if (status === 'suspended') {
        whereClauses.push('u.is_active = FALSE AND u.suspended = TRUE');
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Validate sort fields
    const allowedSortFields = {
        'name': 'u.name',
        'email': 'u.email',
        'role': 'u.role',
        'activations': 'total_activations',
        'created_at': 'u.created_at'
    };

    const sortField = allowedSortFields[sort_by] || 'u.name';
    const sortDirection = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Get personnel with stats
    const personnelSql = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.lga_id,
            l.name as lga_name,
            l.code as lga_code,
            u.supervisor_id,
            s.name as supervisor_name,
            u.is_active,
            u.created_at,
            u.last_login_at,
            CASE 
                WHEN u.last_login_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN TRUE 
                ELSE FALSE 
            END as is_online,
            COALESCE(act_stats.total_activations, 0) as total_activations,
            COALESCE(act_stats.total_revenue, 0) as total_revenue
        FROM users u
        LEFT JOIN lgas l ON u.lga_id = l.id
        LEFT JOIN users s ON u.supervisor_id = s.id
        LEFT JOIN (
            SELECT 
                officer_id,
                COUNT(*) as total_activations,
                SUM(amount_paid) as total_revenue
            FROM activations
            GROUP BY officer_id
        ) act_stats ON u.id = act_stats.officer_id
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
    `;

    // Get total count for pagination
    const countSql = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
    `;

    // Execute queries in parallel
    const [personnel, countResult] = await Promise.all([
        db.query(personnelSql, [...params, perPage, offset]),
        db.query(countSql, params)
    ]);

    const totalCount = countResult[0].total;
    const totalPages = Math.ceil(totalCount / perPage);

    // Get statistics
    const statsSql = `
        SELECT 
            COUNT(*) as total_personnel,
            SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
            SUM(CASE WHEN role = 'lga_admin' THEN 1 ELSE 0 END) as lga_admins,
            SUM(CASE WHEN role = 'supervisor' THEN 1 ELSE 0 END) as supervisors,
            SUM(CASE WHEN role = 'officer' THEN 1 ELSE 0 END) as officers,
            SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_count,
            SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_count
        FROM users
        ${whereClause}
    `;

    const statsResult = await db.query(statsSql, params);

    // Format personnel data
    const formattedPersonnel = personnel.map(person => ({
        id: person.id,
        name: person.name,
        email: person.email,
        phone: person.phone,
        role: person.role,
        lga_id: person.lga_id,
        lga_name: person.lga_name || (person.role === 'super_admin' ? 'System Wide' : null),
        lga_code: person.lga_code || null,
        supervisor_id: person.supervisor_id,
        supervisor_name: person.supervisor_name,
        status: person.is_active ? 'active' : 'inactive',
        is_online: Boolean(person.is_online),
        total_activations: parseInt(person.total_activations),
        total_revenue: parseInt(person.total_revenue),
        created_at: person.created_at,
        last_login: person.last_login_at
    }));

    res.status(200).json({
        success: true,
        message: 'Personnel retrieved successfully',
        data: {
            personnel: formattedPersonnel,
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages,
                total_count: totalCount,
                per_page: perPage,
                has_next: parseInt(page) < totalPages,
                has_prev: parseInt(page) > 1
            },
            statistics: {
                total_personnel: parseInt(statsResult[0].total_personnel),
                super_admins: parseInt(statsResult[0].super_admins),
                lga_admins: parseInt(statsResult[0].lga_admins),
                supervisors: parseInt(statsResult[0].supervisors),
                officers: parseInt(statsResult[0].officers),
                active_count: parseInt(statsResult[0].active_count),
                inactive_count: parseInt(statsResult[0].inactive_count)
            }
        }
    });
});

module.exports = {
    getAllPersonnel
};
