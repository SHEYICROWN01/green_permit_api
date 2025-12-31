const { verifyToken } = require('../utils/auth');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'Authentication required', false);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to request
        // Handle both regular user tokens and officer tokens
        req.user = {
            id: decoded.id || decoded.userId || decoded.user_id, // Officer tokens use userId
            officerId: decoded.officerId || null, // Officer code (e.g., OFC-TEST-001)
            userId: decoded.userId || decoded.id || decoded.user_id, // Database user ID
            supervisor_id: decoded.supervisor_id || null,
            email: decoded.email,
            name: decoded.name || null,
            role: decoded.role,
            lga_id: decoded.lga_id || decoded.lgaId || null,
            lgaId: decoded.lgaId || decoded.lga_id || null,
            lgaAssigned: decoded.lgaAssigned || null,
        };

        next();
    } catch (error) {
        if (error.message === 'TOKEN_EXPIRED') {
            return next(new ApiError(401, 'Your session has expired, please login again'));
        }
        if (error.message === 'INVALID_TOKEN') {
            return next(new ApiError(401, 'Invalid authentication token'));
        }
        next(error);
    }
};

/**
 * Middleware to verify user has required role
 * @param {...string} roles - Allowed roles (e.g., 'super_admin', 'lga_admin')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, "You don't have permission to perform this action"));
        }

        next();
    };
};

/**
 * Middleware specifically for super admin routes
 */
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
    }

    if (req.user.role !== 'super_admin') {
        return next(new ApiError(403, 'Super Admin access required'));
    }

    next();
};

/**
 * Middleware to require one of multiple roles
 * @param {Array} roles - Array of allowed roles
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, `Access denied. Required roles: ${roles.join(', ')}`));
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize,
    requireSuperAdmin,
    requireRole,
};
