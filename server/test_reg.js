const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRegistration() {
    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT || 3307,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: 'hebron_youth'
    });

    try {
        const userId = 1; // Existing admin user
        const [[event]] = await pool.query('SELECT id FROM events LIMIT 1');
        if (!event) { console.log('No events found'); return; }

        console.log(`Registering User ${userId} to Event ${event.id}...`);

        const [insertResult] = await pool.query(
            `INSERT INTO registrations (user_id, event_id) VALUES (?, ?)`,
            [userId, event.id]
        );

        console.log('Insert Result:', insertResult);
        console.log('New ID:', insertResult.insertId);

        const [rows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [insertResult.insertId]);
        console.log('Fetched Row:', rows[0]);

        // Cleanup
        await pool.query('DELETE FROM registrations WHERE id = ?', [insertResult.insertId]);
    } catch (err) {
        console.error('REGISTRATION FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

testRegistration();
