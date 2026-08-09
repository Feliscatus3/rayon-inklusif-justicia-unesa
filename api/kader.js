/**
 * /api/kader — Consolidated Kader Handler
 *
 * Merges: api/kader/index.js + api/kader/profile.js
 *
 * Dispatches on reconstructed pathname:
 *   /api/kader             → kader list/create/update/delete
 *   /api/kader/profile     → own profile GET/PUT
 *
 * RBAC preserved from original implementation.
 */

const { query } = require('../lib/db');
const bcrypt = require('bcrypt');
const { requireAuth, requireRole } = require('../lib/auth');
const { logAudit } = require('../lib/audit');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Reconstruct path from vercel.json rewrite
  if (req.query && typeof req.query.__path === 'string') {
    req.url = req.query.__path;
  }
  const path = (req.url || '').split('?')[0];

  const user = await requireAuth(req, res);
  if (!user) return;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    // Profile sub-route
    if (path.endsWith('/profile')) {
      if (req.method === 'GET') return await getProfile(req, res, user);
      if (req.method === 'PUT') return await updateProfile(req, res, user);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Base kader routes
    switch (req.method) {
      case 'GET':
        return await getKader(req, res, user);
      case 'POST':
        if (!requireRole(user, 'super_admin', 'admin', 'ketua_rayon', 'sekretaris')) {
          return res.status(403).json({ error: 'Forbidden: Hanya super admin, admin, ketua rayon, atau sekretaris' });
        }
        return await createKader(req, res, user, ip, userAgent);
      case 'PUT':
        return await updateKader(req, res, user, ip, userAgent);
      case 'DELETE':
        if (!requireRole(user, 'super_admin', 'admin')) {
          return res.status(403).json({ error: 'Forbidden: Hanya super admin atau admin' });
        }
        return await deleteKader(req, res, user, ip, userAgent);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Kader API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/* ==================== Profile (from profile.js) ==================== */
async function getProfile(req, res, user) {
  const result = await query(
    `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.created_at,
            kp.nis, kp.tempat_lahir, kp.tanggal_lahir, kp.jenis_kelamin,
            kp.alamat, kp.no_telepon, kp.universitas, kp.fakultas, kp.jurusan,
            kp.angkatan, kp.status_kader, kp.foto_url
     FROM users u
     LEFT JOIN kader_profiles kp ON u.id = kp.user_id
     WHERE u.id = $1`,
    [user.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
  return res.status(200).json(result.rows[0]);
}

async function updateProfile(req, res, user) {
  const { full_name, email, ...profileData } = req.body;
  if (full_name || email) {
    const updates = [];
    const params = [];
    let idx = 1;
    if (full_name) { updates.push('full_name = $' + idx++); params.push(full_name); }
    if (email) { updates.push('email = $' + idx++); params.push(email); }
    if (updates.length > 0) { params.push(user.id); await query('UPDATE users SET ' + updates.join(', ') + ' WHERE id = $' + idx, params); }
  }
  const profileFields = ['nis', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'alamat', 'no_telepon', 'universitas', 'fakultas', 'jurusan', 'angkatan', 'status_kader', 'foto_url'];
  const profileUpdates = [];
  const profileParams = [];
  let pIdx = 1;
  for (const field of profileFields) {
    if (profileData[field] !== undefined) { profileUpdates.push(field + ' = $' + pIdx++); profileParams.push(profileData[field]); }
  }
  if (profileUpdates.length > 0) { profileParams.push(user.id); await query('UPDATE kader_profiles SET ' + profileUpdates.join(', ') + ' WHERE user_id = $' + pIdx, profileParams); }
  return res.status(200).json({ message: 'Profile updated successfully' });
}

/* ==================== Kader CRUD (from index.js) ==================== */
async function getKader(req, res, user) {
  const { id, search, page = 1, limit = 10 } = req.query;

  if (id) {
    const result = await query(
      'SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.created_at, kp.nis, kp.tempat_lahir, kp.tanggal_lahir, kp.jenis_kelamin, kp.alamat, kp.no_telepon, kp.universitas, kp.fakultas, kp.jurusan, kp.angkatan, kp.status_kader, kp.foto_url FROM users u LEFT JOIN kader_profiles kp ON u.id = kp.user_id WHERE u.id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kader tidak ditemukan' });
    return res.status(200).json(result.rows[0]);
  }

  const offset = (page - 1) * limit;
  var whereClause = "WHERE u.role IN ('kader','anggota','wakabid','kabid','bendahara','sekretaris','ketua_rayon')";
  var params = [];
  var pIdx = 1;

  if (search) {
    whereClause += ' AND (u.full_name ILIKE $' + pIdx + ' OR u.email ILIKE $' + (pIdx + 1) + ' OR kp.nis::text ILIKE $' + (pIdx + 2) + ')';
    var s = '%' + search + '%';
    params.push(s, s, s);
    pIdx += 3;
  }

  const countResult = await query('SELECT COUNT(*) FROM users u LEFT JOIN kader_profiles kp ON u.id = kp.user_id ' + whereClause, params);
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const dataResult = await query(
    'SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.created_at, kp.nis, kp.jenis_kelamin, kp.universitas, kp.fakultas, kp.angkatan, kp.status_kader, kp.foto_url FROM users u LEFT JOIN kader_profiles kp ON u.id = kp.user_id ' +
    whereClause + ' ORDER BY u.full_name ASC LIMIT $' + pIdx + ' OFFSET $' + (pIdx + 1),
    params
  );

  return res.status(200).json({
    data: dataResult.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, total_pages: Math.ceil(total / limit) }
  });
}

async function createKader(req, res, user, ip, userAgent) {
  const { username, email, password, full_name, role, ...profileData } = req.body;
  if (!username || !email || !password || !full_name) {
    return res.status(400).json({ error: 'Username, email, password, dan nama lengkap wajib diisi' });
  }
  const userRole = role || 'kader';
  const passwordHash = await bcrypt.hash(password, 10);
  const userResult = await query("INSERT INTO users (username, email, password_hash, full_name, role, status) VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id", [username, email, passwordHash, full_name, userRole]);
  const newUserId = userResult.rows[0].id;
  await query(
    'INSERT INTO kader_profiles (user_id, nis, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, no_telepon, universitas, fakultas, jurusan, angkatan, status_kader, foto_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
    [newUserId, profileData.nis || null, profileData.tempat_lahir || null, profileData.tanggal_lahir || null, profileData.jenis_kelamin || null, profileData.alamat || null, profileData.no_telepon || null, profileData.universitas || null, profileData.fakultas || null, profileData.jurusan || null, profileData.angkatan || null, profileData.status_kader || 'Aktif', profileData.foto_url || null]
  );
  await logAudit({ userId: user.id, action: 'KADER_CREATED', ip, userAgent, details: JSON.stringify({ id: newUserId, username }) });
  return res.status(201).json({ message: 'Kader created successfully', id: newUserId });
}

async function updateKader(req, res, user, ip, userAgent) {
  const { id, ...updateData } = req.body;
  if (!id) return res.status(400).json({ error: 'Kader ID is required' });
  if (!requireRole(user, 'super_admin', 'admin', 'ketua_rayon') && user.id !== id) {
    return res.status(403).json({ error: 'Forbidden: Cannot update other users' });
  }
  if (updateData.full_name || updateData.email) {
    const sets = []; const vals = []; var i = 1;
    if (updateData.full_name) { sets.push('full_name = $' + i++); vals.push(updateData.full_name); }
    if (updateData.email) { sets.push('email = $' + i++); vals.push(updateData.email); }
    if (sets.length > 0) { vals.push(id); await query('UPDATE users SET ' + sets.join(', ') + ' WHERE id = $' + i, vals); }
  }
  const fields = ['nis', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'alamat', 'no_telepon', 'universitas', 'fakultas', 'jurusan', 'angkatan', 'status_kader', 'foto_url'];
  var ps = []; var pv = []; var p = 1;
  for (var j = 0; j < fields.length; j++) {
    var field = fields[j];
    if (updateData[field] !== undefined) { ps.push(field + ' = $' + p++); pv.push(updateData[field]); }
  }
  if (ps.length > 0) { pv.push(id); await query('UPDATE kader_profiles SET ' + ps.join(', ') + ' WHERE user_id = $' + p, pv); }
  await logAudit({ userId: user.id, action: 'KADER_UPDATED', ip, userAgent, details: JSON.stringify({ id }) });
  return res.status(200).json({ message: 'Kader updated successfully' });
}

async function deleteKader(req, res, user, ip, userAgent) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Kader ID is required' });
  await query('DELETE FROM kader_profiles WHERE user_id = $1', [id]);
  await query('DELETE FROM users WHERE id = $1', [id]);
  await logAudit({ userId: user.id, action: 'KADER_DELETED', ip, userAgent, details: JSON.stringify({ id }) });
  return res.status(200).json({ message: 'Kader deleted successfully' });
}
