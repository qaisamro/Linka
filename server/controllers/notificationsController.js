const pool = require('../db/pool');

// ─── Helper: insert one notification (used internally by other controllers) ──
const createNotificationForUser = async (userId, title, message, type, relatedId = null, relatedType = null) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, message, type, relatedId, relatedType]
    );
  } catch (err) {
    // Non-fatal — log and continue
    console.error('createNotificationForUser error:', err.message);
  }
};

// ─── Helper: notify all admins ────────────────────────────────────────────────
const notifyAdmins = async (title, message, type, relatedId = null, relatedType = null) => {
  try {
    const [admins] = await pool.query(
      `SELECT id FROM users WHERE role = 'admin'`
    );
    for (const admin of admins) {
      await createNotificationForUser(admin.id, title, message, type, relatedId, relatedType);
    }
  } catch (err) {
    console.error('notifyAdmins error:', err.message);
  }
};

// ─── Helper: notify all youth users (optionally filter by neighborhood) ───────
const notifyAllUsers = async (title, message, type, relatedId = null, relatedType = null, neighborhoodId = null) => {
  try {
    let query = `SELECT id FROM users WHERE role = 'youth'`;
    const params = [];
    if (neighborhoodId) {
      query += ` AND neighborhood_id = ?`;
      params.push(neighborhoodId);
    }
    const [users] = await pool.query(query, params);
    if (!users.length) return 0;

    const values = users.map(u => [u.id, title, message, type, relatedId, relatedType]);
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES ?`,
      [values]
    );
    return users.length;
  } catch (err) {
    console.error('notifyAllUsers error:', err.message);
    return 0;
  }
};

// ─── GET /api/notifications  ─────────────────────────────────────────────────
// Returns paginated notifications for current user
const getMyNotifications = async (req, res) => {
  const userId = req.user.id;
  const { type, limit = 30, offset = 0 } = req.query;

  try {
    let query = `SELECT * FROM notifications WHERE user_id = ?`;
    const params = [userId];

    if (type && type !== 'all') {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);

    const [countRows] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END), 0) AS unread
       FROM notifications WHERE user_id = ?`,
      [userId]
    );

    const stats = countRows[0] || { total: 0, unread: 0 };

    res.json({
      notifications: rows,
      total:  Number(stats.total)  || 0,
      unread: Number(stats.unread) || 0,
    });
  } catch (err) {
    console.error('getMyNotifications error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الإشعارات' });
  }
};

// ─── GET /api/notifications/count  ───────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    res.json({ count: Number(rows[0].count) || 0 });
  } catch (err) {
    console.error('getUnreadCount error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب العدد' });
  }
};

// ─── PATCH /api/notifications/:id/read  ─────────────────────────────────────
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    res.json({ message: 'تم تحديد الإشعار كمقروء' });
  } catch (err) {
    console.error('markAsRead error:', err.message);
    res.status(500).json({ error: 'خطأ في التحديث' });
  }
};

// ─── PATCH /api/notifications/read-all  ─────────────────────────────────────
const markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ?`,
      [userId]
    );
    res.json({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
  } catch (err) {
    console.error('markAllAsRead error:', err.message);
    res.status(500).json({ error: 'خطأ في التحديث' });
  }
};

// ─── DELETE /api/notifications/:id  ─────────────────────────────────────────
const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    await pool.query(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    res.json({ message: 'تم حذف الإشعار' });
  } catch (err) {
    console.error('deleteNotification error:', err.message);
    res.status(500).json({ error: 'خطأ في الحذف' });
  }
};

// ─── DELETE /api/notifications (clear all read) ──────────────────────────────
const clearReadNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const [result] = await pool.query(
      `DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE`,
      [userId]
    );
    res.json({ message: `تم حذف ${result.affectedRows} إشعار`, count: result.affectedRows });
  } catch (err) {
    console.error('clearReadNotifications error:', err.message);
    res.status(500).json({ error: 'خطأ في الحذف' });
  }
};

// ─── POST /api/notifications/broadcast  (Admin only) ────────────────────────
// Sends a notification to all users or filtered by neighborhood / type
const broadcastNotification = async (req, res) => {
  const {
    title,
    message,
    type = 'announcement',
    related_id,
    related_type,
    neighborhood_id,  // optional filter
    target = 'youth', // 'youth' | 'all' | 'admin'
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'عنوان الإشعار مطلوب' });
  }

  try {
    let userQuery = `SELECT id FROM users WHERE 1=1`;
    const params = [];

    if (target === 'youth') {
      userQuery += ` AND role = 'youth'`;
    } else if (target === 'admin') {
      userQuery += ` AND role = 'admin'`;
    }
    // 'all' = no role filter

    if (neighborhood_id) {
      userQuery += ` AND neighborhood_id = ?`;
      params.push(neighborhood_id);
    }

    const [users] = await pool.query(userQuery, params);

    if (!users.length) {
      return res.json({ message: 'لا يوجد مستخدمون مستهدفون', count: 0 });
    }

    const values = users.map(u => [
      u.id, title, message || '', type,
      related_id || null, related_type || null
    ]);

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES ?`,
      [values]
    );

    res.json({
      message: `تم إرسال الإشعار بنجاح لـ ${users.length} مستخدم`,
      count: users.length
    });
  } catch (err) {
    console.error('broadcastNotification error:', err.message);
    res.status(500).json({ error: 'خطأ في إرسال الإشعار' });
  }
};

// ─── GET /api/notifications/admin/recent (Admin only) ───────────────────────
// Get recent registration + system notifications for admin view
const getAdminNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.name AS sender_name
       FROM notifications n
       LEFT JOIN users u ON n.related_id = u.id AND n.related_type = 'user'
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    console.error('getAdminNotifications error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الإشعارات' });
  }
};

module.exports = {
  // Public helpers (used by other controllers)
  createNotificationForUser,
  notifyAdmins,
  notifyAllUsers,

  // Route handlers
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  broadcastNotification,
  getAdminNotifications,
};
