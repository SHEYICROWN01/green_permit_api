const Report = require('./src/models/Report');

async function testSupervisorsQuery() {
    try {
        console.log('Testing getSupervisorReportsSummary...');

        const result = await Report.getSupervisorReportsSummary(4, {
            period: 'all'
        });

        console.log('\n=== RESULT ===');
        console.log('Supervisors count:', result.supervisors.length);
        console.log('Supervisors:', JSON.stringify(result.supervisors, null, 2));
        console.log('\nSummary:', JSON.stringify(result.summary, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

testSupervisorsQuery();
