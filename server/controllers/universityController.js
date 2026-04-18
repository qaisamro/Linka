const pool = require('../db/pool');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ─── Activity → Academic Hour Multipliers ────────────────────────
const MULTIPLIERS = {
  'تعليمية': 1.50,
  'بيئية': 1.00,
  'تطوعية': 1.00,
  'رياضية': 0.75,
  'اجتماعية': 0.75,
  'ثقافية': 0.50,
};

const MULTIPLIER_SQL = `
  CASE e.type
    WHEN 'تعليمية'  THEN 1.50
    WHEN 'بيئية'    THEN 1.00
    WHEN 'تطوعية'   THEN 1.00
    WHEN 'رياضية'   THEN 0.75
    WHEN 'اجتماعية' THEN 0.75
    WHEN 'ثقافية'   THEN 0.50
    ELSE 1.00
  END
`;

// ─── GET /api/university/report (admin) ──────────────────────────
const getReport = async (req, res) => {
  const { university, min_hours, limit = 50 } = req.query;
  try {
    const [students] = await pool.query(`
      SELECT
        u.id, u.name, u.email,
        COALESCE(u.university, 'غير محدد') AS university,
        COALESCE(u.student_id,  '—')        AS student_id,
        u.neighborhood_id,
        n.name AS neighborhood,
        counts.total_participations,
        counts.volunteer_hours,
        counts.academic_hours,
        counts.activities_raw AS activities_breakdown
      FROM users u
      LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
      LEFT JOIN (
        SELECT
          r2.user_id,
          COUNT(*) AS total_participations,
          SUM(e2.duration_hours) AS volunteer_hours,
          SUM(e2.duration_hours * ${MULTIPLIER_SQL.replace(/e\./g, 'e2.')}) AS academic_hours,
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
        ${university ? 'AND u.university = ?' : ''}
      GROUP BY u.id, u.name, u.email, u.university, u.student_id, n.name,
               counts.total_participations, counts.volunteer_hours, counts.academic_hours, counts.activities_raw
      HAVING COALESCE(counts.volunteer_hours, 0) >= ?
      ORDER BY counts.academic_hours DESC
      LIMIT ?
    `, [...(university ? [university] : []), parseFloat(min_hours) || 0, parseInt(limit)]);

    const [summary] = await pool.query(`
      SELECT
        COUNT(DISTINCT u.id) AS total_students,
        COALESCE(SUM(e.duration_hours), 0) AS total_volunteer_hours,
        COALESCE(SUM(e.duration_hours * ${MULTIPLIER_SQL}), 0) AS total_academic_hours,
        COUNT(DISTINCT r.id) AS total_attended_events
      FROM users u
      JOIN registrations r ON r.user_id = u.id AND r.status = 'attended'
      JOIN events e ON r.event_id = e.id
      WHERE u.role = 'youth'
        ${university ? 'AND u.university = ?' : ''}
    `, university ? [university] : []);

    const [activityDist] = await pool.query(`
      SELECT e.type,
        COUNT(*) AS total_participations,
        SUM(e.duration_hours) AS volunteer_hours,
        SUM(e.duration_hours * ${MULTIPLIER_SQL}) AS academic_hours,
        ROUND(AVG(${MULTIPLIER_SQL}), 2) AS avg_multiplier
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.status = 'attended'
      GROUP BY e.type
      ORDER BY academic_hours DESC
    `);

    const [topNeighborhoods] = await pool.query(`
      SELECT n.name, COUNT(DISTINCT u.id) AS students,
        SUM(e.duration_hours * ${MULTIPLIER_SQL}) AS academic_hours
      FROM users u
      JOIN neighborhoods n ON u.neighborhood_id = n.id
      JOIN registrations r ON r.user_id = u.id AND r.status = 'attended'
      JOIN events e ON r.event_id = e.id
      WHERE u.role = 'youth'
      GROUP BY n.id, n.name
      ORDER BY academic_hours DESC
      LIMIT 5
    `);

    const formattedStudents = students.map(s => ({
      ...s,
      volunteer_hours: parseFloat(s.volunteer_hours || 0).toFixed(1),
      academic_hours: parseFloat(s.academic_hours || 0).toFixed(2),
      activities_breakdown: parseActivities(s.activities_breakdown),
      certificate_eligible: parseFloat(s.academic_hours || 0) >= 10,
      certificate_code: parseFloat(s.academic_hours || 0) >= 10
        ? generateCertCode(s.id, s.academic_hours) : null,
    }));

    res.json({
      students: formattedStudents,
      summary: {
        total_students: parseInt(summary[0]?.total_students || 0),
        total_volunteer_hours: parseFloat(summary[0]?.total_volunteer_hours || 0).toFixed(1),
        total_academic_hours: parseFloat(summary[0]?.total_academic_hours || 0).toFixed(2),
        total_attended_events: parseInt(summary[0]?.total_attended_events || 0),
      },
      activity_distribution: activityDist.map(a => ({
        ...a,
        volunteer_hours: parseFloat(a.volunteer_hours || 0).toFixed(1),
        academic_hours: parseFloat(a.academic_hours || 0).toFixed(2),
        avg_multiplier: parseFloat(a.avg_multiplier || 1).toFixed(2),
      })),
      top_neighborhoods: topNeighborhoods.map(n => ({
        ...n,
        academic_hours: parseFloat(n.academic_hours || 0).toFixed(2),
      })),
      multipliers: MULTIPLIERS,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('University report error:', err.message);
    res.status(500).json({ error: 'خطأ في توليد تقرير الساعات الخارجية' });
  }
};

// ─── GET /api/university/student/:userId (admin/university) ──────
const getStudentTranscript = async (req, res) => {
  const { userId } = req.params;
  try {
    const [userRows] = await pool.query(
      `SELECT u.*, n.name AS neighborhood
       FROM users u LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
       WHERE u.id = ?`, [userId]
    );
    if (!userRows.length) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const { password_hash, ...user } = userRows[0];

    const [transcript] = await pool.query(`
      SELECT e.title, e.type, e.date, e.location_name,
        e.duration_hours AS volunteer_hours,
        ROUND(e.duration_hours * ${MULTIPLIER_SQL}, 2) AS academic_hours,
        ${MULTIPLIER_SQL} AS multiplier,
        r.status, r.confirmed_at
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ? AND r.status = 'attended'
      ORDER BY e.date DESC
    `, [userId]);

    const totalVolunteer = transcript.reduce((s, t) => s + parseFloat(t.volunteer_hours), 0);
    const totalAcademic = transcript.reduce((s, t) => s + parseFloat(t.academic_hours), 0);

    res.json({
      user: {
        ...user, total_volunteer_hours: totalVolunteer.toFixed(1),
        total_academic_hours: totalAcademic.toFixed(2),
        certificate_eligible: totalAcademic >= 10,
        certificate_code: totalAcademic >= 10 ? generateCertCode(userId, totalAcademic) : null,
      },
      transcript: transcript.map(t => ({
        ...t,
        volunteer_hours: parseFloat(t.volunteer_hours).toFixed(1),
        academic_hours: parseFloat(t.academic_hours).toFixed(2),
        multiplier: parseFloat(t.multiplier).toFixed(2),
      })),
      multipliers: MULTIPLIERS,
    });
  } catch (err) {
    console.error('Student transcript error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب السجل الأكاديمي' });
  }
};

// ─── GET /api/university/list ────────────────────────────────────
const getUniversities = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, code, city FROM entities WHERE type = 'university' AND is_active = TRUE ORDER BY name"
    );
    res.json({ universities: rows });
  } catch {
    res.json({
      universities: [
        { id: 1, name: 'جامعة الخليل', code: 'HU' },
        { id: 2, name: 'جامعة القدس المفتوحة', code: 'QOU' },
        { id: 3, name: 'كلية الدراسات التكنولوجية', code: 'PTC' },
        { id: 4, name: 'جامعة بوليتكنك فلسطين', code: 'PPU' },
      ]
    });
  }
};

