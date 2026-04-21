const pool = require('../db/pool');
const { notifyAllUsers } = require('./notificationsController');
const { writeAdminAudit } = require('../utils/auditLog');

// ─── GET /api/events ────────────────────────────────────────────
// Supports filters: type, neighborhood_id, date_from, date_to
const getEvents = async (req, res) => {
  const { type, neighborhood_id, date_from, date_to, status } = req.query;

  let query = `
    SELECT e.*,
           n.name as neighborhood_name,
           u.name as created_by_name,
           ent.name as entity_name,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?)::int as is_registered
    FROM events e
    LEFT JOIN neighborhoods n ON e.neighborhood_id = n.id
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN entities ent ON e.entity_id = ent.id
    WHERE 1=1
  `;
  const params = [req.user?.id];
  if (type) {
    query += ` AND e.type = ?`;
    params.push(type);
  }
  if (neighborhood_id) {
    query += ` AND e.neighborhood_id = ?`;
    params.push(neighborhood_id);
  }
  if (date_from) {
    query += ` AND e.date >= ?`;
    params.push(date_from);
  }
  if (date_to) {
    query += ` AND e.date <= ?`;
    params.push(date_to);
  }

  // Only show approved events to the public
  query += ` AND (e.approval_status IS NULL OR e.approval_status = 'approved')`;

  // Default: show only active events
  query += ` AND e.status = ?`;
  params.push(status || 'active');

  query += ' ORDER BY e.date ASC';

  try {
    const [rows] = await pool.query(query, params);
    res.json({ events: rows, count: rows.length });
  } catch (err) {
    console.error('GetEvents error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الفعاليات' });
  }
};

// ─── GET /api/events/:id ────────────────────────────────────────
const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT e.*,
              n.name as neighborhood_name,
              u.name as created_by_name,
              (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count,
              (SELECT COUNT(*) FROM registrations WHERE event_id = e.id AND user_id = ?)::int as is_registered
       FROM events e
       LEFT JOIN neighborhoods n ON e.neighborhood_id = n.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [req.user?.id || 0, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'الفعالية غير موجودة' });
    }

    res.json({ event: rows[0] });
  } catch (err) {
    console.error('GetEventById error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الفعالية' });
  }
};

// ─── POST /api/events  (Admin only) ─────────────────────────────
const createEvent = async (req, res) => {
  const {
    title, description, type, neighborhood_id,
    location_name, lat, lng, date, duration_hours,
    max_participants, image_url
  } = req.body;

  if (!title || !date) {
    return res.status(400).json({ error: 'عنوان الفعالية والتاريخ مطلوبان' });
  }

  try {
    const [insertResult] = await pool.query(
      `INSERT INTO events
        (title, description, type, neighborhood_id, location_name, lat, lng,
         date, duration_hours, max_participants, image_url, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`,
      [title, description, type, neighborhood_id, location_name,
        lat, lng, date, duration_hours || 2, max_participants || 50,
        image_url, req.user.id]
    );

    // Fetch the new event
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [insertResult.insertId]);

    const newEvent = rows[0];

    // ── Broadcast notification to all youth users ──────────────
    const eventDate = new Date(newEvent.date).toLocaleDateString('ar-EG', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    // Notify users in the same neighborhood first, then everyone else
    await notifyAllUsers(
      `فعالية جديدة: "${newEvent.title}" 🎉`,
      `${eventDate} · ${newEvent.location_name || ''} · سجّل الآن!`,
      'new_event',
      newEvent.id,
      'event',
      neighborhood_id || null   // filter by neighborhood if specified
    );

    // If neighborhood-specific, also notify all remaining users (without neighborhood filter)
    if (neighborhood_id) {
      await notifyAllUsers(
        `فعالية جديدة: "${newEvent.title}" 🎉`,
        `${eventDate} · ${newEvent.location_name || ''}`,
        'new_event',
        newEvent.id,
        'event',
        null  // all users without neighborhood filter
      );
    }

    const [an] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await writeAdminAudit(
      req.user.id,
      an[0]?.name,
      'EVENT_CREATED',
      'event',
      newEvent.id,
      newEvent.title,
      { neighborhood_id, date }
    );

    res.status(201).json({
      message: 'تم إنشاء الفعالية بنجاح',
      event: newEvent
    });
  } catch (err) {
    console.error('CreateEvent error:', err.message);
    res.status(500).json({ error: 'خطأ في إنشاء الفعالية' });
  }
};

