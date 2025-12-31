require('dotenv').config();

module.exports = {
    node_env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    api: {
        prefix: process.env.API_PREFIX || '/api/v1',
    },
    cors: {
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
            : '*',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    log: {
        level: process.env.LOG_LEVEL || 'info',
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        name: process.env.DB_NAME || 'green_permit_db',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
        expire: process.env.JWT_EXPIRE || '24h',
    },
};
