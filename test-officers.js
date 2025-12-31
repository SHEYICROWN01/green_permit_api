#!/usr/bin/env node

// Quick test of the officers query
const db = require('./src/config/database');

async function testOfficersQuery() {
    try {
        const lgaId = 1;
        const limit = 3;
        const offset = 0;

        const whereClause = 'WHERE o.lga_id = ? AND o.role = "officer"';
        const sortClause = 'ORDER BY o.created_at DESC';

        const sql = `
            SELECT 
                o.id as officer_id,
                o.officer_code,
                o.name,
                o.username,
                o.phone,
                o.is_active as status,
                o.lga_id,
                l.name as lga_name,
                o.supervisor_id,
                s.name as supervisor_name,
                s.officer_code as supervisor_code,
                o.created_at,
                o.last_login_at as last_login
            FROM users o
            LEFT JOIN lgas l ON o.lga_id = l.id
            LEFT JOIN users s ON o.supervisor_id = s.id
            ${whereClause}
            ${sortClause}
            LIMIT ? OFFSET ?
        `;

        const queryParams = [lgaId, limit, offset];
        console.log('Query params:', queryParams);
        console.log('Param types:', queryParams.map(p => typeof p));

        const officers = await db.query(sql, queryParams); console.log(`\nFound ${officers.length} officers:`);
        officers.forEach(off => {
            console.log(`- ${off.officer_code}: ${off.name} (${off.username})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testOfficersQuery();
