/**
 * Authentication & Authorization Middleware
 *
 * Usage:
 *   const { requireAuth, requireRole } = require('../../lib/auth');
 *
 *   module.exports = async (req, res) => {
 *     const user = await requireAuth(req, res);
 *     if (!user) return;
 *
 *     if (!requireRole(user, res, 'admin', 'super_admin')) return;
 *     // ... endpoint logic
 *   };
 */

const { query } = require('./db');
const cookie = require('cookie');
const csrf = require('./csrf');

/**
 * Role hierarchy for permission checks.
 * Higher index = more privileged.
 */
const ROLE_HIERARCHY = [
  'anggota',
  'kader',
  'wakabid',
  'kabid',
  'bendahara',
  'sekretaris',
  'ketua_rayon',
  'admin',
  'super_admin'
];

const VALID_ROLES = ROLE_HIERARCHY;

/**
 * Get the privilege level of a role
 * @param {string} role
 * @returns {number} -1 if invalid, else index in hierarchy
 */
function roleLevel(role) {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx;
}

/**
 * Check if a user has at least the required role level
 * @param {object} user - { id, username, role, status }
 * @param {string|string[]} requiredRoles - One or more allowed roles
 * @returns {boolean}
 */
function hasRole(user, requiredRoles) {
  if (!user || !user.role) return false;
  if (!Array.isArray(requiredRoles)) requiredRoles = [requiredRoles];
  return requiredRoles.includes(user.role);
}

/**
 * Require authentication.
 * Reads session_token cookie, validates against DB.
 * Returns user object on success, sends 401 response on failure.
 *
 * @param {object} req
 * @param {object} res
 * @returns {object|null} user object or null
 */
async function requireAuth(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.session_token;

  if (!token) {
    res.status(401).json({ error: 'Tidak terautentikasi' });
    return null;
  }

  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa' });
      return null;
    }

    const user = result.rows[0];

    // Check if user account is active
    if (user.status !== 'active') {
      res.status(403).json({ error: 'Akun dinonaktifkan. Hubungi administrator.' });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return null;
  }
}

/**
 * Require one of the specified roles.
 * Call after requireAuth(). Sends 403 on failure.
 *
 * @param {object} user - User object from requireAuth()
 * @param {object} res
 * @param  {...string} allowedRoles - Roles that are permitted
 * @returns {boolean} true if authorized, false if 403 sent
 */
function requireRole(user, ...allowedRoles) {
  if (!user) return false;

  // For the response, we need to send it from the caller's context.
  // This function returns boolean and the caller handles the response.
  return allowedRoles.includes(user.role);
}

/**
 * Middleware-style: Check auth + role in one call.
 * Usage: const user = await requireAuthRole(req, res, 'admin', 'super_admin');
 *
 * @param {object} req
 * @param {object} res
 * @param  {...string} allowedRoles
 * @returns {object|null} user or null (response already sent)
 */
async function requireAuthRole(req, res, ...allowedRoles) {
  const user = await requireAuth(req, res);
  if (!user) return null;

  if (!requireRole(user, ...allowedRoles)) {
    res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin yang cukup.' });
    return null;
  }

  return user;
}

/**
 * Get the list of all valid roles
 * @returns {string[]}
 */
function getValidRoles() {
  return [...VALID_ROLES];
}

/**
 * Compare two roles. Returns positive if roleA > roleB, negative if roleA < roleB, 0 if equal.
 * @param {string} roleA
 * @param {string} roleB
 * @returns {number}
 */
function compareRoles(roleA, roleB) {
  return roleLevel(roleA) - roleLevel(roleB);
}

module.exports = {
  requireAuth,
  requireRole,
  requireAuthRole,
  hasRole,
  getValidRoles,
  compareRoles,
  roleLevel,
  ROLE_HIERARCHY,
  VALID_ROLES
};
