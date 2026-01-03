#!/usr/bin/env node
/**
 * Make Email Column Nullable for Officers
 * Officers may not have email addresses
 */

const db = require('../src/config/database');

const makeEmailNullable = async () => {
    console.log('🔧 Making email column nullable...\n');

    try {
        // Check current email column definition
        console.log('📋 Step 1: Checking current email column...');
        const columns = await db.query(`SHOW COLUMNS FROM users WHERE Field = 'email'`);

        const result = Array.isArray(columns) ? columns : [columns];
        const emailColumn = result.length > 0 ? result[0] : null;

        if (!emailColumn) {
            console.log('❌ Email column not found!');
            process.exit(1);
        }

        console.log('Current email column definition:');
        console.table(emailColumn);

        if (emailColumn.Null === 'YES' || emailColumn[0]?.Null === 'YES') {
            console.log('\n✅ Email column is already nullable!');
            console.log('No changes needed.');
            process.exit(0);
        }

        console.log('\n⚠️  Email column is currently NOT NULL');
        console.log('📋 Step 2: Making email nullable...');

        // Make email nullable
        await db.query(`
            ALTER TABLE users 
            MODIFY COLUMN email VARCHAR(255) UNIQUE NULL
        `);

        console.log('✅ Email column is now nullable!');

        // Verify the change
        console.log('\n📋 Step 3: Verifying changes...');
        const verifyColumns = await db.query(`SHOW COLUMNS FROM users WHERE Field = 'email'`);
        const verifyResult = Array.isArray(verifyColumns) ? verifyColumns : [verifyColumns];

        console.log('\nUpdated email column definition:');
        console.table(verifyResult[0] || verifyResult);

        console.log('\n✨ Migration completed successfully!');
        console.log('\n🎯 Officers can now be created with or without email addresses.');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            console.log('\n💡 There are duplicate email addresses in the database.');
            console.log('   You need to clean those up before making the column nullable.');
            console.log('\n   Run this to find duplicates:');
            console.log('   SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;');
        }

        console.error('\n📝 Full error:', error);
        console.log('\n🔧 Manual fix:');
        console.log('   ALTER TABLE users MODIFY COLUMN email VARCHAR(255) UNIQUE NULL;');

        process.exit(1);
    } finally {
        if (db && db.end) {
            await db.end();
        }
    }
};

// Run the migration
makeEmailNullable();
