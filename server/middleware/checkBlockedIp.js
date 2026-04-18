const pool = require('../db/pool');

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) {
    return xf.split(',')[0].trim();
  }
  if (req.socket?.remoteAddress) return req.socket.remoteAddress.replace(/^::ffff:/, '');
  return '';
}

/**
 * Blocks requests from IPs listed in blocked_ips (is_active = 1).
 */
async function checkBlockedIp(req, res, next) {
  const ip = clientIp(req);
  if (!ip) return next();

  try {
    const [rows] = await pool.query(
      'SELECT id FROM blocked_ips WHERE is_active = 1 AND ip = ? LIMIT 1',
      [ip]
    );
    if (rows.length) {
      return res.status(403).json({
        error: 'تم حظر الوصول من عنوان الشبكة الحالي. تواصل مع الإدارة.',
      });
    }
  } catch (err) {
    console.warn('checkBlockedIp:', err.message);
  }
  return next();
}

module.exports = { checkBlockedIp, clientIp };
