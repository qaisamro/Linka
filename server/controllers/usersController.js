const pool = require('../db/pool');

// ─── GET /api/users/profile  ─────────────────────────────────────
const getProfile = async (req, res) => {
  try {
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

    const [userRows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role,
              u.points, u.total_hours, u.avatar_url, u.bio, u.created_at,
              u.is_university_student, u.university, u.student_id,
              n.name as neighborhood_name,
              (SELECT COUNT(*) FROM registrations WHERE user_id = u.id AND status = 'attended') as participations,
              (SELECT COALESCE(SUM(e.duration_hours * ${MULTIPLIER_SQL}), 0)
               FROM registrations r
               JOIN events e ON r.event_id = e.id
               WHERE r.user_id = u.id AND r.status = 'attended') as external_hours
       FROM users u
       LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // Get user badges
    const [badgeRows] = await pool.query(
      `SELECT b.*, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [req.user.id]
    );

    res.json({
      user: userRows[0],
      badges: badgeRows
    });
  } catch (err) {
    console.error('GetProfile error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الملف الشخصي' });
  }
};

// ─── GET /api/users/leaderboard  ─────────────────────────────────
const getLeaderboard = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.points, u.total_hours, n.name as neighborhood_name,
              (SELECT COUNT(*) FROM registrations WHERE user_id = u.id AND status = 'attended') as participations
       FROM users u
       LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
       WHERE u.role = 'youth'
       ORDER BY u.points DESC
       LIMIT 20`
    );

    res.json({ leaderboard: rows });
  } catch (err) {
    console.error('GetLeaderboard error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب لوحة المتصدرين' });
  }
};

// ─── GET /api/users/stats  (Admin) ───────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [statsRows] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'youth') as total_users,
        (SELECT COUNT(*) FROM events WHERE status = 'active') as active_events,
        (SELECT COUNT(*) FROM registrations WHERE status = 'attended') as total_attendances,
        (SELECT COALESCE(SUM(total_hours), 0) FROM users) as total_volunteer_hours
    `);

    // Most active neighborhoods
    const [topNeighborhoodRows] = await pool.query(`
      SELECT n.name, COUNT(r.id) as registrations
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN neighborhoods n ON u.neighborhood_id = n.id
      WHERE r.status = 'attended'
      GROUP BY n.name
      ORDER BY registrations DESC
      LIMIT 5
    `);

    // Events per type
    const [eventsByTypeRows] = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM events
      GROUP BY type
      ORDER BY count DESC
    `);

    res.json({
      stats: statsRows[0],
      topNeighborhoods: topNeighborhoodRows,
      eventsByType: eventsByTypeRows
    });
  } catch (err) {
    console.error('GetDashboardStats error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الإحصائيات' });
  }
};

// ─── PATCH /api/users/profile ────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'لم يتم توفير بيانات لتحديثها' });
    }

    // List of fields that users are allowed to update
    const allowedFields = ['avatar_url', 'bio', 'phone', 'neighborhood_id'];
    const fieldsToUpdate = [];
    const values = [];

    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(updates[key]);
      }
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'لا يوجد حقول صالحة للتحديث' });
    }

    values.push(userId);

    await pool.query(
      `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'تم التحديث بنجاح' });
  } catch (err) {
    console.error('UpdateProfile error:', err.message);
    res.status(500).json({ error: 'خطأ داخلي أثناء التحديث' });
  }
};

// ─── GET /api/users/cv-data ────────────────────────────────────
const getCVData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRows] = await pool.query(
      `SELECT u.name, u.email, u.phone, u.bio, u.avatar_url,
              u.university, u.is_university_student, n.name as neighborhood_name
       FROM users u
       LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const [eventRows] = await pool.query(
      `SELECT e.id, e.title, e.type, e.description, e.date, e.duration_hours, r.status
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = ? AND r.status = 'attended'
       ORDER BY e.date DESC`,
      [userId]
    );

    const formatCVDate = (isoString) => {
      const d = new Date(isoString);
      return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
    };

    const externalVolunteering = eventRows.map(ev => ({
      id: ev.id,
      title: ev.title,
      organization: 'مبادرات الخليل الشبابية',
      location: 'الخليل',
      startDate: formatCVDate(ev.date),
      endDate: formatCVDate(ev.date),
      description: ev.description,
      type: ev.type,
      hours: ev.duration_hours
    }));

    const skillsRaw = eventRows.reduce((acc, ev) => {
      let evSkills = [];
      if (ev.type === 'تعليمية') evSkills = ['القيادة', 'التعلم الذاتي', 'التقنية'];
      else if (ev.type === 'تطوعية') evSkills = ['العمل الجماعي', 'الخدمة المجتمعية', 'المبادرة'];
      else if (ev.type === 'بيئية') evSkills = ['الاستدامة', 'العمل الجماعي'];
      else if (ev.type === 'رياضية') evSkills = ['روح الفريق', 'الإنجاز'];
      else if (ev.type === 'اجتماعية') evSkills = ['التواصل', 'المرونة'];
      else if (ev.type === 'ثقافية') evSkills = ['الإبداع', 'التقديم'];

      evSkills.forEach(skill => acc[skill] = (acc[skill] || 0) + ev.duration_hours);
      return acc;
    }, {});

    const topSkills = Object.entries(skillsRaw)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    res.json({
      projects: externalVolunteering,
      skills: topSkills
    });

  } catch (err) {
    console.error('GetCVData error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب بيانات السيرة الذاتية' });
  }
};

module.exports = { getProfile, getLeaderboard, getDashboardStats, updateProfile, getCVData };
