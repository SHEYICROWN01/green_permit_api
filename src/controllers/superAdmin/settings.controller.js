const asyncHandler = require('../../middleware/asyncHandler');
const db = require('../../config/database');

/**
 * @desc    Get all system settings grouped by category
 * @route   GET /api/v1/super-admin/settings
 * @access  Private (Super Admin only)
 */
const getSettings = asyncHandler(async (req, res) => {
    // Fetch all settings from database
    const sql = `
        SELECT setting_key, setting_value, value_type, description
        FROM system_settings
        ORDER BY setting_key
    `;

    const settings = await db.query(sql);

    // Group settings by category
    const groupedSettings = {
        general: {},
        notifications: {},
        security: {},
        features: {},
        pricing: {}
    };

    settings.forEach(setting => {
        const { setting_key, setting_value, value_type } = setting;

        // Parse value based on type
        let parsedValue;
        switch (value_type) {
            case 'integer':
                parsedValue = parseInt(setting_value);
                break;
            case 'boolean':
                parsedValue = setting_value === 'true' || setting_value === '1';
                break;
            case 'json':
                try {
                    parsedValue = JSON.parse(setting_value);
                } catch (e) {
                    parsedValue = setting_value;
                }
                break;
            default:
                parsedValue = setting_value;
        }

        // Categorize settings based on key prefix
        if (setting_key.includes('email') || setting_key.includes('sms') || setting_key.includes('notification')) {
            groupedSettings.notifications[setting_key] = parsedValue;
        } else if (setting_key.includes('password') || setting_key.includes('login') || setting_key.includes('session') || setting_key.includes('security') || setting_key.includes('two_factor')) {
            groupedSettings.security[setting_key] = parsedValue;
        } else if (setting_key.includes('maintenance') || setting_key.includes('enable') || setting_key.includes('auto') || setting_key.includes('public')) {
            groupedSettings.features[setting_key] = parsedValue;
        } else if (setting_key.includes('price') || setting_key.includes('currency')) {
            groupedSettings.pricing[setting_key] = parsedValue;
        } else {
            groupedSettings.general[setting_key] = parsedValue;
        }
    });

    // Get last update info
    const lastUpdateSql = `
        SELECT MAX(updated_at) as last_updated
        FROM system_settings
    `;

    const lastUpdateResult = await db.query(lastUpdateSql);

    res.status(200).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: {
            general: groupedSettings.general,
            notifications: groupedSettings.notifications,
            security: groupedSettings.security,
            features: groupedSettings.features,
            pricing: groupedSettings.pricing,
            updated_at: lastUpdateResult[0]?.last_updated || null
        }
    });
});

/**
 * @desc    Update system settings
 * @route   PUT /api/v1/super-admin/settings
 * @access  Private (Super Admin only)
 */
const updateSettings = asyncHandler(async (req, res) => {
    const { category, settings } = req.body;

    // Validate request
    if (!category || !settings || typeof settings !== 'object') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_REQUEST',
                message: 'Category and settings object are required'
            }
        });
    }

    // Validate category
    const validCategories = ['general', 'notifications', 'security', 'features', 'pricing'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_CATEGORY',
                message: `Category must be one of: ${validCategories.join(', ')}`
            }
        });
    }

    // Update each setting
    const updatePromises = [];
    const errors = [];

    for (const [key, value] of Object.entries(settings)) {
        // Determine value type
        let valueType = 'string';
        let stringValue = value;

        if (typeof value === 'boolean') {
            valueType = 'boolean';
            stringValue = value ? 'true' : 'false';
        } else if (typeof value === 'number') {
            valueType = 'integer';
            stringValue = value.toString();
        } else if (typeof value === 'object') {
            valueType = 'json';
            stringValue = JSON.stringify(value);
        }

        // Check if setting exists
        const checkSql = 'SELECT id FROM system_settings WHERE setting_key = ?';
        const existing = await db.query(checkSql, [key]);

        if (existing.length > 0) {
            // Update existing setting
            const updateSql = `
                UPDATE system_settings 
                SET setting_value = ?, value_type = ?, updated_at = NOW()
                WHERE setting_key = ?
            `;
            updatePromises.push(
                db.query(updateSql, [stringValue, valueType, key])
                    .catch(err => {
                        errors.push({ key, error: err.message });
                    })
            );
        } else {
            // Insert new setting
            const insertSql = `
                INSERT INTO system_settings (setting_key, setting_value, value_type, description)
                VALUES (?, ?, ?, ?)
            `;
            updatePromises.push(
                db.query(insertSql, [key, stringValue, valueType, `${category} setting`])
                    .catch(err => {
                        errors.push({ key, error: err.message });
                    })
            );
        }
    }

    // Execute all updates
    await Promise.all(updatePromises);

    if (errors.length > 0) {
        return res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_FAILED',
                message: 'Some settings failed to update',
                details: errors
            }
        });
    }

    // Log activity
    const activitySql = `
        INSERT INTO activity_logs (lga_id, type, category, title, message, created_by)
        SELECT 
            1, 
            'settings_updated', 
            'settings',
            'System settings updated',
            CONCAT('Updated ', ?, ' settings'),
            ?
        FROM lgas LIMIT 1
    `;
    await db.query(activitySql, [category, req.user.id]).catch(() => {
        // Ignore activity log errors
    });

    // Fetch updated settings
    const updatedSettingsSql = `
        SELECT setting_key, setting_value, value_type
        FROM system_settings
        ORDER BY setting_key
    `;

    const allSettings = await db.query(updatedSettingsSql);

    // Group settings by category
    const groupedSettings = {
        general: {},
        notifications: {},
        security: {},
        features: {},
        pricing: {}
    };

    allSettings.forEach(setting => {
        const { setting_key, setting_value, value_type } = setting;

        // Parse value based on type
        let parsedValue;
        switch (value_type) {
            case 'integer':
                parsedValue = parseInt(setting_value);
                break;
            case 'boolean':
                parsedValue = setting_value === 'true' || setting_value === '1';
                break;
            case 'json':
                try {
                    parsedValue = JSON.parse(setting_value);
                } catch (e) {
                    parsedValue = setting_value;
                }
                break;
            default:
                parsedValue = setting_value;
        }

        // Categorize settings based on key prefix
        if (setting_key.includes('email') || setting_key.includes('sms') || setting_key.includes('notification')) {
            groupedSettings.notifications[setting_key] = parsedValue;
        } else if (setting_key.includes('password') || setting_key.includes('login') || setting_key.includes('session') || setting_key.includes('security') || setting_key.includes('two_factor')) {
            groupedSettings.security[setting_key] = parsedValue;
        } else if (setting_key.includes('maintenance') || setting_key.includes('enable') || setting_key.includes('auto') || setting_key.includes('public')) {
            groupedSettings.features[setting_key] = parsedValue;
        } else if (setting_key.includes('price') || setting_key.includes('currency')) {
            groupedSettings.pricing[setting_key] = parsedValue;
        } else {
            groupedSettings.general[setting_key] = parsedValue;
        }
    });

    res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: {
            general: groupedSettings.general,
            notifications: groupedSettings.notifications,
            security: groupedSettings.security,
            features: groupedSettings.features,
            pricing: groupedSettings.pricing,
            updated_at: new Date()
        }
    });
});

module.exports = {
    getSettings,
    updateSettings
};
