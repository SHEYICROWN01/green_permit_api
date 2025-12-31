/**
 * Complete Database Reset and Super Admin Setup Script
 * 
 * This script will:
 * 1. Clear all data from the database
 * 2. Create a fresh super admin account
 * 
 * WARNING: This will delete ALL existing data!
 */

const resetDatabase = require('./reset-database');
const createSuperAdmin = require('./create-superadmin');

async function setupFreshDatabase() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║   DATABASE RESET & SUPER ADMIN SETUP             ║');
    console.log('║   FOR PRODUCTION TESTING                          ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    try {
        // Step 1: Reset database
        console.log('📌 STEP 1: Resetting Database');
        console.log('─────────────────────────────────────────────────\n');
        await resetDatabase();

        console.log('\n');

        // Step 2: Create super admin
        console.log('📌 STEP 2: Creating Super Admin Account');
        console.log('─────────────────────────────────────────────────\n');
        await createSuperAdmin();

        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║   ✅ SETUP COMPLETE - READY FOR TESTING          ║');
        console.log('╚═══════════════════════════════════════════════════╝\n');
        console.log('🚀 Your database is now clean and ready for production testing!');
        console.log('📝 Use the super admin credentials above to login and start testing.\n');

    } catch (error) {
        console.error('\n╔═══════════════════════════════════════════════════╗');
        console.error('║   ❌ SETUP FAILED                                 ║');
        console.error('╚═══════════════════════════════════════════════════╝\n');
        console.error('Error:', error.message);
        throw error;
    }
}

// Run the setup
if (require.main === module) {
    setupFreshDatabase()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Fatal error during setup');
            process.exit(1);
        });
}

module.exports = setupFreshDatabase;