// ─── GET /api/university/my-students (university) ────────────────
const getMyStudents = async (req, res) => {
  let universityId = req.user.entity_id || req.user.university_id || req.user.id;
  const { search = '', page = 1, university_id: queryUniId } = req.query;

  // Allow Super Admin to override universityId
  if (req.user.role === 'super_admin' && queryUniId) {
    universityId = queryUniId;
  }
  const limit = 50;
  const offset = (parseInt(page) - 1) * limit;
  const searchWild = `%${search}%`;

  try {
    const [students] = await pool.query(`
      SELECT
        us.id AS link_id,
        us.student_id,
        us.major,
        us.joined_at,
        us.is_verified,
        COALESCE(u.id, NULL) AS user_id,
        COALESCE(u.name, us.student_name) AS name,
        u.email,
        u.total_hours,
        u.points,
        COALESCE(att.total_participations, 0) AS total_participations,
        COALESCE(att.academic_hours, 0) AS academic_hours,
        COALESCE(ts.field_hours, 0) AS field_hours,
        tp.status AS training_status,
        tp.company_name AS training_company
      FROM university_students us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN (
        SELECT r.user_id,
          COUNT(*) AS total_participations,
          SUM(e.duration_hours * ${MULTIPLIER_SQL}) AS academic_hours
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.status = 'attended'
        GROUP BY r.user_id
      ) att ON att.user_id = u.id
      LEFT JOIN (
        SELECT student_user_id, SUM(computed_hours) AS field_hours
        FROM training_sessions
        WHERE status = 'university_approved'
        GROUP BY student_user_id
      ) ts ON ts.student_user_id = u.id
      LEFT JOIN (
        SELECT tp1.student_user_id, tp1.status, o.company_name
        FROM training_programs tp1
        JOIN training_offers o ON tp1.offer_id = o.id
        WHERE tp1.id = (SELECT MAX(id) FROM training_programs WHERE student_user_id = tp1.student_user_id)
      ) tp ON tp.student_user_id = u.id
      WHERE us.university_id = ?
        AND (
          COALESCE(u.name, us.student_name) LIKE ?
          OR us.student_id LIKE ?
          OR u.email LIKE ?
          OR tp.company_name LIKE ?
        )
      ORDER BY (COALESCE(att.academic_hours, 0) + COALESCE(ts.field_hours, 0)) DESC
      LIMIT ? OFFSET ?
    `, [universityId, searchWild, searchWild, searchWild, searchWild, limit, offset]);

    const [countRow] = await pool.query(
      `SELECT COUNT(*) AS total FROM university_students WHERE university_id = ?`,
      [universityId]
    );
    const [statRow] = await pool.query(`
      SELECT
        COUNT(DISTINCT us.id) AS total_students,
        COALESCE(SUM(u.total_hours), 0) AS total_hours,
        COUNT(DISTINCT CASE WHEN att.academic_hours >= 10 THEN us.id END) AS cert_eligible
      FROM university_students us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN (
        SELECT r.user_id, SUM(e.duration_hours * ${MULTIPLIER_SQL}) AS academic_hours
        FROM registrations r JOIN events e ON r.event_id = e.id
        WHERE r.status = 'attended' GROUP BY r.user_id
      ) att ON att.user_id = u.id
      WHERE us.university_id = ?
    `, [universityId]);

    res.json({
      students: students.map(s => ({
        ...s,
        academic_hours: parseFloat(s.academic_hours || 0).toFixed(2),
        field_hours: parseFloat(s.field_hours || 0).toFixed(2),
        total_hours: parseFloat(s.total_hours || 0).toFixed(1),
        training_status: s.training_status || 'none',
        training_company: s.training_company || null,
        certificate_eligible: (parseFloat(s.academic_hours || 0) + parseFloat(s.field_hours || 0)) >= 10,
      })),
      total: parseInt(countRow[0]?.total || 0),
      stats: {
        total_students: parseInt(statRow[0]?.total_students || 0),
        total_hours: parseFloat(statRow[0]?.total_hours || 0).toFixed(1),
        cert_eligible: parseInt(statRow[0]?.cert_eligible || 0),
      }
    });
  } catch (err) {
    console.error('getMyStudents error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب قائمة الطلاب' });
  }
};

