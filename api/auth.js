/**
 * /api/auth — Consolidated Authentication Handler
 *
 * Merges: login.js, logout.js, me.js
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 */

const { query } = require('../lib/db');
const bcrypt = require('bcrypt');
const cookie = require('cookie');
const crypto = require('crypto');
const { loginLimiter } = require('../lib/rateLimiter');
const { logAudit } = require('../lib/audit');
const { corsMiddleware } = require('../lib/cors');
const { parseJsonBody } = require('../lib/bodyParser');
const { requireAuth } = require('../lib/auth');
const csrf = require('../lib/csrf');

module.exports = async (req, res) => {
  if (corsMiddleware(req, res)) return;

  if (req.query && typeof req.query.__path === 'string') {
    req.url = req.query.__path;
  }

  const path = (req.url || '').split('?')[0];

  try {
    if (path.endsWith('/login')) return handleLogin(req, res);
    if (path.endsWith('/logout')) return handleLogout(req, res);
    if (path.endsWith('/me')) return handleMe(req, res);
    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/* ==================== POST /api/auth/login ==================== */
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const body = await parseJsonBody(req);
  if (body === null) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  let username = body.username;
  let password = body.password;

  if (typeof username === 'string') {
    username = username.trim().toLowerCase().slice(0, 50);
  }
  if (typeof password === 'string') {
    password = password.slice(0, 128);
  }

  const errors = [];
  if (!username || username.length === 0) errors.push('Username wajib diisi');
  else if (!/^[a-z0-9_@.+-]+$/.test(username)) errors.push('Username mengandung karakter tidak valid');

  if (!password || password.length === 0) errors.push('Password wajib diisi');
  else if (password.length < 6) errors.push('Password minimal 6 karakter');

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  const rateCheck = loginLimiter.check(ip);
  if (!rateCheck.allowed) {
    const retryAfter = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    await logAudit({
      action: 'LOGIN_RATE_LIMITED',
      ip, userAgent, username,
      details: JSON.stringify({ reason: 'rate_limit_exceeded' })
    });
    return res.status(429).json({
      error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`
    });
  }

  const userResult = await query(
    'SELECT id, username, email, password_hash, full_name, role, status, is_active FROM users WHERE username = $1',
    [username]
  );

  if (userResult.rows.length === 0) {
    await logAudit({ action: 'LOGIN_FAILED', ip, userAgent, username, details: JSON.stringify({ reason: 'user_not_found' }) });
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  const user = userResult.rows[0];
  const userStatus = user.status || (user.is_active ? 'active' : 'inactive');
  if (userStatus !== 'active') {
    await logAudit({ userId: user.id, action: 'LOGIN_FAILED', ip, userAgent, username, details: JSON.stringify({ reason: 'account_deactivated' }) });
    return res.status(403).json({ error: 'Akun dinonaktifkan. Hubungi administrator.' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    await logAudit({ userId: user.id, action: 'LOGIN_FAILED', ip, userAgent, username, details: JSON.stringify({ reason: 'wrong_password' }) });
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  await query('DELETE FROM sessions WHERE user_id = $1', [user.id]);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt]
  );

  res.append('Set-Cookie', cookie.serialize('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  }));

  try {
    const csrfToken = csrf.issueCsrfToken(res);
    res.setHeader('X-CSRF-Token', csrfToken);
  } catch (csrfErr) {
    console.error('CSRF token issuance failed (non-fatal):', csrfErr.message);
  }

  await logAudit({ userId: user.id, action: 'LOGIN_SUCCESS', ip, userAgent, username, details: JSON.stringify({ role: user.role }) });
  loginLimiter.reset(ip);

  return res.status(200).json({
    message: 'Login berhasil',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status || 'active'
    }
  });
}

/* ==================== POST /api/auth/logout ==================== */
async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!csrf.validateCsrf(req)) {
    return res.status(403).json({ error: 'CSRF token tidak valid. Muat ulang halaman.' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.session_token;

  let userId = null;
  let username = null;

  if (token) {
    const sessionResult = await query(
      'SELECT s.user_id, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1',
      [token]
    );
    if (sessionResult.rows.length > 0) {
      userId = sessionResult.rows[0].user_id;
      username = sessionResult.rows[0].username;
    }
    await query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  await logAudit({ userId, action: 'LOGOUT', ip, userAgent, username });

  res.append('Set-Cookie', cookie.serialize('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: -1,
    path: '/'
  }));

  res.append('Set-Cookie', cookie.serialize(csrf.COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: -1,
    path: '/'
  }));

  return res.status(200).json({ message: 'Logout berhasil' });
}

/* ==================== GET /api/auth/me ==================== */
async function handleMe(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const existingCookie = csrf.parseCookies(req.headers.cookie || '')[csrf.COOKIE_NAME];
    if (!existingCookie) {
      csrf.issueCsrfToken(res);
    }
  } catch (csrfErr) {
    console.error('CSRF issuance in /auth/me failed (non-fatal):', csrfErr.message);
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status
    }
  });
}
