const mysql = require('mysql2/promise');
const config = require('./env.config');
const logger = require('../utils/logger');

// Create MySQL connection pool
const pool = mysql.createPool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    connectionLimit: config.database.connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        logger.info('MySQL Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        logger.error('MySQL Database connection failed:', error.message);
        return false;
    }
};

// Execute query helper
const query = async (sql, params) => {
    try {
        const [results] = await pool.query(sql, params);
        return results;
    } catch (error) {
        logger.error('Database query error:', error);
        throw error;
    }
};

// Get connection from pool
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        logger.error('Error getting database connection:', error);
        throw error;
    }
};

// Close pool
const closePool = async () => {
    try {
        await pool.end();
        logger.info('MySQL connection pool closed');
    } catch (error) {
        logger.error('Error closing database pool:', error);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    getConnection,
    testConnection,
    closePool,
};
