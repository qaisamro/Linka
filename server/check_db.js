const pool = require('./db/pool');

async function check() {
    try {
        const [rows] = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables in DB:', rows.map(r => r.table_name).join(', '));

        const hasNotifs = rows.some(r => r.table_name === 'notifications');
        if (!hasNotifs) {
            console.log('❌ Notifications table is MISSING!');
        } else {
            console.log('✅ Notifications table exists.');
            const [cols] = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notifications'
      `);
            console.log('Columns in notifications:', cols.map(c => c.column_name).join(', '));
        }
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err.message);
        process.exit(1);
    }
}

check();
