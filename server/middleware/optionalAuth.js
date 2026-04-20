const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

/**
 * Optional Authentication Middleware
 * If a valid token is provided, req.user is populated.
 * If no token or invalid token, req.user remains undefined, but the request proceeds.
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Quick check if account exists/active
        if (decoded.role === 'entity') {
            const entityId = decoded.entity_id ?? decoded.id;
            const [rows] = await pool.query('SELECT id, is_active FROM entities WHERE id = ?', [entityId]);
            if (rows.length > 0 && rows[0].is_active) {
                req.user = decoded;
            }
        } else {
            const [rows] = await pool.query('SELECT id, is_active, role FROM users WHERE id = ?', [decoded.id]);
            if (rows.length > 0 && rows[0].is_active) {
                req.user = {
                    ...decoded,
                    is_super_admin: rows[0].role === 'super_admin' || rows[0].role === 'admin'
                };
            }
        }
    } catch (err) {
        // Silently ignore invalid tokens
    }

    next();
};

module.exports = optionalAuth;
