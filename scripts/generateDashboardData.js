/**
 * Generate realistic dashboard data for Green Permit API
 * 
 * This script will:
 * 1. Generate 5,000 stickers across all LGAs
 * 2. Generate 3,000 activations over last 12 months
 * 3. Ensure proper relationships
 * 4. Create realistic revenue distribution
 * 
 * Usage: node scripts/generateDashboardData.js
 */

const mysql = require('mysql2/promise');

// Configuration
const STICKERS_TO_GENERATE = 5000;
const ACTIVATIONS_TO_GENERATE = 3000;
const MONTHS_OF_DATA = 12;

// Database configuration
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'Adeshile15.Com',
    database: 'green_permit_db'
};

// LGA Distribution (weighted for realistic distribution)
const LGA_DISTRIBUTION = {
    1: { name: 'Ifo LGA', code: 'IFO', weight: 0.25, price: 3500 },
    2: { name: 'Abeokuta South', code: 'ABS', weight: 0.20, price: 3400 },
    3: { name: 'Ado-Odo/Ota', code: 'ADO', weight: 0.30, price: 3600 },
    4: { name: 'Sagamu', code: 'SAG', weight: 0.15, price: 3300 },
    5: { name: 'Ikenne', code: 'IKE', weight: 0.10, price: 3200 }
};

// Status distribution for stickers
const STATUS_DISTRIBUTION = {
    unused: 0.30,    // 30% unused
    active: 0.55,    // 55% active
    expired: 0.10,   // 10% expired
    revoked: 0.05    // 5% revoked
};

// Sample customer names (Nigerian names)
const CUSTOMER_NAMES = [
    'Adebayo Ogunleye', 'Chioma Nwosu', 'Emeka Okafor', 'Folake Adeyemi',
    'Ibrahim Musa', 'Blessing Okeke', 'Kunle Adeyinka', 'Ngozi Eze',
    'Tunde Balogun', 'Aisha Mohammed', 'Chinedu Okoli', 'Funmi Adeleke',
    'Yusuf Abubakar', 'Nneka Okonkwo', 'Segun Ajayi', 'Amina Hassan',
    'Olufemi Williams', 'Zainab Ibrahim', 'Ikechukwu Nnamdi', 'Fatima Abdullahi'
];

// Sample locations in Ogun State
const LOCATIONS = [
    'Ifo', 'Abeokuta', 'Ota', 'Sagamu', 'Ikenne',
    'Mowe', 'Ibafo', 'Ewekoro', 'Obafemi Owode', 'Remo North'
];

/**
 * Helper: Get weighted random item from distribution
 */
function weightedRandom(distribution) {
    const random = Math.random();
    let cumulative = 0;
    for (const [id, data] of Object.entries(distribution)) {
        cumulative += data.weight;
        if (random < cumulative) return parseInt(id);
    }
    return 1; // Default to first LGA
}

/**
 * Helper: Get random status based on distribution
 */
function weightedRandomStatus() {
    const random = Math.random();
    let cumulative = 0;
    for (const [status, weight] of Object.entries(STATUS_DISTRIBUTION)) {
        cumulative += weight;
        if (random < cumulative) return status;
    }
    return 'unused';
}

/**
 * Helper: Generate random date in the past N days
 */
