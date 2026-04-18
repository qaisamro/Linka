const pool = require('../db/pool');
const bcrypt = require('bcryptjs');

/**
 * Super Admin: Create a new entity (University, Company, Municipality)
 */
const createEntity = async (req, res) => {
  const { name, name_en, type, email, password, code, contact_name, phone, website, description, city } = req.body;

  if (!name || !type || !email || !password) {
    return res.status(400).json({ error: 'Name, type, email, and password are required.' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO entities (name, name_en, type, email, password_hash, code, contact_name, phone, website, description, city, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [name, name_en, type, email, password_hash, code, contact_name, phone, website, description, city]
    );

    // Write to audit log
    await pool.query(
      'INSERT INTO entity_audit_log (actor_id, action, entity_id, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'CREATE_ENTITY', result.insertId, `Created ${type}: ${name}`]
    );

    res.status(201).json({ message: 'Entity created successfully', entityId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
      return res.status(400).json({ error: 'Email or Code already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Super Admin: List all entities with filters
 */
const listEntities = async (req, res) => {
  const { type, is_active } = req.query;
  let sql = 'SELECT id, name, name_en, type, email, contact_name, phone, city, code, is_active, is_approved, created_at FROM entities WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(is_active === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const [rows] = await pool.query(sql, params);
    res.json({ entities: rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Super Admin: Toggle entity status (Active/Suspended)
 */
const toggleEntity = async (req, res) => {
  const { id } = req.params;
  try {
    const [entity] = await pool.query('SELECT name, is_active FROM entities WHERE id = ?', [id]);
    if (entity.length === 0) return res.status(404).json({ error: 'Entity not found' });

    const newStatus = !entity[0].is_active;
    await pool.query('UPDATE entities SET is_active = ? WHERE id = ?', [newStatus, id]);

    // Audit Log
    await pool.query(
      'INSERT INTO entity_audit_log (actor_id, action, entity_id, details) VALUES (?, ?, ?, ?)',
      [req.user.id, newStatus ? 'ACTIVATE_ENTITY' : 'SUSPEND_ENTITY', id, `${newStatus ? 'Activated' : 'Suspended'} ${entity[0].name}`]
    );

    res.json({ message: `Entity ${newStatus ? 'activated' : 'suspended'} successfully`, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Super Admin: Get System Overview Stats
 */
const getSystemOverview = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT COUNT(*) as c FROM users');
    const [events] = await pool.query('SELECT COUNT(*) as c FROM events');
    const [entities] = await pool.query('SELECT type, COUNT(*) as c FROM entities GROUP BY type');
    const [recentLogs] = await pool.query(
      'SELECT l.*, u.name as actor_name FROM entity_audit_log l JOIN users u ON l.actor_id = u.id ORDER BY created_at DESC LIMIT 10'
    );

    res.json({
      stats: {
        totalUsers: users[0].c,
        totalEvents: events[0].c,
        entitiesByType: entities.reduce((acc, curr) => ({ ...acc, [curr.type]: curr.c }), {})
      },
      auditLog: recentLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteEntity = async (req, res) => {
  const { id } = req.params;
  try {
    const [entity] = await pool.query('SELECT name FROM entities WHERE id = ?', [id]);
    if (entity.length === 0) return res.status(404).json({ error: 'Entity not found' });

    await pool.query('DELETE FROM entities WHERE id = ?', [id]);

    await pool.query(
      'INSERT INTO entity_audit_log (actor_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'DELETE_ENTITY', `Deleted entity: ${entity[0].name}`]
    );

    res.json({ message: 'Entity deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Super Admin: Update entity details
 */
const updateEntity = async (req, res) => {
  const { id } = req.params;
  const { name, name_en, type, email, code, contact_name, phone, website, description, city, is_active } = req.body;

  try {
    const [entity] = await pool.query('SELECT name FROM entities WHERE id = ?', [id]);
    if (entity.length === 0) return res.status(404).json({ error: 'Entity not found' });

    await pool.query(
      `UPDATE entities SET 
        name = ?, name_en = ?, type = ?, email = ?, code = ?, 
        contact_name = ?, phone = ?, website = ?, description = ?, city = ?, is_active = ?
       WHERE id = ?`,
      [name, name_en, type, email, code, contact_name, phone, website, description, city, is_active, id]
    );

    // Audit Log
    await pool.query(
      'INSERT INTO entity_audit_log (actor_id, action, entity_id, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'UPDATE_ENTITY', id, `Updated details for ${entity[0].name}`]
    );

    res.json({ message: 'Entity updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
      return res.status(400).json({ error: 'Email or Code already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createEntity,
  listEntities,
  toggleEntity,
  getSystemOverview,
  deleteEntity,
  updateEntity
};
