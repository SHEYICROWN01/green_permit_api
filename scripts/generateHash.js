const bcrypt = require('bcryptjs');

// Generate bcrypt hash for "Admin@123"
async function generateHash() {
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 10);
    console.log('\nGenerated bcrypt hash for "Admin@123":');
    console.log(hash);
    console.log('\nUpdate SQL:');
    console.log(`UPDATE users SET password = '${hash}' WHERE role = 'super_admin' OR role = 'lga_admin' OR role IN ('supervisor', 'officer');`);
}

generateHash();
