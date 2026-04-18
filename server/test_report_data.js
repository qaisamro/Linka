const mysql = require('mysql2/promise');
require('dotenv').config();

const MULTIPLIER_SQL = `
  CASE e2.type
    WHEN 'تعليمية'  THEN 1.50
    WHEN 'بيئية'    THEN 1.00
    WHEN 'تطوعية'   THEN 1.00
    WHEN 'رياضية'   THEN 0.75
    WHEN 'اجتماعية' THEN 0.75
    WHEN 'ثقافية'   THEN 0.50
    ELSE 1.00
  END
`;

async function testReportWithData() {
    try {
        const pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT || 3306,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        // 1. Create a youth user
        await pool.query('INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['Test Youth', 'youth@test.com', 'hash', 'youth']);
        const [[user]] = await pool.query('SELECT id FROM users WHERE email = ?', ['youth@test.com']);

        // 2. Sample event
        await pool.query("INSERT IGNORE INTO events (title, type, date, duration_hours) VALUES ('Event 1', 'تعليمية', NOW(), 2)");
        const [[event]] = await pool.query("SELECT id FROM events WHERE title = 'Event 1'");

        // 3. Register and set to attended
        await pool.query("INSERT IGNORE INTO registrations (user_id, event_id, status) VALUES (?, ?, 'attended')", [user.id, event.id]);

        // 4. Run the query
        const [rows] = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        counts.total_participations,
        counts.volunteer_hours,
        counts.academic_hours,
        counts.activities_raw                AS activities_breakdown

      FROM users u
      LEFT JOIN (
        SELECT 
          r2.user_id,
          COUNT(*) AS total_participations,
          SUM(e2.duration_hours) AS volunteer_hours,
          SUM(e2.duration_hours * ${MULTIPLIER_SQL}) AS academic_hours,
          GROUP_CONCAT(CONCAT(COALESCE(e2.type, 'أخرى'), ':', type_counts.cnt) SEPARATOR '|') AS activities_raw
        FROM registrations r2
        JOIN events e2 ON r2.event_id = e2.id
        JOIN (
           SELECT r3.user_id, e3.type, COUNT(*) as cnt
           FROM registrations r3
           JOIN events e3 ON r3.event_id = e3.id
           WHERE r3.status = 'attended'
           GROUP BY r3.user_id, e3.type
        ) type_counts ON type_counts.user_id = r2.user_id AND type_counts.type = e2.type
        WHERE r2.status = 'attended'
        GROUP BY r2.user_id
      ) counts ON counts.user_id = u.id

      WHERE u.role = 'youth'
      GROUP BY u.id, u.name, u.email, 
               counts.total_participations, counts.volunteer_hours, counts.academic_hours, counts.activities_raw
    `);

        console.log('Query Result:', JSON.stringify(rows, null, 2));

        // 5. Cleanup
        await pool.query('DELETE FROM registrations WHERE user_id = ?', [user.id]);
        await pool.query('DELETE FROM users WHERE id = ?', [user.id]);
        await pool.query('DELETE FROM events WHERE id = ?', [event.id]);

        await pool.end();
    } catch (err) {
        console.error('FAILED QUERY:', err.message);
    }
}

testReportWithData();
