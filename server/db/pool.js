const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'Hebron_Youth',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('📡 MySQL Pool Created');

pool.checkDatabaseHealth = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { connected: true };
  } catch (err) {
    return {
      connected: false,
      code: err.code || null,
    };
  }
};

module.exports = pool;
