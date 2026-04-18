const mysql = require('mysql2/promise');
require('dotenv').config();
async function seed() {
    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT || 3307,
        user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, database: 'hebron_youth'
    });
    try {
        console.log('--- جاري إضافة بيانات تجريبية للتقرير ---');
        // إضافة مستخدمين (طلاب)
        await pool.query("INSERT IGNORE INTO users (name, email, password_hash, role, university, student_id) VALUES ('أحمد الخليل', 'ahmed@test.com', '123', 'youth', 'جامعة الخليل', '20261001')");
        await pool.query("INSERT IGNORE INTO users (name, email, password_hash, role, university, student_id) VALUES ('سارة الخليل', 'sara@test.com', '123', 'youth', 'جامعة بوليتكنك فلسطين', '20261002')");
        // جلب المعرفات
        const [[u1]] = await pool.query("SELECT id FROM users WHERE email='ahmed@test.com'");
        const [[e1]] = await pool.query("SELECT id FROM events LIMIT 1");
        // إضافة تسجيلات وحضور مؤكد
        await pool.query("INSERT IGNORE INTO registrations (user_id, event_id, status, confirmed_at) VALUES (?, ?, 'attended', NOW())", [u1.id, e1.id]);
        console.log('✅ تم إضافة البيانات! جرب تحديث صفحة التقارير الآن.');
    } catch (err) { console.error(err.message); }
    finally { await pool.end(); }
}
seed();
