const pool = require('../db/pool');
const { createNotificationForUser } = require('./notificationsController');
const { writeAdminAudit } = require('../utils/auditLog');

// ─── GET /api/admin/users ────────────────────────────────────────────────────
// List all users with optional search + filters
const listUsers = async (req, res) => {
  const { q = '', role = '', status = '', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT u.id, u.name, u.email, u.phone, u.role, u.points,
           u.total_hours, u.is_active, u.created_at,
           n.name AS neighborhood_name,
           (SELECT COUNT(*) FROM registrations WHERE user_id = u.id) AS total_regs,
           (SELECT COUNT(*) FROM registrations WHERE user_id = u.id AND status = 'attended') AS attended_count
    FROM users u
    LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
    WHERE 1=1
  `;
  const params = [];

  if (q.trim()) {
    query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
    const like = `%${q.trim()}%`;
    params.push(like, like, like);
  }
  if (role) {
    query += ` AND u.role = ?`;
    params.push(role);
  }
  if (status === 'active') {
    query += ` AND u.is_active = 1`;
  } else if (status === 'inactive') {
    query += ` AND u.is_active = 0`;
  }

  // Total count for pagination
  const countQuery = `SELECT COUNT(*) AS total FROM users u WHERE 1=1${
    q.trim() ? ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)` : ''
  }${role ? ` AND u.role = ?` : ''}${
    status === 'active' ? ` AND u.is_active = 1` : status === 'inactive' ? ` AND u.is_active = 0` : ''
  }`;

  const countParams = [...params];

  query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  try {
    const [[{ total }], [users]] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(query, params),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('ListUsers error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب المستخدمين' });
  }
};

// ─── PATCH /api/admin/users/:id/toggle ──────────────────────────────────────
// Enable / disable a user account
const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const adminId   = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, is_active, role FROM users WHERE id = ?', [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const target = rows[0];

    if (target.id === adminId) {
      return res.status(400).json({ error: 'لا يمكنك تعطيل حسابك الخاص' });
    }
    if (target.role === 'super_admin') {
      return res.status(403).json({ error: 'لا يمكن تعطيل حساب Super Admin' });
    }
    if ((target.role === 'admin' || target.role === 'sub_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'تعطيل المدراء متاح لـ Super Admin فقط' });
    }

    const newStatus = target.is_active === 1 ? 0 : 1;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    const action = newStatus === 0 ? 'USER_DISABLED' : 'USER_ENABLED';
    const [adminRows] = await pool.query('SELECT name FROM users WHERE id = ?', [adminId]);

    await writeAdminAudit(
      adminId, adminRows[0]?.name, action,
      'user', target.id, target.name,
      { email: target.email, previous_status: target.is_active, new_status: newStatus }
    );

    // Notify the user if being disabled
    if (newStatus === 0) {
      await createNotificationForUser(
        target.id,
        'تم تعطيل حسابك مؤقتاً',
        'تواصل مع الإدارة لمزيد من المعلومات',
        'system', null, null
      );
    }

    res.json({
      message: newStatus === 0 ? 'تم تعطيل الحساب بنجاح' : 'تم تفعيل الحساب بنجاح',
      is_active: newStatus,
    });
  } catch (err) {
    console.error('ToggleUserStatus error:', err.message);
    res.status(500).json({ error: 'خطأ في تغيير حالة المستخدم' });
  }
};

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
// Permanently delete a user and all their data (CASCADE handles relations)
const deleteUser = async (req, res) => {
  const { id }  = req.params;
  const adminId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?', [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const target = rows[0];

    if (target.id === adminId) {
      return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    }
    if (target.role === 'super_admin') {
      return res.status(403).json({ error: 'لا يمكن حذف حساب Super Admin' });
    }
    if ((target.role === 'admin' || target.role === 'sub_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'حذف المدراء متاح لـ Super Admin فقط' });
    }

    const [adminRows] = await pool.query('SELECT name FROM users WHERE id = ?', [adminId]);

    await writeAdminAudit(
      adminId, adminRows[0]?.name, 'USER_DELETED',
      'user', target.id, target.name,
      { email: target.email }
    );

    // Delete (FK CASCADE removes registrations, badges, notifications)
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: `تم حذف المستخدم "${target.name}" بشكل نهائي` });
  } catch (err) {
    console.error('DeleteUser error:', err.message);
    res.status(500).json({ error: 'خطأ في حذف المستخدم' });
  }
};

