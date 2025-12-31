const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const config = require('../src/config/env.config');

async function initializeDatabase() {
    let connection;

    try {
        console.log('🔄 Initializing database...\n');

        // Connect to MySQL server (without database)
        connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            multipleStatements: true,
        });

        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${config.database.name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`✅ Database '${config.database.name}' ready`);

        // Use the database
        await connection.query(`USE ${config.database.name}`);

        // Read and execute schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = await fs.readFile(schemaPath, 'utf8');

        // Remove CREATE DATABASE statements from schema (we already did it)
        const cleanedSchema = schemaSQL
            .split('\n')
            .filter(line => !line.trim().startsWith('CREATE DATABASE') && !line.trim().startsWith('USE '))
            .join('\n');

        await connection.query(cleanedSchema);
        console.log('✅ Database schema created');

        // Read and execute seed file
        const seedPath = path.join(__dirname, 'seed.sql');
        const seedSQL = await fs.readFile(seedPath, 'utf8');

        // Remove USE statements from seed
        const cleanedSeed = seedSQL
            .split('\n')
            .filter(line => !line.trim().startsWith('USE '))
            .join('\n');

        await connection.query(cleanedSeed);
        console.log('✅ Seed data inserted');

        console.log('\n🎉 Database initialization completed successfully!\n');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run initialization
initializeDatabase();
