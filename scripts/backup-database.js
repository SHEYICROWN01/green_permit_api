#!/usr/bin/env node

/**
 * Database Backup Script
 * Automated MySQL database backup for production
 */
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const execAsync = promisify(exec);
const logger = console;

// Configuration
const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../backups'),
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
};

/**
 * Create backup directory if not exists
 */
async function ensureBackupDir() {
    try {
        await fs.access(config.backupDir);
    } catch {
        await fs.mkdir(config.backupDir, { recursive: true });
        logger.info(`Created backup directory: ${config.backupDir}`);
    }
}

/**
 * Generate backup filename
 */
function getBackupFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    return `${config.database}_${timestamp}.sql`;
}

/**
 * Perform database backup using mysqldump
 */
async function backupDatabase() {
    try {
        logger.info('Starting database backup...');
        logger.info(`Database: ${config.database}@${config.host}`);

        await ensureBackupDir();

        const filename = getBackupFilename();
        const filepath = path.join(config.backupDir, filename);

        // Build mysqldump command
        const command = `mysqldump \
      --host=${config.host} \
      --port=${config.port} \
      --user=${config.user} \
      --password="${config.password}" \
      --single-transaction \
      --routines \
      --triggers \
      --events \
      --add-drop-table \
      --skip-comments \
      ${config.database} > "${filepath}"`;

        logger.info('Executing mysqldump...');
        await execAsync(command);

        // Get file size
        const stats = await fs.stat(filepath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        logger.info(`✓ Backup completed: ${filename}`);
        logger.info(`  Size: ${sizeMB} MB`);
        logger.info(`  Location: ${filepath}`);

        // Compress backup
        await compressBackup(filepath);

        return filepath;

    } catch (error) {
        logger.error('✗ Backup failed:', error.message);
        throw error;
    }
}

/**
 * Compress backup file using gzip
 */
async function compressBackup(filepath) {
    try {
        logger.info('Compressing backup...');

        const command = `gzip "${filepath}"`;
        await execAsync(command);

        const compressedPath = `${filepath}.gz`;
        const stats = await fs.stat(compressedPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        logger.info(`✓ Backup compressed: ${path.basename(compressedPath)}`);
        logger.info(`  Compressed size: ${sizeMB} MB`);

    } catch (error) {
        logger.warn('Compression failed (backup file retained):', error.message);
    }
}

/**
 * Clean up old backups based on retention policy
 */
async function cleanupOldBackups() {
    try {
        logger.info('Cleaning up old backups...');

        const files = await fs.readdir(config.backupDir);
        const backupFiles = files.filter(f => f.endsWith('.sql.gz') || f.endsWith('.sql'));

        const now = Date.now();
        const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;

        let deletedCount = 0;

        for (const file of backupFiles) {
            const filepath = path.join(config.backupDir, file);
            const stats = await fs.stat(filepath);
            const age = now - stats.mtimeMs;

            if (age > retentionMs) {
                await fs.unlink(filepath);
                deletedCount++;
                logger.info(`  Deleted old backup: ${file}`);
            }
        }

        if (deletedCount === 0) {
            logger.info('  No old backups to delete');
        } else {
            logger.info(`✓ Cleaned up ${deletedCount} old backup(s)`);
        }

    } catch (error) {
        logger.warn('Cleanup failed:', error.message);
    }
}

/**
 * List all backups
 */
async function listBackups() {
    try {
        const files = await fs.readdir(config.backupDir);
        const backupFiles = files.filter(f => f.endsWith('.sql.gz') || f.endsWith('.sql'));

        if (backupFiles.length === 0) {
            logger.info('No backups found');
            return;
        }

        logger.info(`\nBackups in ${config.backupDir}:\n`);

        for (const file of backupFiles.sort().reverse()) {
            const filepath = path.join(config.backupDir, file);
            const stats = await fs.stat(filepath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            const date = stats.mtime.toISOString().split('T')[0];

            logger.info(`  ${file}`);
            logger.info(`    Date: ${date}, Size: ${sizeMB} MB`);
        }

    } catch (error) {
        logger.error('Failed to list backups:', error.message);
    }
}

/**
 * Restore database from backup
 */
async function restoreDatabase(backupFile) {
    try {
        logger.warn('⚠️  WARNING: This will overwrite the current database!');

        const filepath = path.isAbsolute(backupFile)
            ? backupFile
            : path.join(config.backupDir, backupFile);

        // Check if file exists
        await fs.access(filepath);

        // Decompress if needed
        let sqlFile = filepath;
        if (filepath.endsWith('.gz')) {
            logger.info('Decompressing backup...');
            await execAsync(`gunzip -k "${filepath}"`);
            sqlFile = filepath.replace('.gz', '');
        }

        // Restore database
        logger.info(`Restoring from: ${path.basename(sqlFile)}`);

        const command = `mysql \
      --host=${config.host} \
      --port=${config.port} \
      --user=${config.user} \
      --password="${config.password}" \
      ${config.database} < "${sqlFile}"`;

        await execAsync(command);

        logger.info('✓ Database restored successfully');

        // Clean up decompressed file if it was compressed
        if (filepath.endsWith('.gz')) {
            await fs.unlink(sqlFile);
        }

    } catch (error) {
        logger.error('✗ Restore failed:', error.message);
        throw error;
    }
}

/**
 * Main execution
 */
async function main() {
    const command = process.argv[2];
    const arg = process.argv[3];

    try {
        switch (command) {
            case 'backup':
                await backupDatabase();
                await cleanupOldBackups();
                break;

            case 'list':
                await listBackups();
                break;

            case 'restore':
                if (!arg) {
                    logger.error('Please specify backup file to restore');
                    process.exit(1);
                }
                await restoreDatabase(arg);
                break;

            case 'cleanup':
                await cleanupOldBackups();
                break;

            default:
                logger.info(`
Database Backup Script
Usage:
  node backup-database.js backup           - Create a new backup
  node backup-database.js list             - List all backups
  node backup-database.js restore <file>   - Restore from backup
  node backup-database.js cleanup          - Clean up old backups
        `);
        }
    } catch (error) {
        logger.error('Operation failed:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = {
    backupDatabase,
    restoreDatabase,
    listBackups,
    cleanupOldBackups,
};
