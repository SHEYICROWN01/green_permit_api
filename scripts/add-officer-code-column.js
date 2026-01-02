#!/usr/bin/env node
/**
 * Fix Missing officer_code Column
 * This script adds the officer_code column to the users table if it doesn't exist
 * Run with: node scripts/add-officer-code-column.js
 */

const db = require('../src/config/database');
const path = require('path');
const fs = require('fs').promises;

const addOfficerCodeColumn = async () => {
    console.log('🔧 Starting officer_code column migration...\n');

    try {
        // Step 1: Check if column exists
        console.log('📋 Step 1: Checking if officer_code column exists...');
        const columns = await db.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME = 'officer_code'
        `);

        // Handle both array and direct result formats
        const columnResults = Array.isArray(columns[0]) ? columns[0] : columns;

        if (columnResults && columnResults.length > 0) {
            console.log('✅ officer_code column already exists!');

            // Show current officers with codes
            const officers = await db.query(`
                SELECT id, name, username, officer_code, role, lga_id
                FROM users
                WHERE role = 'officer'
                LIMIT 5
            `);

            const officerResults = Array.isArray(officers[0]) ? officers[0] : officers;

            console.log('\n📊 Sample officers:');
            console.table(officerResults);

            console.log('\n✨ Migration completed - no changes needed!');
            process.exit(0);
        }

        console.log('⚠️  officer_code column does NOT exist. Adding it now...\n');

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
        console.log('\n📋 Step 3: Creating index on officer_code...');
        await db.query(`
            CREATE INDEX idx_officer_code ON users(officer_code)
        `);
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

        const updateInfo = Array.isArray(updateResult[0]) ? updateResult[0] : updateResult;
        const affectedRows = updateInfo.affectedRows || 0;

        console.log(`✅ Updated ${affectedRows} existing officers with officer codes!`);

        // Step 5: Verify
        console.log('\n📋 Step 5: Verifying the changes...');
        const verification = await db.query(`
            SELECT 
                COLUMN_NAME,
                COLUMN_TYPE,
                IS_NULLABLE,
                COLUMN_KEY,
                COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME = 'officer_code'
        `);

        const verifyResults = Array.isArray(verification[0]) ? verification[0] : verification;

        console.log('\n📊 Column details:');
        console.table(verifyResults);

        // Show updated officers
        const officers = await db.query(`
            SELECT id, name, username, officer_code, role, lga_id
            FROM users
            WHERE role = 'officer'
            LIMIT 5
        `);

        const officerResults = Array.isArray(officers[0]) ? officers[0] : officers;

        console.log('\n📊 Sample officers with codes:');
        console.table(officerResults);

        console.log('\n✨ Migration completed successfully!');
        console.log('\n🎯 Next steps:');
        console.log('   1. Restart your API server');
        console.log('   2. Test GET /api/v1/admin/officers endpoint');
        console.log('   3. Try creating a new officer from the LGA dashboard\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\n📝 Error details:', error);

        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('\n💡 The column already exists. This is fine!');
            process.exit(0);
        }

        console.log('\n🔧 Manual fix:');
        console.log('   Run this SQL manually in your database:');
        console.log(`
   ALTER TABLE users 
   ADD COLUMN officer_code VARCHAR(50) NULL UNIQUE 
   COMMENT 'Unique officer code (e.g., OFF-IFO-2025-0001)' 
   AFTER username;
   
   CREATE INDEX idx_officer_code ON users(officer_code);
        `);

        process.exit(1);
    }
};

// Run the migration
addOfficerCodeColumn();
