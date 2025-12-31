#!/usr/bin/env node

/**
 * Database Migration Script
 * Handles database schema migrations for production deployments
 */
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const logger = console;

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
};

/**
 * Create migrations table if not exists
 */
async function createMigrationsTable(connection) {
    const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

    await connection.execute(sql);
    logger.info('✓ Migrations table ready');
}

/**
 * Get executed migrations
 */
async function getExecutedMigrations(connection) {
    const [rows] = await connection.execute('SELECT name FROM migrations ORDER BY id');
    return rows.map(row => row.name);
}

/**
 * Record migration as executed
 */
async function recordMigration(connection, name) {
    await connection.execute('INSERT INTO migrations (name) VALUES (?)', [name]);
}

/**
 * Get pending migrations from filesystem
 */
async function getPendingMigrations(executedMigrations) {
    const migrationsDir = path.join(__dirname, '../database/migrations');

    try {
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

        return sqlFiles.filter(file => !executedMigrations.includes(file));
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.warn('Migrations directory not found, creating it...');
            await fs.mkdir(migrationsDir, { recursive: true });
            return [];
        }
        throw error;
    }
}

/**
 * Execute a migration file
 */
async function executeMigration(connection, filename) {
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const filePath = path.join(migrationsDir, filename);

    logger.info(`Executing migration: ${filename}`);

    const sql = await fs.readFile(filePath, 'utf8');
    await connection.query(sql);
    await recordMigration(connection, filename);

    logger.info(`✓ Migration completed: ${filename}`);
}

/**
 * Main migration function
 */
async function migrate() {
    let connection;

    try {
        logger.info('Starting database migration...');
        logger.info(`Database: ${dbConfig.database}@${dbConfig.host}`);

        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        logger.info('✓ Connected to database');

        // Create migrations table
        await createMigrationsTable(connection);

        // Get executed migrations
        const executedMigrations = await getExecutedMigrations(connection);
        logger.info(`Executed migrations: ${executedMigrations.length}`);

        // Get pending migrations
        const pendingMigrations = await getPendingMigrations(executedMigrations);

        if (pendingMigrations.length === 0) {
            logger.info('✓ No pending migrations');
            return;
        }

        logger.info(`Pending migrations: ${pendingMigrations.length}`);

        // Execute pending migrations
        for (const migration of pendingMigrations) {
            await executeMigration(connection, migration);
        }

        logger.info('✓ All migrations completed successfully');

    } catch (error) {
        logger.error('✗ Migration failed:', error.message);
        logger.error(error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            logger.info('Database connection closed');
        }
    }
}

/**
 * Rollback last migration (optional feature)
 */
async function rollback() {
    let connection;

    try {
        logger.info('Starting rollback...');

        connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(
            'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
        );

        if (rows.length === 0) {
            logger.warn('No migrations to rollback');
            return;
        }

        const lastMigration = rows[0].name;
        logger.info(`Rolling back: ${lastMigration}`);

        // Look for rollback file
        const rollbackFile = lastMigration.replace('.sql', '.rollback.sql');
        const rollbackPath = path.join(__dirname, '../database/migrations', rollbackFile);

        try {
            const sql = await fs.readFile(rollbackPath, 'utf8');
            await connection.query(sql);
            await connection.execute('DELETE FROM migrations WHERE name = ?', [lastMigration]);
            logger.info('✓ Rollback completed');
        } catch (error) {
            logger.error(`Rollback file not found: ${rollbackFile}`);
            throw error;
        }

    } catch (error) {
        logger.error('✗ Rollback failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// CLI execution
if (require.main === module) {
    const command = process.argv[2];

    if (command === 'rollback') {
        rollback();
    } else {
        migrate();
    }
}

module.exports = { migrate, rollback };
