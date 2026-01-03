// Add missing login security columns to users table
const db = require('../src/config/database');

async function addLoginSecurityColumns() {
    console.log('🔧 Adding missing login security columns to users table...\n');

    try {
        // Add failed_login_attempts column
        console.log('Adding failed_login_attempts column...');
        try {
            await db.query('ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0');
            console.log('✅ failed_login_attempts column added');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  failed_login_attempts column already exists');
            } else {
                throw error;
            }
        }

        // Add locked_until column
        console.log('Adding locked_until column...');
        try {
            await db.query('ALTER TABLE users ADD COLUMN locked_until DATETIME NULL');
            console.log('✅ locked_until column added');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  locked_until column already exists');
            } else {
                throw error;
            }
        }

        // Add last_login_at column
        console.log('Adding last_login_at column...');
        try {
            await db.query('ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL');
            console.log('✅ last_login_at column added');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  last_login_at column already exists');
            } else {
                throw error;
            }
        }

        // Add pin_hash column
        console.log('Adding pin_hash column...');
        try {
            await db.query('ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255) NULL');
            console.log('✅ pin_hash column added');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  pin_hash column already exists');
            } else {
                throw error;
            }
        }

        // Verify columns were added
        console.log('\n📋 Verifying columns...');
        const columns = await db.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME IN ('failed_login_attempts', 'locked_until', 'last_login_at', 'pin_hash')
            ORDER BY COLUMN_NAME
        `);

        console.log('\n✅ Columns in users table:');
        console.table(columns);

        console.log('\n🎉 Migration completed successfully!');
        console.log('\nYou can now test officer login:');
        console.log('  pm2 restart green-permit-api');
        console.log('  curl http://localhost:3000/api/v1/officer/auth/login -H "Content-Type: application/json" -d \'{"username":"bola","password":"Admin@123"}\'');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding columns:', error.message);
        console.error(error);
        process.exit(1);
    }
}

addLoginSecurityColumns();
