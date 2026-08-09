/**
 * /api/admin — Consolidated Admin Dashboard Handler
 * Merges: admin/index.js
 *
 * RBAC:
 *   GET    /api/admin?action=stats   — super_admin, admin, ketua_rayon, sekretaris, bendahara
 *   GET    /api/admin?action=kaders  — super_admin, admin, ketua_rayon, sekretaris
 *   POST   /api/admin                — super_admin, admin only
 */
const { query } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.query && typeof req.query.__path === 'string') {
    req.url = req.query.__path;
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const { action } = req.query;
      if (!requireRole(user, 'super_admin', 'admin', 'ketua_rayon', 'sekretaris', 'bendahara')) {
        return res.status(403).json({ error: 'Forbidden: Hanya pengurus inti' });
      }
      return await getDashboard(req, res, user);
    }
    if (req.method === 'POST') {
      if (!requireRole(user, 'super_admin', 'admin')) {
        return res.status(403).json({ error: 'Forbidden: Hanya super admin atau admin' });
      }
      return await adminAction(req, res, user);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getDashboard(req, res, user) {
  const { action } = req.query;

  if (action === 'stats') {
    const totalUsers = await query('SELECT COUNT(*) FROM users');
    const activeUsers = await query("SELECT COUNT(*) FROM users WHERE status = 'active'");
    const totalKader = await query("SELECT COUNT(*) FROM users WHERE role NOT IN ('super_admin','admin')");
    const totalsByRole = await query('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC');

    return res.status(200).json({
      total_users: parseInt(totalUsers.rows[0].count),
      active_users: parseInt(activeUsers.rows[0].count),
      total_kader: parseInt(totalKader.rows[0].count),
      totals_by_role: totalsByRole.rows
    });
  }

  if (action === 'kaders') {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.created_at,
              kp.nis, kp.jenis_kelamin, kp.universitas, kp.angkatan, kp.status_kader
       FROM users u
       LEFT JOIN kader_profiles kp ON u.id = kp.user_id
       WHERE u.role NOT IN ('super_admin','admin')
       ORDER BY u.created_at DESC`
    );
    return res.status(200).json(result.rows);
  }

  return res.status(400).json({ error: 'Invalid action. Use ?action=stats or ?action=kaders' });
}

async function adminAction(req, res, user) {
  const body = await readBody(req);
  const { action, user_id } = body || {};
  if (!action || !user_id) return res.status(400).json({ error: 'Action and user_id are required' });

  switch (action) {
    case 'activate':
      await query("UPDATE users SET status = 'active' WHERE id = $1", [user_id]);
      return res.status(200).json({ message: 'User activated' });
    case 'deactivate':
      await query("UPDATE users SET status = 'inactive' WHERE id = $1", [user_id]);
      return res.status(200).json({ message: 'User deactivated' });
    case 'suspend':
      await query("UPDATE users SET status = 'suspended' WHERE id = $1", [user_id]);
      return res.status(200).json({ message: 'User suspended' });
    default:
      return res.status(400).json({ error: 'Invalid action. Use activate, deactivate, or suspend' });
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (e) { resolve(null); }
    });
  });
}