// ─── POST /api/university/add-student ────────────────────────────
const addStudent = async (req, res) => {
  const universityId = req.user.entity_id || req.user.university_id || req.user.id;
  const { student_id, student_name, major, email, password } = req.body;

  if (!student_id) return res.status(400).json({ error: 'الرقم الجامعي مطلوب' });

  try {
    // 1. Check if already linked in university_students
    const [existing] = await pool.query(
      'SELECT id FROM university_students WHERE university_id = ? AND student_id = ?',
      [universityId, student_id]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'هذا الطالب مضاف مسبقاً في جامعتك' });
    }

    let userId = null;
    let nameToUse = student_name || null;

    // 2. If email/password provided, create a full user account first
    if (email && password) {
      const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
      if (existingUser.length) {
        return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      const [uniInfo] = await pool.query('SELECT name FROM entities WHERE id = ?', [universityId]);
      const uniName = uniInfo[0]?.name || null;

      const [userInsert] = await pool.query(
        `INSERT INTO users (name, email, password_hash, is_university_student, university, student_id)
         VALUES (?, ?, ?, TRUE, ?, ?)`,
        [student_name || 'طالب جديد', email.toLowerCase(), password_hash, uniName, student_id]
      );
      userId = userInsert.insertId;
      nameToUse = student_name || 'طالب جديد';
    } else {
      // 3. Try to find user by student_id or email (if only email provided)
      const [userRows] = await pool.query(
        'SELECT id, name FROM users WHERE student_id = ? OR (email = ? AND email IS NOT NULL) LIMIT 1',
        [student_id, email || '____']
      );
      if (userRows.length) {
        userId = userRows[0].id;
        nameToUse = userRows[0].name;
      }
    }

    // 4. Link to university_students
    await pool.query(
      `INSERT INTO university_students (university_id, user_id, student_id, student_name, major)
       VALUES (?, ?, ?, ?, ?)`,
      [universityId, userId, student_id, nameToUse, major || null]
    );

    res.status(201).json({
      message: userId ? 'تم إضافة الطالب وربط حسابه بنجاح' : 'تم إضافة الطالب (سيُربط تلقائياً عند تسجيله)',
      linked: !!userId,
      userId
    });
  } catch (err) {
    console.error('addStudent error:', err.message);
    res.status(500).json({ error: 'خطأ في إضافة الطالب' });
  }
};

