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
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?)::int as is_registered
    FROM events e
    LEFT JOIN neighborhoods n ON e.neighborhood_id = n.id
    LEFT JOIN users u ON e.created_by = u.id
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
              (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count
       FROM events e
       LEFT JOIN neighborhoods n ON e.neighborhood_id = n.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [id]
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
    const [ev] = await pool.query('SELECT id, title FROM events WHERE id = ?', [id]);
    if (!ev.length) {
      return res.status(404).json({ error: 'الفعالية غير موجودة' });
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

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };
