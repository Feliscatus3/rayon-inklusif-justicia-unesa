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
 *   PATCH  /api/users/:id/status         — active / inactive / suspended
 *   PATCH  /api/users/:id/role           — admin / kader
 */

const { query } = require('../lib/db');
const bcrypt = require('bcrypt');
const { requireAuth, requireRole, getValidRoles } = require('../lib/auth');
const { logAudit } = require('../lib/audit');
const VALID_ROLES = getValidRoles();

module.exports = async (req, res) => {
  // ── CORS ─────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Reconstruct the original request path from vercel.json rewrite
  if (req.query && typeof req.query.__path === 'string') {
    req.url = req.query.__path;
  }

  // ── Authenticate via shared middleware ──────────────────────
  const currentUser = await requireAuth(req, res);
  if (!currentUser) return;

  // ── Parse URL ───────────────────────────────────────────────
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.replace('/api/users', '').split('/').filter(Boolean);
  const userId = parts[0] || null;
  const action = parts[1] || null;

  try {
    // ═══════════════════════════════════════════════════════════
    // GET /api/users — List (search + pagination)
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'GET' && !userId) {
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      const search = url.searchParams.get('search') || '';
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));
      const offset = (page - 1) * limit;

      let countQ = 'SELECT COUNT(*) FROM users WHERE 1=1';
      let dataQ = `SELECT id, username, full_name, email, phone, photo, role, status,
                          created_at, updated_at FROM users WHERE 1=1`;
      const params = [];
      let i = 1;

      if (search) {
        const cl = ` AND (username ILIKE $${i} OR full_name ILIKE $${i} OR email ILIKE $${i})`;
        countQ += cl; dataQ += cl;
        params.push(`%${search}%`);
        i++;
      }

      const countRes = await query(countQ, params);
      const total = parseInt(countRes.rows[0].count, 10);

      dataQ += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i+1}`;
      params.push(limit, offset);
      const dataRes = await query(dataQ, params);

      return res.status(200).json({
        users: dataRes.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }

    // ═══════════════════════════════════════════════════════════
    // GET /api/users/:id — Single user
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'GET' && userId && !action) {
      if (currentUser.role !== 'admin' && currentUser.id !== userId) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
      const r = await query(
        `SELECT id, username, full_name, email, phone, photo, role, status,
                created_at, updated_at FROM users WHERE id = $1`,
        [userId]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'Tidak ditemukan' });
      return res.status(200).json({ user: r.rows[0] });
    }

    // ═══════════════════════════════════════════════════════════
    // POST /api/users — Create
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'POST') {
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      const { username, password, full_name, email, phone, role } = req.body || {};
      const errs = [];

      if (!username || typeof username !== 'string') errs.push('Username wajib');
      else if (!/^[a-z0-9_.-]{3,50}$/i.test(username)) errs.push('Username 3-50 karakter (huruf, angka, _, ., -)');

      if (!password || typeof password !== 'string') errs.push('Password wajib');
      else if (password.length < 6) errs.push('Password minimal 6 karakter');

      if (!full_name || typeof full_name !== 'string' || !full_name.trim()) errs.push('Nama lengkap wajib');
      if (!email || typeof email !== 'string') errs.push('Email wajib');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Format email tidak valid');

      const userRole = role === 'admin' ? 'admin' : 'kader';
      if (errs.length) return res.status(400).json({ error: errs.join('. ') });

      const dup = await query('SELECT id FROM users WHERE username=$1 OR email=$2',
        [username.trim().toLowerCase(), email.trim().toLowerCase()]);
      if (dup.rows.length) return res.status(409).json({ error: 'Username/email sudah terdaftar' });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const r = await query(
        `INSERT INTO users (username,email,password_hash,full_name,phone,role,status)
         VALUES ($1,$2,$3,$4,$5,$6,'active')
         RETURNING id,username,full_name,email,phone,role,status,created_at`,
        [username.trim().toLowerCase(), email.trim().toLowerCase(), hash,
         full_name.trim(), phone || null, userRole]
      );

      await logAudit({
        userId: currentUser.id, action: 'USER_CREATED', ip, userAgent,
        details: JSON.stringify({ id: r.rows[0].id, username: r.rows[0].username })
      });

      return res.status(201).json({ message: 'Pengguna berhasil dibuat', user: r.rows[0] });
    }

    // ═══════════════════════════════════════════════════════════
    // PUT /api/users/:id — Update
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PUT' && userId && !action) {
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      const exists = await query('SELECT id FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      const { full_name, email, phone } = req.body || {};
      const sets = [];
      const vals = [];
      let i = 1;

      if (full_name && typeof full_name === 'string') { sets.push(`full_name=$${i++}`); vals.push(full_name.trim()); }
      if (email && typeof email === 'string') { sets.push(`email=$${i++}`); vals.push(email.trim().toLowerCase()); }
      if (phone !== undefined) { sets.push(`phone=$${i++}`); vals.push(phone || null); }

      if (!sets.length) return res.status(400).json({ error: 'Tidak ada data diubah' });

      vals.push(userId);
      const r = await query(
        `UPDATE users SET ${sets.join(',')} WHERE id=$${i}
         RETURNING id,username,full_name,email,phone,role,status,created_at,updated_at`,
        vals
      );

      await logAudit({
        userId: currentUser.id, action: 'USER_UPDATED', ip, userAgent,
        details: JSON.stringify({ id: userId, fields: sets.map(s => s.split('=')[0]) })
      });

      return res.status(200).json({ message: 'Berhasil diubah', user: r.rows[0] });
    }

    // ═══════════════════════════════════════════════════════════
    // DELETE /api/users/:id — Delete (admin only)
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'DELETE' && userId && !action) {
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      if (currentUser.id === userId) {
        return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
      }

      const exists = await query('SELECT id,username FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      await query('DELETE FROM users WHERE id=$1', [userId]);

      await logAudit({
        userId: currentUser.id, action: 'USER_DELETED', ip, userAgent,
        details: JSON.stringify({ id: userId, username: exists.rows[0].username })
      });

      return res.status(200).json({ message: 'Pengguna berhasil dihapus' });
    }

    // ═══════════════════════════════════════════════════════════
    // PATCH /api/users/:id/password — Reset password
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PATCH' && userId && action === 'password') {
      if (currentUser.role !== 'admin' && currentUser.id !== userId) {
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
        userId: currentUser.id, action: 'PASSWORD_RESET', ip, userAgent,
        details: JSON.stringify({ targetUserId: userId })
      });

      return res.status(200).json({ message: 'Password berhasil direset' });
    }

    // ═══════════════════════════════════════════════════════════
    // PATCH /api/users/:id/status — Set status (active/inactive/suspended)
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PATCH' && userId && action === 'status') {
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      const { status } = req.body || {};
      const valid = ['active', 'inactive', 'suspended'];
      if (!status || !valid.includes(status)) {
        return res.status(400).json({ error: 'Status harus active, inactive, atau suspended' });
      }

      const exists = await query('SELECT id,username FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      await query('UPDATE users SET status=$1 WHERE id=$2', [status, userId]);

      await logAudit({
        userId: currentUser.id, action: 'STATUS_CHANGED', ip, userAgent,
        details: JSON.stringify({ targetUserId: userId, newStatus: status })
      });

      return res.status(200).json({ message: `Status berhasil diubah menjadi ${status}` });
    }

    // ═══════════════════════════════════════════════════════════
    // PATCH /api/users/:id/role — Change role (admin/kader)
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PATCH' && userId && action === 'role') {
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin' });
      }
      if (currentUser.id === userId) {
        return res.status(400).json({ error: 'Tidak bisa mengubah role sendiri' });
      }

      const { role } = req.body || {};
      if (!role || !['admin', 'kader'].includes(role)) {
        return res.status(400).json({ error: 'Role harus admin atau kader' });
      }

      const exists = await query('SELECT id,username FROM users WHERE id=$1', [userId]);
      if (!exists.rows.length) return res.status(404).json({ error: 'Tidak ditemukan' });

      await query('UPDATE users SET role=$1 WHERE id=$2', [role, userId]);

      await logAudit({
        userId: currentUser.id, action: 'ROLE_CHANGED', ip, userAgent,
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
