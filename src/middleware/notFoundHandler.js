/**
 * 404 Not Found handler middleware
 * Handles requests to undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

module.exports = notFoundHandler;
