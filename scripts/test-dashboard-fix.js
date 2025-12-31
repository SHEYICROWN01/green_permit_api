/**
 * Test script for LGA Admin Dashboard 403 Fix
 * 
 * This script tests the role-aware dashboard endpoint to ensure:
 * 1. Super admins can access and see system-wide data
 * 2. LGA admins can access and see their LGA-specific data
 * 3. Both receive proper responses without 403 errors
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDashboardEndpoint() {
    log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
    log('║  LGA ADMIN DASHBOARD 403 FIX - TEST SCRIPT               ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

    let superAdminToken = null;
    let lgaAdminToken = null;

    try {
        // ============================================================
        // TEST 1: Login as Super Admin
        // ============================================================
        log('📌 TEST 1: Super Admin Login', 'blue');
        log('─'.repeat(60));

        try {
            const superAdminLogin = await axios.post(`${BASE_URL}/auth/super-admin/login`, {
                login: 'admin@greenpermit.com',
                password: 'Admin@2025'
            });

            if (superAdminLogin.data.success) {
                superAdminToken = superAdminLogin.data.data.token;
                log('✅ Super Admin login successful', 'green');
                log(`   Token: ${superAdminToken.substring(0, 30)}...`, 'cyan');
            } else {
                log('❌ Super Admin login failed', 'red');
                return;
            }
        } catch (error) {
            log(`❌ Super Admin login error: ${error.message}`, 'red');
            log('⚠️  Note: Super admin must exist in database', 'yellow');
        }

        // ============================================================
        // TEST 2: Login as LGA Admin (if exists)
        // ============================================================
        log('\n📌 TEST 2: LGA Admin Login', 'blue');
        log('─'.repeat(60));

        try {
            const lgaAdminLogin = await axios.post(`${BASE_URL}/admin/auth/login`, {
                email: 'admin@ifolga.com', // Update this with actual LGA admin email
                password: 'password123'     // Update this with actual password
            });

            if (lgaAdminLogin.data.success) {
                lgaAdminToken = lgaAdminLogin.data.data.token;
                log('✅ LGA Admin login successful', 'green');
                log(`   Token: ${lgaAdminToken.substring(0, 30)}...`, 'cyan');
                log(`   LGA: ${lgaAdminLogin.data.data.user.lga_name}`, 'cyan');
            } else {
                log('⚠️  LGA Admin login failed (may not exist yet)', 'yellow');
            }
        } catch (error) {
            log(`⚠️  LGA Admin login error: ${error.response?.data?.message || error.message}`, 'yellow');
            log('   This is expected if no LGA admin exists yet', 'yellow');
        }

        // ============================================================
        // TEST 3: Super Admin Dashboard Access
        // ============================================================
        if (superAdminToken) {
            log('\n📌 TEST 3: Super Admin Dashboard Access', 'blue');
            log('─'.repeat(60));

            try {
                const dashboardResponse = await axios.get(
                    `${BASE_URL}/admin/dashboard/overview`,
                    {
                        headers: {
                            'Authorization': `Bearer ${superAdminToken}`
                        }
                    }
                );

                if (dashboardResponse.data.success) {
                    log('✅ Super Admin can access dashboard', 'green');
                    log(`   Status: ${dashboardResponse.status}`, 'cyan');
                    log(`   Message: ${dashboardResponse.data.message}`, 'cyan');

                    const data = dashboardResponse.data.data;
                    log('\n   Dashboard Data:', 'cyan');
                    log(`   - Scope: ${data.lga_info.scope || 'system_wide'}`, 'cyan');
                    log(`   - LGA Name: ${data.lga_info.lga_name}`, 'cyan');
                    log(`   - Current Month Revenue: ₦${data.kpis.revenue.current_month.toLocaleString()}`, 'cyan');
                    log(`   - Active Stickers: ${data.kpis.active_stickers.total}`, 'cyan');
                    log(`   - Total Officers: ${data.kpis.personnel.total_officers}`, 'cyan');
                    log(`   - Total Supervisors: ${data.kpis.personnel.total_supervisors}`, 'cyan');
                } else {
                    log('❌ Super Admin dashboard access failed', 'red');
                }
            } catch (error) {
                log(`❌ Super Admin dashboard error: ${error.response?.status} ${error.response?.statusText}`, 'red');
                log(`   Message: ${error.response?.data?.message}`, 'red');
                log(`   Expected: 200 OK`, 'yellow');
                log(`   This indicates the 403 issue still exists for Super Admin`, 'yellow');
            }
        }

        // ============================================================
        // TEST 4: LGA Admin Dashboard Access
        // ============================================================
        if (lgaAdminToken) {
            log('\n📌 TEST 4: LGA Admin Dashboard Access', 'blue');
            log('─'.repeat(60));

            try {
                const dashboardResponse = await axios.get(
                    `${BASE_URL}/admin/dashboard/overview`,
                    {
                        headers: {
                            'Authorization': `Bearer ${lgaAdminToken}`
                        }
                    }
                );

                if (dashboardResponse.data.success) {
                    log('✅ LGA Admin can access dashboard', 'green');
                    log(`   Status: ${dashboardResponse.status}`, 'cyan');
                    log(`   Message: ${dashboardResponse.data.message}`, 'cyan');

                    const data = dashboardResponse.data.data;
                    log('\n   Dashboard Data:', 'cyan');
                    log(`   - LGA ID: ${data.lga_info.lga_id}`, 'cyan');
                    log(`   - LGA Name: ${data.lga_info.lga_name}`, 'cyan');
                    log(`   - State: ${data.lga_info.state}`, 'cyan');
                    log(`   - Current Month Revenue: ₦${data.kpis.revenue.current_month.toLocaleString()}`, 'cyan');
                    log(`   - Active Stickers: ${data.kpis.active_stickers.total}`, 'cyan');
                    log(`   - Total Officers: ${data.kpis.personnel.total_officers}`, 'cyan');
                } else {
                    log('❌ LGA Admin dashboard access failed', 'red');
                }
            } catch (error) {
                log(`❌ LGA Admin dashboard error: ${error.response?.status} ${error.response?.statusText}`, 'red');
                log(`   Message: ${error.response?.data?.message}`, 'red');
                log(`   Expected: 200 OK`, 'yellow');
                log(`   🔴 THIS IS THE CRITICAL BUG - 403 Forbidden for LGA Admin`, 'red');
            }
        }

        // ============================================================
        // TEST 5: Unauthorized Access (No Token)
        // ============================================================
        log('\n📌 TEST 5: Unauthorized Access (No Token)', 'blue');
        log('─'.repeat(60));

        try {
            await axios.get(`${BASE_URL}/admin/dashboard/overview`);
            log('❌ Endpoint should require authentication!', 'red');
        } catch (error) {
            if (error.response?.status === 401) {
                log('✅ Correctly rejects unauthorized access (401)', 'green');
            } else {
                log(`⚠️  Unexpected response: ${error.response?.status}`, 'yellow');
            }
        }

        // ============================================================
        // SUMMARY
        // ============================================================
        log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
        log('║  TEST SUMMARY                                             ║', 'cyan');
        log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

        log('Expected Results:', 'blue');
        log('  1. ✅ Super Admin: 200 OK with system-wide data', 'cyan');
        log('  2. ✅ LGA Admin: 200 OK with LGA-specific data', 'cyan');
        log('  3. ✅ No Token: 401 Unauthorized', 'cyan');
        log('  4. ❌ Officer/Supervisor: 403 Forbidden', 'cyan');

        log('\nIf LGA Admin still gets 403:', 'yellow');
        log('  1. Check JWT token role value', 'yellow');
        log('  2. Verify authorize middleware accepts "lga_admin"', 'yellow');
        log('  3. Check route middleware order', 'yellow');
        log('  4. Verify controller role check logic', 'yellow');

    } catch (error) {
        log(`\n❌ Test failed: ${error.message}`, 'red');
    }

    log('\n✨ Test completed\n');
}

// Run tests
if (require.main === module) {
    testDashboardEndpoint()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = testDashboardEndpoint;
