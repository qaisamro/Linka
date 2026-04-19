const { Pool } = require('pg');
require('dotenv').config();

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

console.log('📡 PostgreSQL Pool Created');

function convertMysqlParams(sql, params) {
  if (!params || params.length === 0) return { sql, params: [] };
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  return { sql: pgSql, params };
}

function mysqlifyRows(pgResult) {
  const rows = pgResult.rows || [];
  Object.defineProperty(rows, 'affectedRows', { value: pgResult.rowCount || 0, enumerable: false });
  Object.defineProperty(rows, 'insertId', { value: rows[0]?.id || null, enumerable: false });
  return rows;
}

const pool = {
  async query(sql, params) {
    try {
      const { sql: pgSql, params: pgParams } = convertMysqlParams(sql, params);
      const result = await pgPool.query(pgSql, pgParams);
      const rows = mysqlifyRows(result);
      return [rows, null];
    } catch (err) {
      throw err;
    }
  },
  checkDatabaseHealth: async () => {
    try {
      await pgPool.query('SELECT 1');
      return { connected: true };
    } catch (err) {
      return { connected: false, code: err.code || null };
    }
  },
  end: () => pgPool.end(),
};

module.exports = pool;
