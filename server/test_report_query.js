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

async function testReport() {
    try {
        const pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT || 3306,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });
        const [rows] = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(u.university, 'غير محدد') AS university,
        COALESCE(u.student_id,  '—')        AS student_id,
        u.neighborhood_id,
        n.name                               AS neighborhood,
        
        counts.total_participations,
        counts.volunteer_hours,
        counts.academic_hours,
        counts.activities_raw                AS activities_breakdown

      FROM users u
      LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
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
      GROUP BY u.id, u.name, u.email, u.university, u.student_id, n.name, 
               counts.total_participations, counts.volunteer_hours, counts.academic_hours, counts.activities_raw
      HAVING COALESCE(counts.volunteer_hours, 0) >= 0
      ORDER BY counts.academic_hours DESC
      LIMIT 100
    `);
        console.log('Query Success, Rows:', rows.length);
        await pool.end();
    } catch (err) {
        console.error('FAILED QUERY:', err.message);
        console.error('ERROR CODE:', err.code);
    }
}

testReport();
