/**
 * Format amount in kobo to Naira string
 * @param {number} kobo - Amount in kobo
 * @returns {string} - Formatted amount (e.g., "₦3,500")
 */
const formatCurrency = (kobo) => {
    if (kobo === null || kobo === undefined) return '₦0';
    const naira = kobo / 100;
    return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {object} - { percentage, direction }
 */
const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) {
        return {
            percentage: current > 0 ? 100 : 0,
            direction: current > 0 ? 'up' : 'neutral',
        };
    }

    const change = ((current - previous) / previous) * 100;
    return {
        percentage: Math.abs(parseFloat(change.toFixed(1))),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
};

/**
 * Get time ago string from timestamp
 * @param {Date|string} date - Date to compare
 * @returns {string} - Time ago string (e.g., "2 minutes ago")
 */
const timeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now - then) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
};

/**
 * Parse period query parameter to date range
 * @param {string} period - Period type (today, this_week, this_month, this_year, custom)
 * @param {string} startDate - Custom start date (YYYY-MM-DD)
 * @param {string} endDate - Custom end date (YYYY-MM-DD)
 * @returns {object} - { start, end, label }
 */
const parsePeriod = (period, startDate = null, endDate = null) => {
    const now = new Date();
    let start, end, label;

    switch (period) {
        case 'today':
            start = new Date(now.setHours(0, 0, 0, 0));
            end = new Date(now.setHours(23, 59, 59, 999));
            label = 'Today';
            break;

        case 'this_week':
            const dayOfWeek = now.getDay();
            start = new Date(now.setDate(now.getDate() - dayOfWeek));
            start.setHours(0, 0, 0, 0);
            end = new Date();
            label = 'This Week';
            break;

        case 'this_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date();
            label = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            break;

        case 'this_year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date();
            label = now.getFullYear().toString();
            break;

        case 'custom':
            if (!startDate || !endDate) {
                throw new Error('start_date and end_date required for custom period');
            }
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            label = `${startDate} to ${endDate}`;
            break;

        default:
            throw new Error('Invalid period. Use: today, this_week, this_month, this_year, custom');
    }

    return {
        start,
        end,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        label,
    };
};

/**
 * Generate array of dates between start and end (for daily trends)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array<string>} - Array of date strings (YYYY-MM-DD)
 */
const getDateRange = (startDate, endDate) => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Paginate array
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {object} - { data, pagination }
 */
const paginate = (array, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const paginatedData = array.slice(offset, offset + limit);
    const totalPages = Math.ceil(array.length / limit);

    return {
        data: paginatedData,
        pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total_pages: totalPages,
            total_records: array.length,
        },
    };
};

module.exports = {
    formatCurrency,
    calculateTrend,
    timeAgo,
    parsePeriod,
    getDateRange,
    paginate,
};
