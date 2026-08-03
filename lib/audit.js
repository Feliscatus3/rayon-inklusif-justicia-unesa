/**
 * Audit Logger
 * Logs authentication events to the database for security monitoring.
 */
const { query, getClient } = require('./db');

/**
 * Log an audit event
 * @param {Object} params
 * @param {string} params.userId - User ID (nullable for anonymous actions)
 * @param {string} params.action - Action type (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.)
 * @param {string} params.ip - Client IP address
 * @param {string} params.userAgent - User-Agent header
 * @param {string|null} params.details - Additional JSON details
 * @param {string|null} params.username - Username attempted (for failed logins)
 */
async function logAudit({ userId, action, ip, userAgent, details = null, username = null }) {
  try {
    await query(
      `INSERT INTO audit_log (user_id, username, action, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, username || null, action, ip || 'unknown', userAgent || 'unknown', details]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
    // Don't throw — audit failures should not break the app
  }
}

/**
 * Get recent audit logs for a user
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getUserAuditLogs(userId, limit = 20) {
  try {
    const result = await query(
      `SELECT action, ip_address, user_agent, details, created_at
       FROM audit_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } catch (err) {
    console.error('Get audit logs error:', err.message);
    return [];
  }
}

/**
 * Get recent failed login attempts from an IP
 * @param {string} ip
 * @param {number} withinMinutes
 * @returns {Promise<Array>}
 */
async function getFailedLoginsByIP(ip, withinMinutes = 15) {
  try {
    const result = await query(
      `SELECT * FROM audit_log
       WHERE ip_address = $1
         AND action = 'LOGIN_FAILED'
         AND created_at > NOW() - ($2 || ' minutes')::INTERVAL
       ORDER BY created_at DESC`,
      [ip, withinMinutes.toString()]
    );
    return result.rows;
  } catch (err) {
    console.error('Get failed logins error:', err.message);
    return [];
  }
}

module.exports = {
  logAudit,
  getUserAuditLogs,
  getFailedLoginsByIP
};
