const pool = require('../db/pool');
const { getRequestMetrics } = require('../middleware/requestMetrics');
const { writeAdminAudit } = require('../utils/auditLog');
const bcrypt = require('bcryptjs');

async function maybeAutoAlerts() {
  try {
    const [[{ c: regs24 }]] = await pool.query(
      `SELECT COUNT(*) AS c FROM registrations WHERE registered_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    const [[{ c: regsPrev }]] = await pool.query(
      `SELECT COUNT(*) AS c FROM registrations
       WHERE registered_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND registered_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)`
    );
    const [[{ c: users24 }]] = await pool.query(
      `SELECT COUNT(*) AS c FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    if (regsPrev > 0 && regs24 > regsPrev * 3 && regs24 >= 10) {
      const [[dup]] = await pool.query(
        `SELECT id FROM admin_alerts WHERE alert_type = 'SPIKE_REGISTRATIONS'
         AND created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR) LIMIT 1`
      );
      if (!dup) {
        await pool.query(
          `INSERT INTO admin_alerts (severity, alert_type, title, body, metadata)
           VALUES ('warning', 'SPIKE_REGISTRATIONS', 'زيادة حادة في التسجيلات',
                   'عدد التسجيلات خلال 24 ساعة تجاوز 3× اليوم السابق',
                   JSON_OBJECT('regs24', ?, 'regsPrev', ?))`,
          [regs24, regsPrev]
        );
      }
    }

    if (users24 >= 30) {
      const [[dup]] = await pool.query(
        `SELECT id FROM admin_alerts WHERE alert_type = 'SPIKE_NEW_USERS'
         AND created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR) LIMIT 1`
      );
      if (!dup) {
        await pool.query(
          `INSERT INTO admin_alerts (severity, alert_type, title, body, metadata)
           VALUES ('info', 'SPIKE_NEW_USERS', 'عدد كبير من المستخدمين الجدد',
                   'تم إنشاء حسابات جديدة بوتيرة عالية',
                   JSON_OBJECT('users24', ?))`,
          [users24]
        );
      }
    }
  } catch (e) {
    console.warn('maybeAutoAlerts:', e.message);
  }
}

const getOverview = async (req, res) => {
  try {
    await maybeAutoAlerts();

    const q = (sql) => pool.query(sql).then(([rows]) => rows[0]);
    const [
      { total_users },
      { active_accounts },
      { youth_count },
      { upcoming_events },
      { all_events },
      { total_regs },
      { regs_7d },
      { hours_sum },
      { active_last_7d_login },
    ] = await Promise.all([
      q(`SELECT COUNT(*) AS total_users FROM users`),
      q(`SELECT COUNT(*) AS active_accounts FROM users WHERE is_active = 1`),
      q(`SELECT COUNT(*) AS youth_count FROM users WHERE role = 'youth'`),
      q(`SELECT COUNT(*) AS upcoming_events FROM events WHERE date >= CURDATE() AND status = 'active'`),
      q(`SELECT COUNT(*) AS all_events FROM events`),
      q(`SELECT COUNT(*) AS total_regs FROM registrations`),
      q(
        `SELECT COUNT(*) AS regs_7d FROM registrations WHERE registered_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
      q(`SELECT COALESCE(SUM(total_hours),0) AS hours_sum FROM users`),
      q(
        `SELECT COUNT(*) AS active_last_7d_login FROM users
         WHERE last_login_at IS NOT NULL AND last_login_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
    ]);

    const [topNeighborhood] = await pool.query(`
      SELECT n.name, COUNT(u.id) AS cnt
      FROM neighborhoods n
      LEFT JOIN users u ON u.neighborhood_id = n.id
      GROUP BY n.id, n.name
      ORDER BY cnt DESC
      LIMIT 1
    `);

    const [topUniversity] = await pool.query(`
      SELECT university AS name, COUNT(*) AS cnt
      FROM users
      WHERE university IS NOT NULL AND university != ''
      GROUP BY university
      ORDER BY cnt DESC
      LIMIT 1
    `);

    const [neighborhoodHeat] = await pool.query(`
      SELECT n.name,
 COUNT(DISTINCT r.id) AS registrations,
             COUNT(DISTINCT r.user_id) AS unique_users
      FROM neighborhoods n
      LEFT JOIN users u ON u.neighborhood_id = n.id
      LEFT JOIN registrations r ON r.user_id = u.id
      GROUP BY n.id, n.name
      ORDER BY registrations DESC
    `);

    const [recentAudit] = await pool.query(`
      SELECT id, admin_name, action, target_type, target_name, created_at
      FROM admin_audit_log
      ORDER BY created_at DESC
      LIMIT 15
    `);

    const [unreadAlerts] = await pool.query(
      `SELECT * FROM admin_alerts WHERE is_read = 0 ORDER BY created_at DESC LIMIT 20`
    );

    const metrics = getRequestMetrics();
    const dbHealth = await pool.checkDatabaseHealth();

    res.json({
      stats: {
        total_users: total_users,
        active_accounts,
        youth_count,
        upcoming_events,
        all_events,
        total_registrations: total_regs,
        registrations_7d: regs_7d,
        total_volunteer_hours: Math.round(parseFloat(hours_sum) || 0),
        active_users_7d: active_last_7d_login || regs_7d,
      },
      insights: {
        top_neighborhood: topNeighborhood[0]?.name || '—',
        top_neighborhood_count: topNeighborhood[0]?.cnt ?? 0,
        top_university: topUniversity[0]?.name || '—',
        top_university_users: topUniversity[0]?.cnt ?? 0,
      },
      neighborhood_activity: neighborhoodHeat,
      recent_activity: recentAudit,
      alerts: unreadAlerts,
      performance: {
        api: metrics,
        database: dbHealth,
        status: dbHealth.connected && metrics.errors5xx < 100 ? 'healthy' : 'degraded',
      },
    });
  } catch (err) {
    console.error('getOverview', err);
    res.status(500).json({ error: 'خطأ في لوحة المراقبة المركزية' });
  }
};

const listAlerts = async (req, res) => {
  try {
    const { unread_only } = req.query;
    let q = 'SELECT * FROM admin_alerts WHERE 1=1';
    const p = [];
    if (unread_only === '1') q += ' AND is_read = 0';
    q += ' ORDER BY created_at DESC LIMIT 100';
    const [rows] = await pool.query(q, p);
    res.json({ alerts: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب التنبيهات' });
  }
};

const markAlertRead = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE admin_alerts SET is_read = 1 WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في تحديث التنبيه' });
  }
};

const listBlockedIps = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM blocked_ips ORDER BY created_at DESC LIMIT 200'
    );
    res.json({ blocked: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب قائمة الحظر' });
  }
};

