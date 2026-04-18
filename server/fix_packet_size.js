const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixMaxPacket() {
    try {
        const pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT || 3306,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
        });

        console.log('Increasing max_allowed_packet in MySQL to 1GB...');
        // 1GB (1073741824 bytes)
        await pool.query('SET GLOBAL max_allowed_packet=1073741824;');
        console.log('Success! max_allowed_packet has been increased.');
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('Failed to set max_allowed_packet:', err.message);
        process.exit(1);
    }
}

fixMaxPacket();
