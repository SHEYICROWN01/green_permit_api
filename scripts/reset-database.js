/**
 * Database Reset Script
 * This script will completely empty all tables in the database
 * while preserving the table structures and schemas.
 * 
 * WARNING: This will delete ALL data. Use only for testing!
 */

const mysql = require('mysql2/promise');
const config = require('../src/config/env.config');

async function resetDatabase() {
    let connection;

    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name,
            multipleStatements: true
        });

        console.log('✅ Connected successfully\n');

        // Disable foreign key checks
        console.log('🔓 Disabling foreign key checks...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Get all tables in the database
        console.log('📋 Fetching table list...');
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ?
        `, [config.database.name]);

        console.log(`Found ${tables.length} tables to clear:\n`);

        // Truncate each table
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            try {
                console.log(`  🗑️  Truncating ${tableName}...`);
                await connection.query(`TRUNCATE TABLE \`${tableName}\``);
                console.log(`  ✅ ${tableName} cleared`);
            } catch (error) {
                console.error(`  ❌ Error truncating ${tableName}:`, error.message);
            }
        }

        // Re-enable foreign key checks
        console.log('\n🔒 Re-enabling foreign key checks...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // Re-insert default system settings
        console.log('\n⚙️  Re-inserting default system settings...');
        await connection.query(`
            INSERT INTO system_settings (setting_key, setting_value, value_type, description) VALUES
            ('system_name', 'Green Permit Hub', 'string', 'Name of the permit system'),
            ('default_sticker_validity_months', '6', 'integer', 'Default validity period for stickers in months'),
            ('allow_lga_price_override', 'true', 'boolean', 'Allow LGAs to override sticker prices'),
            ('require_customer_details', 'false', 'boolean', 'Require customer details during activation'),
            ('min_sticker_price', '1000', 'integer', 'Minimum sticker price in kobo (₦10.00)'),
            ('max_sticker_price', '10000', 'integer', 'Maximum sticker price in kobo (₦100.00)'),
            ('enable_email_notifications', 'true', 'boolean', 'Enable email notifications'),
            ('enable_sms_notifications', 'false', 'boolean', 'Enable SMS notifications'),
            ('currency_symbol', '₦', 'string', 'Currency symbol'),
            ('currency_code', 'NGN', 'string', 'ISO currency code'),
            ('timezone', 'Africa/Lagos', 'string', 'System timezone')
        `);
        console.log('✅ System settings restored\n');

        console.log('🎉 Database reset completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Tables cleared: ${tables.length}`);
        console.log('   - Schema preserved: ✅');
        console.log('   - System settings restored: ✅');
        console.log('   - Ready for fresh data: ✅\n');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the reset
if (require.main === module) {
    resetDatabase()
        .then(() => {
            console.log('\n✨ All done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = resetDatabase;
