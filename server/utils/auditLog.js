const pool = require('../db/pool');

/**
 * Unified admin / system audit row (actor may be admin, super_admin, or a regular user for login/join events).
 */
async function writeAdminAudit(actorId, actorName, action, targetType, targetId, targetName, details = null) {
  try {
    const detailStr = details == null
      ? null
      : typeof details === 'string'
        ? details
        : JSON.stringify(details);
    await pool.query(
      `INSERT INTO admin_audit_log
        (admin_id, admin_name, action, target_type, target_id, target_name, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [actorId, actorName || '', action, targetType, targetId ?? null, targetName ?? null, detailStr]
    );
  } catch (err) {
    console.error('writeAdminAudit:', err.message);
  }
}

module.exports = { writeAdminAudit };