// ─── PUT /api/events/:id  (Admin only) ──────────────────────────
const updateEvent = async (req, res) => {
  const { id } = req.params;
  const {
    title, description, type, neighborhood_id,
    location_name, lat, lng, date, duration_hours,
    max_participants, image_url, status
  } = req.body;

  try {
    const [event] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (event.length === 0) return res.status(404).json({ error: 'الفعالية غير موجودة' });

    if (!req.user.is_super_admin && event[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه الفعالية' });
    }

    await pool.query(
      `UPDATE events SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        neighborhood_id = COALESCE(?, neighborhood_id),
        location_name = COALESCE(?, location_name),
        lat = COALESCE(?, lat),
        lng = COALESCE(?, lng),
        date = COALESCE(?, date),
        duration_hours = COALESCE(?, duration_hours),
        max_participants = COALESCE(?, max_participants),
        image_url = COALESCE(?, image_url),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [title, description, type, neighborhood_id, location_name,
        lat, lng, date, duration_hours, max_participants,
        image_url, status, id]
    );

    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'الفعالية غير موجودة' });
    }

    const [an] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await writeAdminAudit(
      req.user.id,
      an[0]?.name,
      'EVENT_UPDATED',
      'event',
      parseInt(id, 10),
      rows[0].title,
      {}
    );

    res.json({ message: 'تم تحديث الفعالية', event: rows[0] });
  } catch (err) {
    console.error('UpdateEvent error:', err.message);
    res.status(500).json({ error: 'خطأ في تحديث الفعالية' });
  }
};

// ─── DELETE /api/events/:id  (Admin only) ───────────────────────
const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const [ev] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (!ev.length) {
      return res.status(404).json({ error: 'الفعالية غير موجودة' });
    }

    if (!req.user.is_super_admin && ev[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'غير مصرح لك بحذف هذه الفعالية' });
    }

    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'الفعالية غير موجودة' });
    }

    const [an] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await writeAdminAudit(
      req.user.id,
      an[0]?.name,
      'EVENT_DELETED',
      'event',
      parseInt(id, 10),
      ev[0].title,
      {}
    );

    res.json({ message: 'تم حذف الفعالية بنجاح' });
  } catch (err) {
    console.error('DeleteEvent error:', err.message);
    res.status(500).json({ error: 'خطأ في حذف الفعالية' });
  }
};

// ─── POST /api/events/entity  (Entity creates event, auto-approved) ──
const createEntityEvent = async (req, res) => {
  const {
    title, description, type, neighborhood_id,
    location_name, lat, lng, date, duration_hours,
    max_participants, image_url
  } = req.body;

  if (!title || !date) {
    return res.status(400).json({ error: 'عنوان الفعالية والتاريخ مطلوبان' });
  }

  const entityId = req.user.entity_id ?? req.user.id;

  try {
    const [entRows] = await pool.query('SELECT name FROM entities WHERE id = ?', [entityId]);
    if (!entRows.length) return res.status(404).json({ error: 'الجهة غير موجودة' });

    const [insertResult] = await pool.query(
      `INSERT INTO events
        (title, description, type, neighborhood_id, location_name, lat, lng,
         date, duration_hours, max_participants, image_url, created_by, entity_id, approval_status, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'approved','active') RETURNING id`,
      [title, description, type || 'اجتماعية', neighborhood_id, location_name,
        lat, lng, date, duration_hours || 2, max_participants || 50,
        image_url, req.user.id, entityId]
    );

    const eventId = insertResult.insertId;
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    const event = rows[0];

    // Notify all users about the new event
    const eventDate = new Date(date).toLocaleDateString('ar-EG', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    await notifyAllUsers(
      `فعالية جديدة: "${title}" 🎉`,
      `${eventDate} · ${location_name || ''} · سجّل الآن!`,
      'new_event', eventId, 'event', null
    );

    res.status(201).json({ message: 'تم نشر الفعالية بنجاح وإبلاغ الشباب', event });
  } catch (err) {
    console.error('createEntityEvent error:', err.message);
    res.status(500).json({ error: 'خطأ في إنشاء الفعالية' });
  }
};

// ─── GET /api/events/entity  (Entity sees their own events) ─────
const getEntityEvents = async (req, res) => {
  const entityId = req.user.entity_id ?? req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT e.*, n.name as neighborhood_name,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'pending')::int as pending_registrations_count
       FROM events e
       LEFT JOIN neighborhoods n ON e.neighborhood_id = n.id
       WHERE e.entity_id = ? OR e.created_by = ?
       ORDER BY e.created_at DESC`,
      [entityId, req.user.id]
    );
    res.json({ events: rows });
  } catch (err) {
    console.error('getEntityEvents error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الفعاليات' });
  }
};

// ─── GET /api/events/pending  (Admin: list pending entity events) ─
const getPendingEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, n.name as neighborhood_name, ent.name as entity_name
       FROM events e
       LEFT JOIN neighborhoods n ON e.neighborhood_id = n.id
       LEFT JOIN entities ent ON e.entity_id = ent.id
       WHERE e.approval_status = 'pending'
       ORDER BY e.created_at DESC`
    );
    res.json({ events: rows });
  } catch (err) {
    console.error('getPendingEvents error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الفعاليات المعلّقة' });
  }
};

// ─── PATCH /api/events/:id/approve  (Admin approves/rejects) ────
const approveEvent = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action يجب أن يكون approve أو reject' });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  try {
    const [ev] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (!ev.length) return res.status(404).json({ error: 'الفعالية غير موجودة' });

    await pool.query(`UPDATE events SET approval_status = ? WHERE id = ?`, [newStatus, id]);

    // If approved, notify all users about the new event
    if (newStatus === 'approved') {
      const event = ev[0];
      const eventDate = new Date(event.date).toLocaleDateString('ar-EG', {
        weekday: 'long', day: 'numeric', month: 'long',
      });
      await notifyAllUsers(
        `فعالية جديدة: "${event.title}" 🎉`,
        `${eventDate} · ${event.location_name || ''} · سجّل الآن!`,
        'new_event',
        event.id,
        'event',
        null
      );
    }

    res.json({ message: newStatus === 'approved' ? 'تمت الموافقة على الفعالية' : 'تم رفض الفعالية' });
  } catch (err) {
    console.error('approveEvent error:', err.message);
    res.status(500).json({ error: 'خطأ في معالجة الطلب' });
  }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent, createEntityEvent, getEntityEvents, getPendingEvents, approveEvent };
