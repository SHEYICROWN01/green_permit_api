#!/usr/bin/env node
/**
 * Simple Script to Add officer_code Column
 * This version handles different MySQL driver return formats
 */

const db = require('../src/config/database');

const addOfficerCodeColumn = async () => {
    console.log('🔧 Starting officer_code column migration...\n');

    try {
        // Step 1: Check if column exists using SHOW COLUMNS
        console.log('📋 Step 1: Checking if officer_code column exists...');
        const columns = await db.query(`SHOW COLUMNS FROM users WHERE Field = 'officer_code'`);

        // Handle different return formats (array or direct result)
        const result = Array.isArray(columns) ? columns : [columns];
        const columnExists = result.length > 0 && result[0].length > 0;

        if (columnExists) {
            console.log('✅ officer_code column already exists!\n');

            // Show sample officers
            const officers = await db.query(`
                SELECT id, name, username, officer_code, role 
                FROM users 
                WHERE role = 'officer' 
                LIMIT 3
            `);

            const officerList = Array.isArray(officers[0]) ? officers[0] : officers;
            console.log('📊 Sample officers:');
            console.table(officerList);

            console.log('\n✨ Column exists - no changes needed!');
            console.log('💡 If you still see errors, restart your application:\n');
            console.log('   pm2 restart all');
            console.log('   # OR');
            console.log('   pm2 restart <your-app-name>\n');
            process.exit(0);
        }

        console.log('⚠️  Column does not exist. Adding it now...\n');

        // Step 2: Add the column
        console.log('📋 Step 2: Adding officer_code column...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN officer_code VARCHAR(50) NULL UNIQUE 
            COMMENT 'Unique officer code (e.g., OFF-IFO-2025-0001)' 
            AFTER username
        `);
        console.log('✅ Column added successfully!');

        // Step 3: Create index
        console.log('\n📋 Step 3: Creating index...');
        await db.query(`CREATE INDEX idx_officer_code ON users(officer_code)`);
        console.log('✅ Index created successfully!');

        // Step 4: Update existing officers
        console.log('\n📋 Step 4: Generating codes for existing officers...');
        const updateResult = await db.query(`
            UPDATE users u
            INNER JOIN lgas l ON u.lga_id = l.id
            SET u.officer_code = CONCAT('OFF-', l.code, '-', YEAR(COALESCE(u.created_at, NOW())), '-', LPAD(u.id, 4, '0'))
            WHERE u.role = 'officer' 
            AND u.officer_code IS NULL
        `);

        // Get affected rows
        const affectedRows = updateResult.affectedRows || updateResult[0]?.affectedRows || 0;
        console.log(`✅ Updated ${affectedRows} existing officers!`);

        // Step 5: Verify
        console.log('\n📋 Step 5: Verifying the changes...');
        const officers = await db.query(`
            SELECT id, name, username, officer_code, role 
            FROM users 
            WHERE role = 'officer' 
            LIMIT 3
        `);

        const officerList = Array.isArray(officers[0]) ? officers[0] : officers;
        console.log('\n📊 Sample officers with codes:');
        console.table(officerList);

        console.log('\n✨ Migration completed successfully!');
        console.log('\n🎯 Next steps:');
        console.log('   1. Restart your application:');
        console.log('      pm2 list                    # See all processes');
        console.log('      pm2 restart all             # Restart all');
        console.log('      # OR restart specific app:');
        console.log('      pm2 restart <app-name>');
        console.log('');
        console.log('   2. Test the API endpoint:');
        console.log('      curl https://gtech.gifamz.com/api/v1/admin/officers');
        console.log('');
        console.log('   3. Check application logs:');
        console.log('      pm2 logs --lines 20\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);

        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('\n💡 The column already exists! Just restart your application:');
            console.log('   pm2 restart all\n');
            process.exit(0);
        }

        if (error.code === 'ER_DUP_KEYNAME') {
            console.log('\n💡 The index already exists! This is fine.');
            process.exit(0);
        }

        console.error('\n📝 Full error:', error);
        console.log('\n🔧 Manual SQL fix:');
        console.log('   1. Login to cPanel');
        console.log('   2. Open phpMyAdmin');
        console.log('   3. Run this SQL:');
        console.log('');
        console.log('   ALTER TABLE users ADD COLUMN officer_code VARCHAR(50) NULL UNIQUE AFTER username;');
        console.log('   CREATE INDEX idx_officer_code ON users(officer_code);');
        console.log('   UPDATE users u INNER JOIN lgas l ON u.lga_id = l.id SET u.officer_code = CONCAT("OFF-", l.code, "-", YEAR(NOW()), "-", LPAD(u.id, 4, "0")) WHERE u.role = "officer" AND u.officer_code IS NULL;');
        console.log('');

        process.exit(1);
    } finally {
        // Close database connection
        if (db && db.end) {
            await db.end();
        }
    }
};

// Run the migration
addOfficerCodeColumn();
