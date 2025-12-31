const db = require('../config/database');

// Activity type constants
const ACTIVITY_TYPES = {
    // Personnel
    OFFICER_ADDED: 'officer_added',
    OFFICER_REMOVED: 'officer_removed',
    SUPERVISOR_ADDED: 'supervisor_added',
    SUPERVISOR_ASSIGNED: 'supervisor_assigned',

    // Stickers
    STICKERS_GENERATED: 'stickers_generated',
    STICKER_ACTIVATED: 'sticker_activated',
    STICKER_EXPIRED: 'sticker_expired',

    // Revenue
    REVENUE_MILESTONE: 'revenue_milestone',
    REVENUE_TARGET_ACHIEVED: 'revenue_target_achieved',

    // Settings
    PRICE_UPDATED: 'price_updated',
    LGA_INFO_UPDATED: 'lga_info_updated',
    LGA_ACTIVATED: 'lga_activated',
    LGA_DEACTIVATED: 'lga_deactivated'
};

const ACTIVITY_CATEGORIES = {
    PERSONNEL: 'personnel',
    STICKER: 'sticker',
    REVENUE: 'revenue',
    SETTINGS: 'settings'
};

class ActivityLog {
    /**
     * Create a new activity log entry
     */
    static async create(logData) {
        const sql = `
            INSERT INTO activity_logs (
                lga_id,
                type,
                category,
                title,
                message,
                details,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.query(sql, [
            logData.lga_id,
            logData.type,
            logData.category,
            logData.title,
            logData.message,
            JSON.stringify(logData.details || {}),
            logData.created_by || null
        ]);

        return await this.findById(result.insertId);
    }

    /**
     * Find activity log by ID
     */
    static async findById(id) {
        const sql = `
            SELECT 
                al.*,
                u.name as created_by_name
            FROM activity_logs al
            LEFT JOIN users u ON u.id = al.created_by
            WHERE al.id = ?
        `;
        const results = await db.query(sql, [id]);

        if (results[0] && results[0].details) {
            try {
                results[0].details = JSON.parse(results[0].details);
            } catch (e) {
                results[0].details = {};
            }
        }

        return results[0];
    }

    /**
     * Get activities for an LGA with filters and pagination
     */
    static async getByLGA(lgaId, options = {}) {
        const {
            page = 1,
            limit = 20,
            type = null,
            category = null,
            date_from = null,
            date_to = null
        } = options;

        const offset = (page - 1) * limit;
        const params = [lgaId];

        let whereClauses = ['al.lga_id = ?'];

        // Type filter
        if (type) {
            whereClauses.push('al.type = ?');
            params.push(type);
        }

        // Category filter
        if (category) {
            whereClauses.push('al.category = ?');
            params.push(category);
        }

        // Date range filters
        if (date_from) {
            whereClauses.push('DATE(al.created_at) >= ?');
            params.push(date_from);
        }
        if (date_to) {
            whereClauses.push('DATE(al.created_at) <= ?');
            params.push(date_to);
        }

        // Get activities with pagination
        const sql = `
            SELECT 
                al.id,
                al.type,
                al.category,
                al.title,
                al.message,
                al.details,
                al.created_by as created_by_id,
                u.name as created_by,
                al.created_at
            FROM activity_logs al
            LEFT JOIN users u ON u.id = al.created_by
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY al.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${offset}
        `;

        const activities = await db.query(sql, params);

        // Parse JSON details and add time_ago
        activities.forEach(activity => {
            if (activity.details) {
                try {
                    activity.details = JSON.parse(activity.details);
                } catch (e) {
                    activity.details = {};
                }
            }
            activity.time_ago = this.getTimeAgo(activity.created_at);
        });

        // Get total count
        const countSql = `
            SELECT COUNT(*) as total
            FROM activity_logs al
            WHERE ${whereClauses.join(' AND ')}
        `;
        const countResults = await db.query(countSql, params);
        const totalItems = countResults[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            activities,
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages,
                total_items: totalItems,
                items_per_page: parseInt(limit),
                has_next: page < totalPages,
                has_previous: page > 1
            }
        };
    }

    /**
     * Get recent activities for LGA (for details page)
     */
    static async getRecent(lgaId, limit = 10) {
        const sql = `
            SELECT 
                al.id,
                al.type,
                al.category,
                al.title,
                al.message,
                al.details,
                al.created_by as created_by_id,
                u.name as created_by,
                al.created_at
            FROM activity_logs al
            LEFT JOIN users u ON u.id = al.created_by
            WHERE al.lga_id = ?
            ORDER BY al.created_at DESC
            LIMIT ${parseInt(limit)}
        `;

        const activities = await db.query(sql, [lgaId]);

        // Parse JSON details and add time_ago
        activities.forEach(activity => {
            if (activity.details) {
                try {
                    activity.details = JSON.parse(activity.details);
                } catch (e) {
                    activity.details = {};
                }
            }
            activity.time_ago = this.getTimeAgo(activity.created_at);
        });

        return activities;
    }

    /**
     * Calculate time ago string
     */
    static getTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
        if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
        if (diffWeek > 0) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
        if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        return 'just now';
    }

    /**
     * Log officer added activity
     */
    static async logOfficerAdded(lgaId, officerData, createdBy) {
        return await this.create({
            lga_id: lgaId,
            type: ACTIVITY_TYPES.OFFICER_ADDED,
            category: ACTIVITY_CATEGORIES.PERSONNEL,
            title: 'New Officer Added',
            message: `New officer "${officerData.name}" added to the system`,
            details: {
                officer_id: officerData.id,
                officer_name: officerData.name,
                supervisor_id: officerData.supervisor_id,
                zone: officerData.zone
            },
            created_by: createdBy
        });
    }

    /**
     * Log stickers generated activity
     */
    static async logStickersGenerated(lgaId, batchData, createdBy) {
        return await this.create({
            lga_id: lgaId,
            type: ACTIVITY_TYPES.STICKERS_GENERATED,
            category: ACTIVITY_CATEGORIES.STICKER,
            title: 'Stickers Generated',
            message: `${batchData.quantity} new stickers generated`,
            details: {
                quantity: batchData.quantity,
                batch_id: batchData.batch_code,
                prefix: batchData.prefix,
                range_start: batchData.range_start,
                range_end: batchData.range_end
            },
            created_by: createdBy
        });
    }

    /**
     * Log price update activity
     */
    static async logPriceUpdate(lgaId, oldPrice, newPrice, createdBy) {
        const changePercentage = ((newPrice - oldPrice) / oldPrice * 100).toFixed(2);

        return await this.create({
            lga_id: lgaId,
            type: ACTIVITY_TYPES.PRICE_UPDATED,
            category: ACTIVITY_CATEGORIES.SETTINGS,
            title: 'Sticker Price Updated',
            message: `Sticker price changed from ₦${oldPrice.toLocaleString()} to ₦${newPrice.toLocaleString()}`,
            details: {
                old_price: oldPrice,
                new_price: newPrice,
                change_percentage: parseFloat(changePercentage)
            },
            created_by: createdBy
        });
    }

    /**
     * Log supervisor assignment activity
     */
    static async logSupervisorAssigned(lgaId, supervisorData, createdBy) {
        return await this.create({
            lga_id: lgaId,
            type: ACTIVITY_TYPES.SUPERVISOR_ASSIGNED,
            category: ACTIVITY_CATEGORIES.PERSONNEL,
            title: 'Supervisor Assignment',
            message: `Supervisor "${supervisorData.name}" assigned to Zone ${supervisorData.zone}`,
            details: {
                supervisor_id: supervisorData.id,
                supervisor_name: supervisorData.name,
                zone: supervisorData.zone,
                officers_count: supervisorData.officers_count || 0
            },
            created_by: createdBy
        });
    }

    /**
     * Generic log method for simple logging
     * @param {Object} params - Log parameters
     * @param {number} params.user_id - User ID who performed the action
     * @param {string} params.action - Action type/title
     * @param {string} params.category - Activity category
     * @param {string} params.description - Activity description/message
     * @param {Object} params.metadata - Additional metadata
     * @param {number} params.lga_id - Optional LGA ID
     */
    static async log({ user_id, action, category, description, metadata = {}, lga_id = null }) {
        return await this.create({
            lga_id,
            type: action,
            category,
            title: action,
            message: description,
            details: metadata,
            created_by: user_id
        });
    }
}

// Export class and constants
module.exports = ActivityLog;
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
module.exports.ACTIVITY_CATEGORIES = ACTIVITY_CATEGORIES;