function randomDateInPast(days) {
    const now = new Date();
    const past = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

/**
 * Helper: Generate random date between two dates
 */
function randomDateBetween(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Helper: Generate weighted random date (more recent dates are more likely)
 */
function weightedRandomDate(months) {
    const now = new Date();
    const monthsAgo = new Date(now.getTime() - (months * 30 * 24 * 60 * 60 * 1000));

    // Exponential distribution favoring recent dates
    const random = Math.pow(Math.random(), 2); // Square for exponential curve
    return new Date(monthsAgo.getTime() + random * (now.getTime() - monthsAgo.getTime()));
}

/**
 * Helper: Get random item from array
 */
function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper: Generate Nigerian phone number
 */
function generatePhoneNumber() {
    const prefixes = ['0803', '0806', '0809', '0810', '0813', '0816', '0905', '0907'];
    const prefix = randomItem(prefixes);
    const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `+234${prefix.substring(1)}${suffix}`;
}

/**
 * Helper: Generate plate number
 */
function generatePlateNumber(lgaCode) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter1 = letters[Math.floor(Math.random() * letters.length)];
    const letter2 = letters[Math.floor(Math.random() * letters.length)];
    const letter3 = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${lgaCode} ${numbers} ${letter1}${letter2}${letter3}`;
}

/**
 * Helper: Format date for MySQL
 */
function formatMySQLDate(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Helper: Batch insert with progress
 */
async function batchInsert(connection, table, data, batchSize = 500) {
    if (data.length === 0) return;

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const columns = Object.keys(batch[0]);
        const placeholders = batch.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
        const values = batch.flatMap(item => columns.map(col => item[col]));

        await connection.query(
            `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`,
            values
        );

        const progress = Math.min(i + batchSize, data.length);
        process.stdout.write(`\r   Progress: ${progress}/${data.length} (${Math.round(progress / data.length * 100)}%)`);
    }
    console.log(''); // New line after progress
}

/**
 * Main data generation function
 */
async function generateData() {
    let connection;

    try {
        connection = await mysql.createConnection(DB_CONFIG);

        console.log('\n🚀 Green Permit Dashboard Data Generator');
        console.log('='.repeat(50));
        console.log(`\n📊 Configuration:`);
        console.log(`   - Stickers to generate: ${STICKERS_TO_GENERATE.toLocaleString()}`);
        console.log(`   - Activations to generate: ${ACTIVATIONS_TO_GENERATE.toLocaleString()}`);
        console.log(`   - Months of data: ${MONTHS_OF_DATA}`);
        console.log('\n' + '='.repeat(50) + '\n');

        // Step 1: Get existing batches
        console.log('📦 Step 1: Loading sticker batches...');
        const [batches] = await connection.query(
            'SELECT id, lga_id, batch_code FROM sticker_batches ORDER BY lga_id'
        );
        console.log(`   ✅ Found ${batches.length} batches\n`);

        // Step 2: Get officers and supervisors
        console.log('👥 Step 2: Loading personnel...');
        const [officers] = await connection.query(
            'SELECT id, lga_id, name FROM users WHERE role = "officer" AND is_active = 1'
        );
        const [supervisors] = await connection.query(
            'SELECT id, lga_id, name FROM users WHERE role = "supervisor" AND is_active = 1'
        );
        console.log(`   ✅ Found ${officers.length} officers`);
        console.log(`   ✅ Found ${supervisors.length} supervisors\n`);

        if (officers.length === 0 || supervisors.length === 0) {
            console.log('   ⚠️  Warning: No officers or supervisors found!');
            console.log('   📝 Activations will use NULL for activated_by/supervisor_id\n');
        }

        // Step 3: Generate stickers
        console.log(`📄 Step 3: Generating ${STICKERS_TO_GENERATE.toLocaleString()} stickers...`);

        const stickers = [];
        let stickerCounter = {};

        for (let i = 0; i < STICKERS_TO_GENERATE; i++) {
            // Pick random LGA based on distribution
            const lgaId = weightedRandom(LGA_DISTRIBUTION);
            const lga = LGA_DISTRIBUTION[lgaId];

            // Initialize counter for this LGA
            if (!stickerCounter[lgaId]) stickerCounter[lgaId] = 1;

            // Find batch for this LGA
            const batch = batches.find(b => b.lga_id === lgaId);
            if (!batch) {
                console.log(`\n   ⚠️  Warning: No batch found for LGA ${lgaId}, skipping...`);
                continue;
            }

            // Generate unique sticker code
            const code = `${lga.code}-CP-${String(stickerCounter[lgaId]).padStart(6, '0')}`;
            stickerCounter[lgaId]++;

            // Determine status
            const status = weightedRandomStatus();

            // Calculate dates based on status
            const createdDate = randomDateInPast(365); // Last year
            const activatedDate = (status === 'active' || status === 'expired')
                ? randomDateBetween(createdDate, new Date())
                : null;
            const expiresDate = activatedDate
                ? new Date(activatedDate.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 year from activation
                : null;

            stickers.push({
                code,
                batch_id: batch.id,
                lga_id: lgaId,
                status,
                price: lga.price,
                created_at: formatMySQLDate(createdDate),
                activated_at: activatedDate ? formatMySQLDate(activatedDate) : null,
                expires_at: expiresDate ? formatMySQLDate(expiresDate) : null
            });
        }

        // Batch insert stickers
        await batchInsert(connection, 'stickers', stickers, 500);
        console.log(`   ✅ Generated ${stickers.length.toLocaleString()} stickers\n`);

        // Step 4: Get inserted stickers that can be activated
        console.log('🔍 Step 4: Finding stickers for activation...');
        const [availableStickers] = await connection.query(
            'SELECT id, code, lga_id, price FROM stickers WHERE status IN ("active", "unused") ORDER BY RAND() LIMIT ?',
            [ACTIVATIONS_TO_GENERATE]
        );
        console.log(`   ✅ Found ${availableStickers.length} available stickers\n`);

        // Step 5: Generate activations
        const actualActivations = Math.min(ACTIVATIONS_TO_GENERATE, availableStickers.length);
        console.log(`🎫 Step 5: Generating ${actualActivations.toLocaleString()} activations...`);

        const activations = [];

        for (let i = 0; i < actualActivations; i++) {
            const sticker = availableStickers[i];

            // Find officer and supervisor for this LGA (or use any if none found)
            const lgaOfficers = officers.filter(o => o.lga_id === sticker.lga_id);
            const lgaSupervisors = supervisors.filter(s => s.lga_id === sticker.lga_id);

            const officer = lgaOfficers.length > 0 ? randomItem(lgaOfficers) : (officers.length > 0 ? randomItem(officers) : null);
            const supervisor = lgaSupervisors.length > 0 ? randomItem(lgaSupervisors) : (supervisors.length > 0 ? randomItem(supervisors) : null);

            // Generate activation date (weighted towards recent)
            const activationDate = weightedRandomDate(MONTHS_OF_DATA);
            const expiryDate = new Date(activationDate.getTime() + (365 * 24 * 60 * 60 * 1000));

            const lgaCode = LGA_DISTRIBUTION[sticker.lga_id].code;

            activations.push({
                sticker_id: sticker.id,
                activated_by: officer ? officer.id : null,
                supervisor_id: supervisor ? supervisor.id : null,
                lga_id: sticker.lga_id,
                activation_date: formatMySQLDate(activationDate),
                expiry_date: formatMySQLDate(expiryDate),
                amount_paid: sticker.price,
                customer_name: randomItem(CUSTOMER_NAMES),
                customer_phone: generatePhoneNumber(),
                location: randomItem(LOCATIONS)
            });
        }

        // Batch insert activations
        await batchInsert(connection, 'activations', activations, 500);
        console.log(`   ✅ Generated ${activations.length.toLocaleString()} activations\n`);

        // Step 6: Update sticker statuses for activated stickers
        console.log('🔄 Step 6: Updating sticker statuses...');
        for (const activation of activations) {
            await connection.query(
                'UPDATE stickers SET status = "active", activated_at = ? WHERE id = ?',
                [activation.activation_date, activation.sticker_id]
            );
        }
        console.log(`   ✅ Updated ${activations.length.toLocaleString()} sticker statuses\n`);

        // Step 7: Update batch used counts
        console.log('📊 Step 7: Updating batch statistics...');
        await connection.query(`
      UPDATE sticker_batches sb
      SET used_count = (
        SELECT COUNT(*) FROM stickers s 
        WHERE s.batch_id = sb.id AND s.status = 'active'
      )
    `);
        console.log(`   ✅ Updated batch used counts\n`);

        // Calculate summary statistics
        console.log('='.repeat(50));
        console.log('\n🎉 Data generation complete!\n');
        console.log('📊 Summary Statistics:');
        console.log(`   - Total Stickers: ${stickers.length.toLocaleString()}`);
        console.log(`   - Total Activations: ${activations.length.toLocaleString()}`);

        const totalRevenue = activations.reduce((sum, a) => sum + a.amount_paid, 0);
        console.log(`   - Total Revenue Generated: ₦${(totalRevenue / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
        console.log(`   - Average per Activation: ₦${((totalRevenue / activations.length) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);

        console.log('\n📅 Time Period:');
        console.log(`   - Data spans: ${MONTHS_OF_DATA} months`);
        console.log(`   - Most recent activations weighted higher`);

        console.log('\n🏢 LGA Distribution:');
        for (const [lgaId, lga] of Object.entries(LGA_DISTRIBUTION)) {
            const lgaStickers = stickers.filter(s => s.lga_id === parseInt(lgaId));
            const lgaActivations = activations.filter(a => a.lga_id === parseInt(lgaId));
            const lgaRevenue = lgaActivations.reduce((sum, a) => sum + a.amount_paid, 0);
            console.log(`   - ${lga.name}: ${lgaStickers.length} stickers, ${lgaActivations.length} activations, ₦${(lgaRevenue / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
        }

        console.log('\n📈 Status Distribution:');
        for (const status of ['unused', 'active', 'expired', 'revoked']) {
            const count = stickers.filter(s => s.status === status).length;
            const percentage = ((count / stickers.length) * 100).toFixed(1);
            console.log(`   - ${status}: ${count.toLocaleString()} (${percentage}%)`);
        }

        console.log('\n✅ Dashboard is now populated with realistic data!');
        console.log('🚀 Refresh your dashboard to see the charts and statistics!\n');
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('\n❌ Error during data generation:');
        console.error(error.message);
        console.error('\nStack trace:');
        console.error(error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script
console.log('\n🎯 Starting Green Permit Dashboard Data Generator...\n');
generateData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
