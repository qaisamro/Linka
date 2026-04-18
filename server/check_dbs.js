const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDbs() {
    try {
        const pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT || 3306,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
        });
        const [rows] = await pool.query('SHOW DATABASES');
        console.log('Databases:', rows.map(r => Object.values(r)[0]));
        await pool.end();
    } catch (err) {
        console.error('Error checking DBs:', err.message);
    }
}

checkDbs();
