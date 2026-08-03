/**
 * /api/organization/*
 *
 * Organization Structure API.
 *
 * Returns structured organization hierarchy:
 *   - Leadership (ketua_rayon, sekretaris, bendahara)
 *   - Departments/Divisions with kabid, wakabid, anggota
 *
 * RBAC:
 *   GET    /api/organization          — All authenticated users
 *   POST   /api/organization          — super_admin, admin
 *   PUT    /api/organization/:id      — super_admin, admin
 *   DELETE /api/organization/:id      — super_admin, admin
 */

const { query } = require('../../lib/db');
const { requireAuth, requireRole } = require('../../lib/auth');
const { logAudit } = require('../../lib/audit');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';

  try {
    switch (req.method) {
      case 'GET':
        return await getOrganization(req, res);
      case 'POST':
        if (!requireRole(user, 'super_admin', 'admin'))
          return res.status(403).json({ error: 'Forbidden' });
        return await updateDivision(req, res, user, ip, ua);
      case 'PUT':
        if (!requireRole(user, 'super_admin', 'admin'))
          return res.status(403).json({ error: 'Forbidden' });
        return await updateMemberDiv(req, res, user, ip, ua);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Organization API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getOrganization(req, res) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/organization', '').split('/').filter(Boolean);
  const orgId = parts[0] || null;

  // Single member detail
  if (orgId) {
    const result = await query(
      `SELECT u.id, u.username, u.full_name, u.email, u.role, u.status,
              kp.foto_url, kp.universitas, kp.fakultas, kp.jurusan, kp.angkatan, kp.no_telepon,
              kp.division_id, kp.division_role, d.name AS division_name
       FROM users u
       LEFT JOIN kader_profiles kp ON u.id = kp.user_id
       LEFT JOIN divisions d ON kp.division_id = d.id
       WHERE u.id = $1`,
      [orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    return res.status(200).json(result.rows[0]);
  }

  // Get leadership (inti)
  const leadership = await query(
    `SELECT u.id, u.username, u.full_name, u.email, u.role, u.status,
            kp.foto_url, kp.universitas, kp.fakultas, kp.jurusan, kp.angkatan
     FROM users u
     LEFT JOIN kader_profiles kp ON u.id = kp.user_id
     WHERE u.role IN ('ketua_rayon', 'sekretaris', 'bendahara')
       AND u.status = 'active'
     ORDER BY
       CASE u.role
         WHEN 'ketua_rayon' THEN 1
         WHEN 'sekretaris' THEN 2
         WHEN 'bendahara' THEN 3
         ELSE 4
       END`
  );

  // Get divisions with kabid, wakabid, anggota
  const divisions = await query(
    `SELECT d.id, d.name, d.description, d.sort_order,
            json_agg(
              json_build_object(
                'id', u.id,
                'full_name', u.full_name,
                'username', u.username,
                'role', u.role,
                'division_role', kp.division_role,
                'foto_url', kp.foto_url,
                'universitas', kp.universitas,
                'fakultas', kp.fakultas,
                'jurusan', kp.jurusan,
                'angkatan', kp.angkatan
              ) ORDER BY
                CASE kp.division_role
                  WHEN 'kabid' THEN 1
                  WHEN 'wakabid' THEN 2
                  ELSE 3
                END,
                u.full_name
            ) FILTER (WHERE u.id IS NOT NULL) AS members
     FROM divisions d
     LEFT JOIN kader_profiles kp ON d.id = kp.division_id
     LEFT JOIN users u ON kp.user_id = u.id AND u.status = 'active'
     GROUP BY d.id, d.name, d.description, d.sort_order
     ORDER BY d.sort_order`
  );

  return res.status(200).json({
    leadership: leadership.rows,
    divisions: divisions.rows
  });
}

async function updateDivision(req, res, user, ip, ua) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  await new Promise(resolve => req.on('end', resolve));

  let data;
  try { data = JSON.parse(body); } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { user_id, division_id, division_role } = data;

  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  if (division_id !== undefined && division_id !== null) {
    const divCheck = await query('SELECT id FROM divisions WHERE id = $1', [division_id]);
    if (divCheck.rows.length === 0) return res.status(400).json({ error: 'Division not found' });
  }

  await query(
    'UPDATE kader_profiles SET division_id = $1, division_role = $2 WHERE user_id = $3',
    [division_id || null, division_role || 'anggota', user_id]
  );

  await logAudit(user.id, 'ORGANIZATION_UPDATE', 'kader_profiles', user_id, { division_id, division_role }, ip, ua);

  return res.status(200).json({ message: 'Division updated successfully' });
}

async function updateMemberDiv(req, res, user, ip, ua) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/organization', '').split('/').filter(Boolean);
  const id = parts[0];

  if (!id) return res.status(400).json({ error: 'ID required' });

  let body = '';
  req.on('data', chunk => { body += chunk; });
  await new Promise(resolve => req.on('end', resolve));

  let data;
  try { data = JSON.parse(body); } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { division_id, division_role, role } = data;

  if (role) {
    const validRoles = ['ketua_rayon', 'sekretaris', 'bendahara', 'kabid', 'wakabid', 'anggota', 'kader'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  }

  if (division_id !== undefined || division_role !== undefined) {
    const existing = await query('SELECT * FROM kader_profiles WHERE user_id = $1', [id]);
    if (existing.rows.length > 0) {
      await query(
        'UPDATE kader_profiles SET division_id = COALESCE($1, division_id), division_role = COALESCE($2, division_role) WHERE user_id = $3',
        [division_id || null, division_role || null, id]
      );
    } else {
      await query(
        'INSERT INTO kader_profiles (user_id, division_id, division_role) VALUES ($1, $2, $3)',
        [id, division_id || null, division_role || 'anggota']
      );
    }
  }

  await logAudit(user.id, 'ORGANIZATION_UPDATE_MEMBER', 'users', id, { division_id, division_role, role }, ip, ua);

  return res.status(200).json({ message: 'Member updated successfully' });
}
