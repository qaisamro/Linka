const pool = require('../db/pool');
const { notifyAdmins, createNotificationForUser } = require('./notificationsController');
const { writeAdminAudit } = require('../utils/auditLog');

// ─── POST /api/registrations/:eventId  ──────────────────────────
// Register current user to an event
const registerToEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    // Check event exists and is active
    const [eventRows] = await pool.query(
      'SELECT * FROM events WHERE id = ? AND status = ?',
      [eventId, 'active']
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ error: 'الفعالية غير موجودة أو غير متاحة' });
    }

    const event = eventRows[0];

    // Check capacity
    if (event.current_participants >= event.max_participants) {
      return res.status(400).json({ error: 'عذراً، الفعالية ممتلئة' });
    }

    // Check if already registered
    const [existingRows] = await pool.query(
      'SELECT id FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'أنت مسجّل في هذه الفعالية مسبقاً' });
    }

    // Register user
    const [insertResult] = await pool.query(
      `INSERT INTO registrations (user_id, event_id) VALUES (?, ?) RETURNING id`,
      [userId, eventId]
    );

    // Update participant count
    await pool.query(
      'UPDATE events SET current_participants = current_participants + 1 WHERE id = ?',
      [eventId]
    );

    // Fetch new registration with event info for response
    const [regRows] = await pool.query(`
      SELECT r.*, e.title, e.date, e.location_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `, [insertResult.insertId]);

    // ── Fetch user name for notification ──────────────────────
    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRows[0]?.name || 'مستخدم';
    const regTime = new Date().toLocaleString('ar-EG', {
      timeZone: 'Asia/Hebron', hour: '2-digit', minute: '2-digit',
      day: 'numeric', month: 'short',
    });

    // Notify all admins
    await notifyAdmins(
      `تسجيل جديد في "${event.title}"`,
      `${userName} انضم للفعالية · ${regTime}`,
      'registration', parseInt(eventId), 'event'
    );

    // Confirm registration to the user (Pending review)
    await createNotificationForUser(
      userId,
      `تم استلام طلب انضمامك في "${event.title}" 📋`,
      `طلبك قيد المراجعة حالياً، سيصلك إشعار فور تأكيد الطلب.`,
      'registration', parseInt(eventId), 'event'
    );

    await writeAdminAudit(
      userId,
      userName,
      'USER_JOINED_EVENT',
      'event',
      parseInt(eventId, 10),
      event.title,
      { registration_id: insertResult.insertId }
    );

    res.status(201).json({
      message: 'تم التسجيل في الفعالية بنجاح! 🎉',
      registration: regRows[0]
    });
  } catch (err) {
    console.error('RegisterToEvent error:', err.message);
    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
      return res.status(409).json({ error: 'أنت مسجّل في هذه الفعالية مسبقاً' });
    }
    res.status(500).json({ error: 'خطأ في عملية التسجيل' });
  }
};

// ─── GET /api/registrations/my  ─────────────────────────────────
// Get all registrations for current user
const getMyRegistrations = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT r.*, e.title, e.date, e.location_name, e.type,
              e.image_url, e.duration_hours, n.name as neighborhood_name
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       LEFT JOIN neighborhoods n ON e.neighborhood_id = n.id
       WHERE r.user_id = ?
       ORDER BY r.registered_at DESC`,
      [userId]
    );

    res.json({ registrations: rows });
  } catch (err) {
    console.error('GetMyRegistrations error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب التسجيلات' });
  }
};

// ─── GET /api/registrations/event/:eventId  (Admin only) ────────
const getEventRegistrations = async (req, res) => {
  const { eventId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.name as user_name, u.email, u.phone, u.avatar_url,
              n.name as neighborhood_name
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
       WHERE r.event_id = ?
       ORDER BY r.registered_at ASC`,
      [eventId]
    );

    res.json({ registrations: rows, count: rows.length });
  } catch (err) {
    console.error('GetEventRegistrations error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب المشاركين' });
  }
};

