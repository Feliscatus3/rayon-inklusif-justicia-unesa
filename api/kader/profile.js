/**
 * /api/kader/profile.js
 * RBAC-aware profile API. Uses shared requireAuth.
 * GET  — Returns own profile
 * PUT  — Updates own profile (any authenticated user)
 */
const { query } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') return await getProfile(req, res, user);
    if (req.method === 'PUT') return await updateProfile(req, res, user);
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

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