// ─── GET /api/admin/events/:eventId/registrations ────────────────────────────
// Full participant list for an event with admin actions
const getEventRegistrationsAdmin = async (req, res) => {
  const { eventId } = req.params;
  const { status = '' } = req.query;

  let query = `
    SELECT r.id, r.status, r.registered_at, r.confirmed_at,
           u.id AS user_id, u.name AS user_name, u.email, u.phone,
           u.points, u.is_active,
           n.name AS neighborhood_name
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
    WHERE r.event_id = ?
  `;
  const params = [eventId];

  if (status) {
    query += ` AND r.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY r.registered_at ASC`;

  try {
    const [eventRows] = await pool.query(
      'SELECT id, title, current_participants, max_participants FROM events WHERE id = ?',
      [eventId]
    );
    if (eventRows.length === 0) return res.status(404).json({ error: 'الفعالية غير موجودة' });

    const [registrations] = await pool.query(query, params);

    res.json({ event: eventRows[0], registrations, count: registrations.length });
  } catch (err) {
    console.error('GetEventRegistrationsAdmin error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب المشاركين' });
  }
};

// ─── DELETE /api/admin/registrations/:id ─────────────────────────────────────
// Cancel (remove) a registration and decrement event participant count
const cancelRegistration = async (req, res) => {
  const { id }  = req.params;
  const adminId = req.user.id;

  try {
    const [regRows] = await pool.query(
      `SELECT r.*, u.name AS user_name, u.email, e.title AS event_title,
              e.id AS event_id
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.id = ?`,
      [id]
    );
    if (regRows.length === 0) return res.status(404).json({ error: 'التسجيل غير موجود' });

    const reg = regRows[0];
    const [adminRows] = await pool.query('SELECT name FROM users WHERE id = ?', [adminId]);

    // Remove registration
    await pool.query('DELETE FROM registrations WHERE id = ?', [id]);

    // Decrement participant count (only if not already cancelled status)
    if (reg.status !== 'cancelled') {
      await pool.query(
        'UPDATE events SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ?',
        [reg.event_id]
      );
    }

    // If the user had attended and received points, roll back points/hours
    if (reg.status === 'attended') {
      await pool.query(
        `UPDATE users SET
           points      = GREATEST(0, points - 10),
           total_hours = GREATEST(0, total_hours - ?)
         WHERE id = ?`,
        [reg.duration_hours || 0, reg.user_id]
      );
    }

    await writeAdminAudit(
      adminId, adminRows[0]?.name, 'REG_CANCELLED',
      'registration', reg.id,
      `${reg.user_name} ← ${reg.event_title}`,
      { user_id: reg.user_id, event_id: reg.event_id, previous_status: reg.status }
    );

    // Notify the user
    await createNotificationForUser(
      reg.user_id,
      `تم إلغاء تسجيلك في "${reg.event_title}"`,
      'تواصل مع الإدارة إذا كنت تعتقد أن هذا خطأ',
      'system', reg.event_id, 'event'
    );

    res.json({ message: `تم إلغاء تسجيل "${reg.user_name}" من الفعالية` });
  } catch (err) {
    console.error('CancelRegistration error:', err.message);
    res.status(500).json({ error: 'خطأ في إلغاء التسجيل' });
  }
};

// ─── PATCH /api/admin/registrations/:id/status ───────────────────────────────
// Change registration status (registered | cancelled | attended | absent)
const changeRegistrationStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;
  const adminId    = req.user.id;

  const VALID = ['registered', 'cancelled', 'attended', 'absent'];
  if (!VALID.includes(status)) {
    return res.status(400).json({ error: `حالة غير صالحة. القيم المقبولة: ${VALID.join(', ')}` });
  }

  try {
    const [regRows] = await pool.query(
      `SELECT r.*, u.name AS user_name, e.title AS event_title, e.duration_hours
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.id = ?`,
      [id]
    );
    if (regRows.length === 0) return res.status(404).json({ error: 'التسجيل غير موجود' });

    const reg        = regRows[0];
    const prevStatus = reg.status;

    if (prevStatus === status) {
      return res.status(400).json({ error: 'الحالة لم تتغير' });
    }

    // Update status
    const updateFields = { status };
    if (status === 'attended') updateFields.confirmed_at = new Date();

    await pool.query(
      `UPDATE registrations SET status = ?, confirmed_at = ${status === 'attended' ? 'NOW()' : 'confirmed_at'} WHERE id = ?`,
      [status, id]
    );

    // Handle points/hours side-effects
    const [adminRows] = await pool.query('SELECT name FROM users WHERE id = ?', [adminId]);

    // Award points if changing TO attended (from non-attended)
    if (status === 'attended' && prevStatus !== 'attended') {
      await pool.query(
        `UPDATE users SET points = points + 10, total_hours = total_hours + ? WHERE id = ?`,
        [reg.duration_hours || 0, reg.user_id]
      );
      await createNotificationForUser(
        reg.user_id,
        `تم تأكيد حضورك في "${reg.event_title}" ✅`,
        `حصلت على 10 نقطة و${reg.duration_hours || 0} ساعة`,
        'attendance', reg.event_id, 'event'
      );
    }

    // Roll back points if changing FROM attended to something else
    if (prevStatus === 'attended' && status !== 'attended') {
      await pool.query(
        `UPDATE users SET
           points      = GREATEST(0, points - 10),
           total_hours = GREATEST(0, total_hours - ?)
         WHERE id = ?`,
        [reg.duration_hours || 0, reg.user_id]
      );
    }

    // Handle participant count for cancelled status
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      await pool.query(
        'UPDATE events SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ?',
        [reg.event_id]
      );
    } else if (prevStatus === 'cancelled' && status !== 'cancelled') {
      await pool.query(
        'UPDATE events SET current_participants = current_participants + 1 WHERE id = ?',
        [reg.event_id]
      );
    }

    await writeAdminAudit(
      adminId, adminRows[0]?.name, 'REG_STATUS_CHANGED',
      'registration', reg.id,
      `${reg.user_name} ← ${reg.event_title}`,
      { user_id: reg.user_id, event_id: reg.event_id, from: prevStatus, to: status }
    );

    res.json({
      message: `تم تغيير حالة التسجيل إلى "${status}"`,
      previous: prevStatus,
      current: status,
    });
  } catch (err) {
    console.error('ChangeRegistrationStatus error:', err.message);
    res.status(500).json({ error: 'خطأ في تغيير حالة التسجيل' });
  }
};

