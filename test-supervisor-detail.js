const Report = require('./src/models/Report');

async function testSupervisorDetail() {
    try {
        console.log('Testing getSupervisorDetailReport for supervisor ID 6 (Oga SuperVisor)...');

        const result = await Report.getSupervisorDetailReport(6, 4, {
            period: 'all'
        });

        if (!result) {
            console.log('❌ Supervisor not found!');
            process.exit(1);
        }

        console.log('\n=== SUPERVISOR DETAILS ===');
        console.log('Name:', result.supervisor.name);
        console.log('Officers count:', result.officers.length);
        console.log('\n=== OFFICERS ===');
        result.officers.forEach((officer, index) => {
            console.log(`\n${index + 1}. ${officer.name}`);
            console.log(`   Code: ${officer.officer_code}`);
            console.log(`   Activations: ${officer.statistics.total_activations}`);
            console.log(`   Revenue: ₦${(officer.statistics.total_revenue / 100).toLocaleString()}`);
            console.log(`   Status: ${officer.status}`);
        });

        console.log('\n=== SUMMARY ===');
        console.log(JSON.stringify(result.summary, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testSupervisorDetail();
