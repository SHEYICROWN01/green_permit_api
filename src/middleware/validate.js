const { validationResult } = require('express-validator');

/**
 * Validation middleware
 * Checks for validation errors and returns them if found
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value,
            })),
        });
    }

    next();
};

module.exports = validate;
