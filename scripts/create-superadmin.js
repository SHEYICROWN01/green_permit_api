/**
 * Create Super Admin User Script
 * This script creates a fresh super admin account for production testing
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../src/config/env.config');

// Super Admin credentials (change these as needed)
const SUPERADMIN_CREDENTIALS = {
    name: 'Super Administrator',
    email: 'admin@greenpermit.com',
    username: 'superadmin',
    password: 'Admin@2025', // Change this to your desired password
    role: 'super_admin'
};

async function createSuperAdmin() {
    let connection;

    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name
        });

        console.log('✅ Connected successfully\n');

        // Hash the password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(SUPERADMIN_CREDENTIALS.password, 10);
        console.log('✅ Password hashed\n');

        // Check if super admin already exists
        console.log('🔍 Checking for existing super admin...');
        const [existing] = await connection.query(
            'SELECT id, email, username FROM users WHERE role = ? OR email = ? OR username = ?',
            ['super_admin', SUPERADMIN_CREDENTIALS.email, SUPERADMIN_CREDENTIALS.username]
        );

        if (existing.length > 0) {
            console.log('⚠️  Super admin or user with same credentials already exists:');
            existing.forEach(user => {
                console.log(`   - ID: ${user.id}, Email: ${user.email}, Username: ${user.username}`);
            });
            console.log('\n🗑️  Deleting existing super admin accounts...');
            await connection.query('DELETE FROM users WHERE role = ?', ['super_admin']);
            console.log('✅ Existing super admin accounts removed\n');
        }

        // Insert the new super admin
        console.log('➕ Creating new super admin account...');
        const [result] = await connection.query(
            `INSERT INTO users (name, email, username, password, role, phone, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                SUPERADMIN_CREDENTIALS.name,
                SUPERADMIN_CREDENTIALS.email,
                SUPERADMIN_CREDENTIALS.username,
                hashedPassword,
                SUPERADMIN_CREDENTIALS.role,
                null, // phone
                true  // is_active
            ]
        );

        console.log('✅ Super admin created successfully!\n');

        console.log('═══════════════════════════════════════════════════');
        console.log('🎉 SUPER ADMIN ACCOUNT CREATED');
        console.log('═══════════════════════════════════════════════════');
        console.log('');
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('───────────────────────────────────────────────────');
        console.log(`   Name:     ${SUPERADMIN_CREDENTIALS.name}`);
        console.log(`   Email:    ${SUPERADMIN_CREDENTIALS.email}`);
        console.log(`   Username: ${SUPERADMIN_CREDENTIALS.username}`);
        console.log(`   Password: ${SUPERADMIN_CREDENTIALS.password}`);
        console.log(`   Role:     ${SUPERADMIN_CREDENTIALS.role}`);
        console.log(`   User ID:  ${result.insertId}`);
        console.log('───────────────────────────────────────────────────');
        console.log('');
        console.log('⚠️  IMPORTANT: Save these credentials securely!');
        console.log('💡 You can login using either email or username');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error creating super admin:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the script
if (require.main === module) {
    createSuperAdmin()
        .then(() => {
            console.log('\n✨ All done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = createSuperAdmin;
