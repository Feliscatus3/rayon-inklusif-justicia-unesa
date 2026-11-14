/**
 * /api/users — Consolidated User Management Handler
 *
 * Merges: api/users/index.js
 *
 * Dispatches on reconstructed URL pathname:
 *   GET    /api/users                    — List users (search + pagination)
 *   GET    /api/users/:id                — Get single user
 *   POST   /api/users                    — Create user
 *   PUT    /api/users/:id                — Update user
 *   DELETE /api/users/:id                — Delete user
 *   PATCH  /api/users/:id/password       — Reset password
 *   PATCH  /api/users/:id/status         — active / inactive / suspended / pending / rejected
 *   PATCH  /api/users/:id/role           — RBAC role update
 */

const { query } = require('../lib/db');
const bcrypt = require('bcrypt');
const { requireAuth, requireRole, hasAdminPrivilege, getValidRoles } = require('../lib/auth');
const { logAudit } = require('../lib/audit');

const VALID_ROLES = getValidRoles() || [
  'super_admin',
  'admin',
  'ketua_rayon',
  'sekretaris',
  'bendahara',
  'kabid',
  'wakabid',
  'kader',
  'anggota'
];

const VALID_STATUSES = ['active', 'inactive', 'suspended', 'pending', 'rejected'];

module.exports = async (req, res) => {
  // ── CORS ─────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Simpan URL asli beserta query string sebelum rekonstruksi path Vercel
  const originalUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Reconstruct the original request path from vercel.json rewrite TANPA menghilangkan query string
  if (req.query && typeof req.query.__path === 'string') {
    const rewrittenPath = req.query.__path.split('?')[0];
    req.url = rewrittenPath + originalUrl.search;
  }

  // ── Authenticate via shared middleware ──────────────────────
  const currentUser = await requireAuth(req, res);
  if (!currentUser) return;

  // ── Parse URL & Query Params Secara Akurat ──────────────────
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.replace(/^\/api\/users/, '').split('/').filter(Boolean);
  const userId = parts[0] || null;
  const action = parts[1] || null;

  try {
    // ═══════════════════════════════════════════════════════════
    // GET /api/users — List (search + filter + pagination)
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'GET' && !userId) {
      if (!hasAdminPrivilege(currentUser)) {
        return res.status(403).json({ error: 'Hanya admin' });
      }

      const search = (
        url.searchParams.get('search') ||
        url.searchParams.get('q') ||
        req.query?.search ||
        req.query?.q ||
        ''
      ).trim();

      const statusFilter = (
        url.searchParams.get('status') ||
        req.query?.status ||
        ''
      ).trim().toLowerCase();

      const rawPage = url.searchParams.get('page') || req.query?.page || '1';
      const rawLimit = url.searchParams.get('limit') || url.searchParams.get('per_page') || req.query?.limit || '10';

      const page = Math.max(1, parseInt(rawPage, 10) || 1);
      // Izinkan limit hingga 5000 agar pemuatan penuh (all users) maupun per halaman berjalan mulus
      const limit = Math.min(5000, Math.max(1, parseInt(rawLimit, 10) || 10));
      const offset = (page - 1) * limit;

      let countQ = 'SELECT COUNT(*)::int AS total FROM users WHERE 1=1';
      let dataQ = `SELECT id, username, full_name, email, phone, photo, role, privilege, status,
                          created_at, updated_at FROM users WHERE 1=1`;
      const params = [];
      let i = 1;

      if (search) {
        const cl = ` AND (username ILIKE $${i} OR full_name ILIKE $${i} OR email ILIKE $${i} OR COALESCE(phone, '') ILIKE $${i})`;
        countQ += cl;
        dataQ += cl;
        params.push(`%${search}%`);
        i++;
      }

      if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
        const cl = ` AND LOWER(status) = $${i}`;
        countQ += cl;
        dataQ += cl;
        params.push(statusFilter);
        i++;
      }

      const countRes = await query(countQ, params);
      const total = parseInt(countRes.rows[0].total, 10) || 0;

      dataQ += ` ORDER BY created_at ASC, id ASC LIMIT $${i} OFFSET $${i + 1}`;
      const dataParams = [...params, limit, offset];
      const dataRes = await query(dataQ, dataParams);

      return res.status(200).json({
        users: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit))
        }
      });
    }

    // ═══════════════════════════════════════════════════════════
    // GET /api/users/:id — Single user
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'GET' && userId && !action) {
      if (!hasAdminPrivilege(currentUser) && currentUser.id !== userId) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
      const r = await query(
        `SELECT id, username, full_name, email, phone, photo, role, privilege, status,
                created_at, updated_at FROM users WHERE id = $1`,
        [userId]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'Tidak ditemukan' });
      return res.status(200).json({ user: r.rows[0] });
    }

    // ═══════════════════════════════════════════════════════════
    // POST /api/users — Create
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'POST' && !userId) {
      if (!hasAdminPrivilege(currentUser)) {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      const { username, password, full_name, email, phone, role } = req.body || {};
      const errs = [];

      if (!username || typeof username !== 'string') errs.push('Username wajib');
      else if (!/^[a-z0-9_.-]{3,50}$/i.test(username.trim())) errs.push('Username 3-50 karakter (huruf, angka, _, ., -)');

      if (!password || typeof password !== 'string') errs.push('Password wajib');
      else if (password.length < 6) errs.push('Password minimal 6 karakter');

      if (!full_name || typeof full_name !== 'string' || !full_name.trim()) errs.push('Nama lengkap wajib');
      if (!email || typeof email !== 'string') errs.push('Email wajib');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.push('Format email tidak valid');

      const userRole = VALID_ROLES.includes(role) ? role : 'kader';
      const userPrivilege = userRole === 'super_admin' ? 'super_admin' : (userRole === 'admin' ? 'admin' : 'member');

      if (errs.length) return res.status(400).json({ error: errs.join('. ') });

      const dup = await query(
        'SELECT id FROM users WHERE LOWER(username)=$1 OR LOWER(email)=$2',
        [username.trim().toLowerCase(), email.trim().toLowerCase()]
      );
      if (dup.rows.length) return res.status(409).json({ error: 'Username/email sudah terdaftar' });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const r = await query(
        `INSERT INTO users (username, email, password_hash, full_name, phone, role, privilege, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         RETURNING id, username, full_name, email, phone, role, privilege, status, created_at`,
        [
          username.trim().toLowerCase(),
          email.trim().toLowerCase(),
          hash,
          full_name.trim(),
          phone ? String(phone).trim() : null,
          userRole,
          userPrivilege
        ]
      );

      await logAudit({
        userId: currentUser.id,
        action: 'USER_CREATED',
        ip,
        userAgent,
        details: JSON.stringify({ id: r.rows[0].id, username: r.rows[0].username })
      });

      return res.status(201).json({ message: 'Pengguna berhasil dibuat', user: r.rows[0] });
    }

    // ═══════════════════════════════════════════════════════════
    // PUT /api/users/:id — Update
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PUT' && userId && !action) {
      if (!hasAdminPrivilege(currentUser)) {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      const exists = await query('SELECT id FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      const { username, full_name, email, phone, role, password } = req.body || {};
      const sets = [];
      const vals = [];
      let i = 1;

      if (username && typeof username === 'string' && username.trim()) {
        const cleanUn = username.trim().toLowerCase();
        const dupUn = await query('SELECT id FROM users WHERE LOWER(username)=$1 AND id<>$2', [cleanUn, userId]);
        if (dupUn.rows.length) return res.status(409).json({ error: 'Username sudah digunakan pengguna lain' });
        sets.push(`username=$${i++}`);
        vals.push(cleanUn);
      }

      if (full_name && typeof full_name === 'string' && full_name.trim()) {
        sets.push(`full_name=$${i++}`);
        vals.push(full_name.trim());
      }

      if (email && typeof email === 'string' && email.trim()) {
        const cleanEm = email.trim().toLowerCase();
        const dupEm = await query('SELECT id FROM users WHERE LOWER(email)=$1 AND id<>$2', [cleanEm, userId]);
        if (dupEm.rows.length) return res.status(409).json({ error: 'Email sudah digunakan pengguna lain' });
        sets.push(`email=$${i++}`);
        vals.push(cleanEm);
      }

      if (phone !== undefined) {
        sets.push(`phone=$${i++}`);
        vals.push(phone ? String(phone).trim() : null);
      }

      if (role && VALID_ROLES.includes(role)) {
        const priv = role === 'super_admin' ? 'super_admin' : (role === 'admin' ? 'admin' : 'member');
        sets.push(`role=$${i++}`);
        vals.push(role);
        sets.push(`privilege=$${i++}`);
        vals.push(priv);
      }

      if (password && typeof password === 'string' && password.trim().length > 0) {
        if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        sets.push(`password_hash=$${i++}`);
        vals.push(hash);
      }

      if (!sets.length) return res.status(400).json({ error: 'Tidak ada data diubah' });

      vals.push(userId);
      const r = await query(
        `UPDATE users SET ${sets.join(',')} WHERE id=$${i}
         RETURNING id, username, full_name, email, phone, role, privilege, status, created_at, updated_at`,
        vals
      );

      await logAudit({
        userId: currentUser.id,
        action: 'USER_UPDATED',
        ip,
        userAgent,
        details: JSON.stringify({ id: userId, fields: sets.map(s => s.split('=')[0]) })
      });

      return res.status(200).json({ message: 'Berhasil diubah', user: r.rows[0] });
    }

    // ═══════════════════════════════════════════════════════════
    // DELETE /api/users/:id — Delete (admin only)
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'DELETE' && userId && !action) {
      if (!hasAdminPrivilege(currentUser)) {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      if (currentUser.id === userId) {
        return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
      }

      const exists = await query('SELECT id, username FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      await query('DELETE FROM users WHERE id=$1', [userId]);

      await logAudit({
        userId: currentUser.id,
        action: 'USER_DELETED',
        ip,
        userAgent,
        details: JSON.stringify({ id: userId, username: exists.rows[0].username })
      });

      return res.status(200).json({ message: 'Pengguna berhasil dihapus' });
    }

    // ═══════════════════════════════════════════════════════════
    // PATCH /api/users/:id/password — Reset password
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PATCH' && userId && action === 'password') {
      if (!hasAdminPrivilege(currentUser) && currentUser.id !== userId) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
      const { password } = req.body || {};
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter' });
      }

      const exists = await query('SELECT id FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, userId]);

      await logAudit({
        userId: currentUser.id,
        action: 'PASSWORD_RESET',
        ip,
        userAgent,
        details: JSON.stringify({ targetUserId: userId })
      });

      return res.status(200).json({ message: 'Password berhasil direset' });
    }

    // ═══════════════════════════════════════════════════════════
    // PATCH /api/users/:id/status — Set status
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PATCH' && userId && action === 'status') {
      if (!hasAdminPrivilege(currentUser)) {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      const { status } = req.body || {};
      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Status tidak valid' });
      }

      const exists = await query('SELECT id, username FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      const isActive = status === 'active';
      await query('UPDATE users SET status=$1, is_active=$2 WHERE id=$3', [status, isActive, userId]);

      await logAudit({
        userId: currentUser.id,
        action: 'STATUS_CHANGED',
        ip,
        userAgent,
        details: JSON.stringify({ targetUserId: userId, newStatus: status })
      });

      return res.status(200).json({ message: `Status berhasil diubah menjadi ${status}` });
    }

    // ═══════════════════════════════════════════════════════════
    // PATCH /api/users/:id/role — Change role
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PATCH' && userId && action === 'role') {
      if (!hasAdminPrivilege(currentUser)) {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      if (currentUser.id === userId) {
        return res.status(400).json({ error: 'Tidak bisa mengubah role sendiri' });
      }

      const { role } = req.body || {};
      if (!role || !VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Role tidak valid' });
      }

      const exists = await query('SELECT id, username FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      const newPrivilege = role === 'super_admin' ? 'super_admin' : (role === 'admin' ? 'admin' : 'member');
      await query('UPDATE users SET role=$1, privilege=$2 WHERE id=$3', [role, newPrivilege, userId]);

      await logAudit({
        userId: currentUser.id,
        action: 'ROLE_CHANGED',
        ip,
        userAgent,
        details: JSON.stringify({ targetUserId: userId, newRole: role })
      });

      return res.status(200).json({ message: `Role berhasil diubah menjadi ${role}` });
    }

    // ═══════════════════════════════════════════════════════════
    // Fallback — No matching route
    // ═══════════════════════════════════════════════════════════
    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });

  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan internal server' });
  }
};