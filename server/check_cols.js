const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCols() {
    try {
        const pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT || 3306,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });
        const [rows] = await pool.query('DESCRIBE users');
        console.log('Columns in users table:', rows.map(r => r.Field));
        await pool.end();
    } catch (err) {
        console.error('Error checking columns:', err.message);
    }
}

checkCols();