const addBlockedIp = async (req, res) => {
  const { ip, reason } = req.body;
  if (!ip || !String(ip).trim()) {
    return res.status(400).json({ error: 'عنوان IP مطلوب' });
  }
  const clean = String(ip).trim();
  try {
    await pool.query(
      `INSERT INTO blocked_ips (ip, reason, created_by, is_active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE is_active = 1, reason = VALUES(reason)`,
      [clean, reason || null, req.user.id]
    );
    const [adminRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await writeAdminAudit(
      req.user.id,
      adminRows[0]?.name,
      'IP_BLOCKED',
      'security',
      null,
      clean,
      { reason }
    );
    res.json({ message: 'تم حظر العنوان' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في إضافة الحظر' });
  }
};

const removeBlockedIp = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE blocked_ips SET is_active = 0 WHERE id = ?', [id]);
    const [adminRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await writeAdminAudit(req.user.id, adminRows[0]?.name, 'IP_UNBLOCKED', 'security', parseInt(id, 10), null);
    res.json({ message: 'تم إلغاء الحظر' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في إلغاء الحظر' });
  }
};

const listAllEvents = async (req, res) => {
  try {
    const [events] = await pool.query(`
      SELECT e.*, n.name AS neighborhood_name, u.name AS created_by_name,
             (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registration_count
      FROM events e
      LEFT JOIN neighborhoods n ON e.neighborhood_id = n.id
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.date DESC
    `);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب الفعاليات' });
  }
};

const patchUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, neighborhood_id, role, password } = req.body;

  if (parseInt(id, 10) === req.user.id && role && role !== 'super_admin') {
    return res.status(400).json({ error: 'لا يمكنك تخفيض صلاحيات نفسك هنا' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const target = rows[0];

    if (target.role === 'super_admin' && req.user.id !== target.id) {
      return res.status(403).json({ error: 'لا يمكن تعديل حساب Super Admin آخر من هنا' });
    }

    const updates = [];
    const params = [];

    if (name != null) { updates.push('name = ?'); params.push(name); }
    if (email != null) { updates.push('email = ?'); params.push(String(email).toLowerCase()); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (neighborhood_id !== undefined) { updates.push('neighborhood_id = ?'); params.push(neighborhood_id); }

    if (role) {
      const allowed = ['youth', 'admin', 'sub_admin', 'university'];
      if (!allowed.includes(role)) {
        return res.status(400).json({ error: 'دور غير مسموح لهذا المسار' });
      }
      updates.push('role = ?');
      params.push(role);
    }

    if (password && String(password).length >= 6) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'لا توجد حقول للتحديث' });
    }

    params.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const [adminRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await writeAdminAudit(
      req.user.id,
      adminRows[0]?.name,
      'USER_UPDATED_BY_SUPER',
      'user',
      parseInt(id, 10),
      target.name,
      { fields: Object.keys(req.body).filter((k) => k !== 'password') }
    );

    res.json({ message: 'تم تحديث المستخدم' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }
    console.error(err);
    res.status(500).json({ error: 'خطأ في تحديث المستخدم' });
  }
};

const exportAuditCsv = async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT id, admin_id, admin_name, action, target_type, target_id, target_name, details, created_at
      FROM admin_audit_log
      ORDER BY created_at DESC
      LIMIT 5000
    `);
    const header = 'id,admin_id,admin_name,action,target_type,target_id,target_name,details,created_at\n';
    const lines = logs.map((l) =>
      [
        l.id,
        l.admin_id,
        JSON.stringify(l.admin_name || ''),
        l.action,
        l.target_type,
        l.target_id,
        JSON.stringify(l.target_name || ''),
        JSON.stringify(l.details || ''),
        l.created_at,
      ].join(',')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send('\ufeff' + header + lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'تعذر تصدير السجل' });
  }
};

const exportUsersCsv = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.points, u.total_hours, u.is_active,
             u.created_at, n.name AS neighborhood_name,
             (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id) AS registrations
      FROM users u
      LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
      ORDER BY u.id    `);
    const header = 'id,name,email,phone,role,points,total_hours,is_active,registrations,neighborhood,created_at\n';
    const lines = users.map((u) =>
      [
        u.id,
        JSON.stringify(u.name),
        u.email,
        JSON.stringify(u.phone || ''),
        u.role,
        u.points,
        u.total_hours,
        u.is_active,
        u.registrations,
        JSON.stringify(u.neighborhood_name || ''),
        u.created_at,
      ].join(',')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users-report.csv"');
    res.send('\ufeff' + header + lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'تعذر تصدير المستخدمين' });
  }
};

module.exports = {
  getOverview,
  listAlerts,
  markAlertRead,
  listBlockedIps,
  addBlockedIp,
  removeBlockedIp,
  listAllEvents,
  patchUser,
  exportAuditCsv,
  exportUsersCsv,
};