// ─── GET /api/admin/audit-log ─────────────────────────────────────────────────
const getAuditLog = async (req, res) => {
  const { page = 1, limit = 30, action = '', target_type = '', search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT id, admin_id, admin_name, action, target_type,
           target_id, target_name, details, created_at
    FROM admin_audit_log
    WHERE 1=1
  `;
  const params = [];

  if (action) { query += ` AND action = ?`; params.push(action); }
  if (target_type) { query += ` AND target_type = ?`; params.push(target_type); }
  if (search) {
    query += ` AND (admin_name LIKE ? OR target_name LIKE ? OR action LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM admin_audit_log WHERE 1=1${
    action ? ` AND action = ?` : ''}${target_type ? ` AND target_type = ?` : ''}${
    search ? ` AND (admin_name LIKE ? OR target_name LIKE ? OR action LIKE ?)` : ''}`;
  const countParams = [...params];

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  try {
    const [[{ total }], [logs]] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(query, params),
    ]);

    const parsed = logs.map(l => ({
      ...l,
      details: l.details ? (() => { try { return JSON.parse(l.details); } catch { return l.details; } })() : null,
    }));

    res.json({
      logs: parsed,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    console.error('GetAuditLog error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب سجل العمليات' });
  }
};

// ─── POST /api/admin/impersonate/:id ─────────────────────────────────────────
const impersonateUser = async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'التقمص متاح لـ Super Admin فقط' });
  }
  const { id } = req.params;
  const jwt = require('jsonwebtoken');

  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, impersonated: true, admin_id: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const [sa] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await writeAdminAudit(req.user.id, sa[0]?.name || 'Super Admin', 'IMPERSONATION_START', 'user', user.id, user.name);

    res.json({ token, user, message: `دخلت الآن كـ ${user.name}` });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في عملية التقمص' });
  }
};

// ─── GET /api/admin/monitoring ───────────────────────────────────────────────
const getSystemMonitoring = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'youth'");
    const [activeUsers] = await pool.query("SELECT COUNT(DISTINCT user_id) as count FROM registrations WHERE registered_at > DATE_SUB(NOW(), INTERVAL 7 DAY)");
    const [events] = await pool.query("SELECT COUNT(*) as count FROM events WHERE date >= CURDATE()");
    const [totalHours] = await pool.query("SELECT SUM(total_hours) as total FROM users");
    
    const [recentLogs] = await pool.query("SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 10");
    
    // Insights
    const [topNeighborhood] = await pool.query(`
      SELECT n.name, COUNT(*) as count 
      FROM users u JOIN neighborhoods n ON u.neighborhood_id = n.id 
      GROUP BY n.id ORDER BY count DESC LIMIT 1
    `);

    res.json({
      stats: {
        total_users: users[0].count,
        active_users_7d: activeUsers[0].count,
        upcoming_events: events[0].count,
        total_volunteer_hours: Math.round(totalHours[0].total || 0),
      },
      insights: {
        top_neighborhood: topNeighborhood[0]?.name || '—',
      },
      recent_activity: recentLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب بيانات المراقبة' });
  }
};

// ─── Settings Management ────────────────────────────────────────────────────
const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM system_settings');
    res.json({ settings: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب الإعدادات' });
  }
};

const updateSetting = async (req, res) => {
  const { key, value } = req.body;
  try {
    await pool.query('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
    const [rows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await writeAdminAudit(req.user.id, rows[0]?.name, 'SETTING_CHANGED', 'config', 0, key, { new_value: value });
    res.json({ message: 'تم تحديث الإعداد بنجاح' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في تحديث الإعداد' });
  }
};

module.exports = {
  listUsers,
  toggleUserStatus,
  deleteUser,
  getEventRegistrationsAdmin,
  cancelRegistration,
  changeRegistrationStatus,
  getAuditLog,
  impersonateUser,
  getSystemMonitoring,
  getSettings,
  updateSetting
};