// ─── POST /api/university/verify-attendance ───────────────────────
const verifyAttendance = async (req, res) => {
  const universityId = req.user.entity_id || req.user.university_id || req.user.id;
  const { verification_code, student_id } = req.body;

  if (!verification_code) return res.status(400).json({ error: 'رمز التحقق مطلوب' });

  try {
    // Find the verification code
    const [codeRows] = await pool.query(
      `SELECT vc.*, e.title, e.duration_hours, e.type
       FROM verification_codes vc
       JOIN events e ON vc.event_id = e.id
       WHERE vc.code = ? AND vc.is_used = FALSE
         AND (vc.university_id IS NULL OR vc.university_id = ?)`,
      [verification_code, universityId]
    );

    if (!codeRows.length) {
      return res.status(404).json({ error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
    }
    const codeData = codeRows[0];

    // Find the student
    const [studentRows] = await pool.query(
      `SELECT u.id, u.name FROM users u
       JOIN university_students us ON us.user_id = u.id
       WHERE us.university_id = ? AND us.student_id = ?`,
      [universityId, student_id]
    );
    if (!studentRows.length) {
      return res.status(404).json({ error: 'الطالب غير موجود في قائمتكم' });
    }
    const student = studentRows[0];

    const multiplier = MULTIPLIERS[codeData.type] || 1.0;
    const approvedHours = parseFloat(codeData.duration_hours) * multiplier;

    // Insert approval (ignore duplicate)
    await pool.query(
      `INSERT IGNORE INTO hour_approvals (user_id, university_id, event_id, approved_hours)
       VALUES (?, ?, ?, ?)`,
      [student.id, universityId, codeData.event_id, approvedHours]
    );

    // Update user total_hours
    await pool.query(
      `UPDATE users SET total_hours = (
         SELECT COALESCE(SUM(ha.approved_hours), 0)
         FROM hour_approvals ha WHERE ha.user_id = ?
       ) WHERE id = ?`,
      [student.id, student.id]
    );

    // Mark code as used
    await pool.query('UPDATE verification_codes SET is_used = TRUE WHERE id = ?', [codeData.id]);

    res.json({
      message: `تم اعتماد ${approvedHours.toFixed(2)} ساعة للطالب ${student.name}`,
      student: student.name,
      event: codeData.title,
      approved_hours: approvedHours.toFixed(2),
    });
  } catch (err) {
    console.error('verifyAttendance error:', err.message);
    res.status(500).json({ error: 'خطأ في التحقق من الحضور' });
  }
};

// ─── GET /api/university/dashboard-stats ─────────────────────────
const getDashboardStats = async (req, res) => {
  let universityId = req.user.entity_id || req.user.university_id || req.user.id;
  const { university_id: queryUniId } = req.query;

  if (req.user.role === 'super_admin' && queryUniId) {
    universityId = queryUniId;
  }
  try {
    // Top 5 students
    const [topStudents] = await pool.query(`
      SELECT COALESCE(u.name, us.student_name) AS name, us.student_id,
        COALESCE(att.academic_hours, 0) AS academic_hours,
        COALESCE(att.total_participations, 0) AS total_participations
      FROM university_students us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN (
        SELECT r.user_id,
          SUM(e.duration_hours * ${MULTIPLIER_SQL}) AS academic_hours,
          COUNT(*) AS total_participations
        FROM registrations r JOIN events e ON r.event_id = e.id
        WHERE r.status = 'attended' GROUP BY r.user_id
      ) att ON att.user_id = u.id
      WHERE us.university_id = ?
      ORDER BY att.academic_hours DESC
      LIMIT 5
    `, [universityId]);

    // Activity distribution for this university's students
    const [activityDist] = await pool.query(`
      SELECT e.type, COUNT(*) AS count,
        SUM(e.duration_hours) AS volunteer_hours
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN university_students us ON us.user_id = r.user_id
      WHERE r.status = 'attended' AND us.university_id = ?
      GROUP BY e.type ORDER BY count DESC
    `, [universityId]);

    // Overall stats
    const [stats] = await pool.query(`
      SELECT
        COUNT(DISTINCT us.id) AS total_students,
        COUNT(DISTINCT CASE WHEN u.id IS NOT NULL THEN us.id END) AS linked_students,
        COALESCE(SUM(att.academic_hours), 0) AS total_academic_hours,
        COUNT(DISTINCT CASE WHEN att.academic_hours >= 10 THEN us.id END) AS cert_eligible
      FROM university_students us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN (
        SELECT r.user_id, SUM(e.duration_hours * ${MULTIPLIER_SQL}) AS academic_hours
        FROM registrations r JOIN events e ON r.event_id = e.id
        WHERE r.status = 'attended' GROUP BY r.user_id
      ) att ON att.user_id = u.id
      WHERE us.university_id = ?
    `, [universityId]);

    res.json({
      stats: {
        total_students: parseInt(stats[0]?.total_students || 0),
        linked_students: parseInt(stats[0]?.linked_students || 0),
        total_academic_hours: parseFloat(stats[0]?.total_academic_hours || 0).toFixed(1),
        cert_eligible: parseInt(stats[0]?.cert_eligible || 0),
      },
      top_students: topStudents.map(s => ({
        ...s,
        academic_hours: parseFloat(s.academic_hours || 0).toFixed(2),
      })),
      activity_distribution: activityDist,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب إحصائيات اللوحة' });
  }
};

// ─── GET /api/university/certificate/:userId ─────────────────────
const issueCertificate = async (req, res) => {
  const { userId } = req.params;
  const universityId = req.user.entity_id || req.user.university_id || req.user.id;

  try {
    const [studentRows] = await pool.query(
      `SELECT u.name, u.email, us.student_id, us.major
       FROM users u
       JOIN university_students us ON us.user_id = u.id
       WHERE u.id = ? AND us.university_id = ?`,
      [userId, universityId]
    );
    if (!studentRows.length) {
      return res.status(404).json({ error: 'الطالب غير موجود في سجلات جامعتك' });
    }
    const student = studentRows[0];

    // Compute total approved academic hours
    const [hoursRow] = await pool.query(
      `SELECT COALESCE(SUM(e.duration_hours * ${MULTIPLIER_SQL}), 0) AS academic_hours,
              COUNT(*) AS total_participations
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = ? AND r.status = 'attended'`,
      [userId]
    );
    const academicHours = parseFloat(hoursRow[0]?.academic_hours || 0);
    const totalParticipations = parseInt(hoursRow[0]?.total_participations || 0);

    if (academicHours < 10) {
      return res.status(422).json({
        error: `الطالب لديه ${academicHours.toFixed(1)} ساعة فقط. يحتاج 10 ساعات على الأقل للشهادة`
      });
    }

    // Get university info
    const [uniRows] = await pool.query(
      "SELECT name FROM entities WHERE id = ? AND type = 'university'", [universityId]
    );

    res.json({
      certificate: {
        student_name: student.name,
        student_id: student.student_id,
        major: student.major,
        academic_hours: academicHours.toFixed(2),
        total_participations: totalParticipations,
        university_name: uniRows[0]?.name || 'الجامعة',
        certificate_code: generateCertCode(userId, academicHours),
        issued_at: new Date().toISOString(),
      }
    });
  } catch (err) {
    console.error('issueCertificate error:', err.message);
    res.status(500).json({ error: 'خطأ في إصدار الشهادة' });
  }
};

// ─── POST /api/university/generate-code (admin) ──────────────────
const generateEventCode = async (req, res) => {
  const { event_id } = req.body;
  if (!event_id) return res.status(400).json({ error: 'event_id مطلوب' });

  try {
    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      'INSERT INTO verification_codes (event_id, code, expires_at) VALUES (?, ?, ?)',
      [event_id, code, expires_at]
    );

    const [eventRows] = await pool.query('SELECT title FROM events WHERE id = ?', [event_id]);

    res.json({
      code,
      event: eventRows[0]?.title,
      expires_at,
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?data=${code}&size=200x200`,
    });
  } catch (err) {
    console.error('generateEventCode error:', err.message);
    res.status(500).json({ error: 'خطأ في توليد رمز التحقق' });
  }
};

// ─── Helpers ─────────────────────────────────────────────────────
function parseActivities(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  const obj = {};
  raw.split('|').forEach(pair => {
    const [key, val] = pair.split(':');
    if (key) obj[key] = parseInt(val) || 0;
  });
  return obj;
}

function generateCertCode(userId, hours) {
  const base = `HY${String(userId).padStart(4, '0')}H${Math.round(parseFloat(hours) * 10)}`;
  const check = [...base].reduce((s, c) => s + c.charCodeAt(0), 0) % 97;
  return `${base}-${String(check).padStart(2, '0')}`;
}

module.exports = {
  getReport,
  getStudentTranscript,
  getUniversities,
  getMyStudents,
  addStudent,
  verifyAttendance,
  getDashboardStats,
  issueCertificate,
  generateEventCode,
};