// ─── PATCH /api/registrations/:id/confirm  (Admin only) ─────────
// Confirm attendance + award points + hours
const confirmAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    // Get registration with event info
    const [regRows] = await pool.query(
      `SELECT r.*, e.duration_hours, e.title
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.id = ?`,
      [id]
    );

    if (regRows.length === 0) {
      return res.status(404).json({ error: 'التسجيل غير موجود' });
    }

    const reg = regRows[0];

    if (reg.status === 'attended') {
      return res.status(400).json({ error: 'تم تأكيد الحضور مسبقاً' });
    }

    // Update registration status
    await pool.query(
      `UPDATE registrations SET status = 'attended', confirmed_at = NOW()
       WHERE id = ?`,
      [id]
    );

    // Award points (10 per event) and hours
    const points = 10;
    await pool.query(
      `UPDATE users SET
         points = points + ?,
         total_hours = total_hours + ?
       WHERE id = ?`,
      [points, reg.duration_hours, reg.user_id]
    );

    // Check and award badges
    await checkAndAwardBadges(reg.user_id);

    // Notify the user their attendance was confirmed
    await createNotificationForUser(
      reg.user_id,
      `تم تأكيد حضورك في "${reg.title}" 🎉`,
      `حصلت على ${points} نقطة و${reg.duration_hours} ساعة تطوع`,
      'attendance', reg.event_id, 'event'
    );

    res.json({
      message: `تم تأكيد حضور المستخدم وإضافة ${points} نقطة و${reg.duration_hours} ساعة`
    });
  } catch (err) {
    console.error('ConfirmAttendance error:', err.message);
    res.status(500).json({ error: 'خطأ في تأكيد الحضور' });
  }
};

// ─── Helper: Check and Award Badges ─────────────────────────────
const checkAndAwardBadges = async (userId) => {
  try {
    const [userRows] = await pool.query(
      `SELECT u.points, u.total_hours,
              (SELECT COUNT(*) FROM registrations WHERE user_id = u.id AND status = 'attended') as participations
       FROM users u WHERE u.id = ?`,
      [userId]
    );

    const user = userRows[0];
    const [badgeRows] = await pool.query('SELECT * FROM badges');

    for (const badge of badgeRows) {
      let earned = false;

      if (badge.condition_type === 'participations' && user.participations >= badge.condition_value) earned = true;
      if (badge.condition_type === 'hours' && user.total_hours >= badge.condition_value) earned = true;
      if (badge.condition_type === 'points' && user.points >= badge.condition_value) earned = true;

      if (earned) {
        const [insertResult] = await pool.query(
          `INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?) ON CONFLICT (user_id, badge_id) DO NOTHING RETURNING id`,
          [userId, badge.id]
        );
        if (insertResult.affectedRows > 0) {
          await createNotificationForUser(
            userId,
            `حصلت على شارة "${badge.name}" ${badge.icon} 🎖️`,
            badge.description || 'شارة جديدة في مسيرتك التطوعية',
            'badge', badge.id, 'badge'
          );
        }
      }
    }
  } catch (err) {
    console.error('CheckBadges error:', err.message);
  }
};

const deleteRegistration = async (req, res) => {
  const { id } = req.params;
  try {
    const [regRows] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    if (!regRows.length) return res.status(404).json({ error: 'التسجيل غير موجود' });
    const reg = regRows[0];

    // Ownership check for regular admins/users, but super admin bypass
    if (!req.user.is_super_admin && reg.user_id !== req.user.id) {
      // Check if requester is creator of the event
      const [event] = await pool.query('SELECT created_by FROM events WHERE id = ?', [reg.event_id]);
      if (!event.length || event[0].created_by !== req.user.id) {
        return res.status(403).json({ error: 'غير مصرح لك بحذف هذا التسجيل' });
      }
    }

    await pool.query('DELETE FROM registrations WHERE id = ?', [id]);
    await pool.query('UPDATE events SET current_participants = GREATEST(0, current_participants - 1) WHERE id = ?', [reg.event_id]);

    res.json({ message: 'تم حذف التسجيل بنجاح' });
  } catch (err) {
    console.error('deleteRegistration error:', err.message);
    res.status(500).json({ error: 'خطأ في حذف التسجيل' });
  }
};

module.exports = {
  registerToEvent,
  getMyRegistrations,
  getEventRegistrations,
  confirmAttendance,
  deleteRegistration
};
