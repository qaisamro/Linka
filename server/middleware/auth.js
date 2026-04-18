const jwt  = require('jsonwebtoken');
const pool = require('../db/pool');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  // Check that the account is still active (not disabled by admin)
  try {
    // Back-compat: platform users live in `users`.
    // Entity accounts (companies/municipalities/universities) live in `entities`.
    if (decoded.role === 'entity') {
      const entityId = decoded.entity_id ?? decoded.id;
      const [rows] = await pool.query(
        'SELECT id, is_active FROM entities WHERE id = ?',
        [entityId]
      );
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Entity account not found.' });
      }
      if (rows[0].is_active === 0) {
        return res.status(403).json({ error: 'تم تعطيل الجهة من قِبل الإدارة. يُرجى التواصل معنا.' });
      }
      req.user = decoded; // { id, email, role: 'entity', entity_id, entity_type, ... }
      return next();
    }

    const [rows] = await pool.query(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    if (rows[0].is_active === 0) {
      return res.status(403).json({ error: 'تم تعطيل حسابك من قِبل الإدارة. يُرجى التواصل معنا.' });
    }

    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    console.error('Auth middleware DB error:', err.message);
    return res.status(500).json({ error: 'Authentication error.' });
  }
};

module.exports = verifyToken;
