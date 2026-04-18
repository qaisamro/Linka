require('dotenv').config();
const pool = require('./db/pool');

const sql = `CREATE TABLE IF NOT EXISTS verification_codes (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  event_id        INT NOT NULL,
  university_id   INT,
  code            VARCHAR(80) NOT NULL UNIQUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at      TIMESTAMP NULL DEFAULT NULL,
  is_used         BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
)`;

pool.query(sql)
    .then(() => { console.log('✅ verification_codes table created!'); process.exit(0); })
    .catch(e => { console.log('❌', e.code, e.sqlMessage); process.exit(1); });
