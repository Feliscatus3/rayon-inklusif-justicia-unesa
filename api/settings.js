/**
 * /api/settings — Consolidated Website Settings Handler
 * Merges: settings/index.js
 */
const { query } = require('../lib/db');
const { requireAuth, hasAdminPrivilege } = require('../lib/auth');
const { logAudit } = require('../lib/audit');
const csrf = require('../lib/csrf');

const DEFAULTS = {
  site_name: 'Kader Panel',
  site_logo: null,
  site_favicon: null,
  org_name: 'PMII Rayon Inklusif Justicia',
  org_address: null,
  org_instagram: null,
  org_whatsapp: null,
  org_email: null,
  default_dark_mode: false,
  login_background: null
};

const MAX_DATA_URI_LENGTH = 3 * 1024 * 1024; // ~3MB base64 string limit

module.exports = async (req, res) => {
  const originalUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.query && typeof req.query.__path === 'string') {
    const cleanPath = req.query.__path.split('?')[0];
    req.url = cleanPath + originalUrl.search;
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      return await getSettings(req, res);
    }
    if (req.method === 'PUT') {
      if (csrf && typeof csrf.validateCsrf === 'function' && !csrf.validateCsrf(req)) {
        return res.status(403).json({ error: 'CSRF token tidak valid' });
      }
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!hasAdminPrivilege(user)) {
        return res.status(403).json({ error: 'Forbidden: Hanya super admin atau admin' });
      }
      return await updateSettings(req, res, user);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getSettings(req, res) {
  const result = await query('SELECT * FROM settings WHERE id = 1');
  if (result.rows.length === 0) {
    return res.status(200).json({ settings: { ...DEFAULTS } });
  }
  const row = result.rows[0];
  return res.status(200).json({
    settings: {
      site_name: row.site_name || DEFAULTS.site_name,
      site_logo: row.site_logo || null,
      site_favicon: row.site_favicon || null,
      org_name: row.org_name || DEFAULTS.org_name,
      org_address: row.org_address || null,
      org_instagram: row.org_instagram || null,
      org_whatsapp: row.org_whatsapp || null,
      org_email: row.org_email || null,
      default_dark_mode: !!row.default_dark_mode,
      login_background: row.login_background || null,
      updated_at: row.updated_at || null
    }
  });
}

async function updateSettings(req, res, user) {
  const data = await readBody(req);
  if (data === null || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const clean = (v, max) => {
    if (v === undefined || v === null) return null;
    if (typeof v !== 'string') return String(v);
    const trimmed = v.trim();
    if (!trimmed) return null;
    return max && trimmed.length > max ? trimmed.slice(0, max) : trimmed;
  };

  const validateMedia = (v) => {
    if (v === null || v === undefined || v === '') return true;
    if (typeof v !== 'string') return false;
    if (v.length > MAX_DATA_URI_LENGTH) return false;
    return /^(data:image\/[a-zA-Z0-9.+-]+;base64,|https?:\/\/|\/)/.test(v);
  };

  const siteName = data.site_name !== undefined && data.site_name !== null
    ? String(data.site_name).trim().slice(0, 100)
    : DEFAULTS.site_name;
  if (!siteName) return res.status(400).json({ error: 'Nama Website wajib diisi' });

  const orgName = data.org_name !== undefined && data.org_name !== null
    ? String(data.org_name).trim().slice(0, 150)
    : DEFAULTS.org_name;
  if (!orgName) return res.status(400).json({ error: 'Nama Organisasi wajib diisi' });

  const fields = {
    site_logo: clean(data.site_logo),
    site_favicon: clean(data.site_favicon),
    org_address: clean(data.org_address, 500),
    org_instagram: clean(data.org_instagram, 100),
    org_whatsapp: clean(data.org_whatsapp, 30),
    org_email: clean(data.org_email, 100),
    login_background: clean(data.login_background)
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && !validateMedia(value)) {
      return res.status(400).json({ error: `${key.replace(/_/g, ' ')} tidak valid atau ukuran melebihi batas` });
    }
  }

  if (fields.org_whatsapp) {
    const normalizedWa = fields.org_whatsapp.replace(/[\s()-]/g, '');
    if (!/^\+?[0-9]{8,18}$/.test(normalizedWa)) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid (gunakan 8-18 digit angka)' });
    }
  }

  if (fields.org_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.org_email)) {
    return res.status(400).json({ error: 'Format email tidak valid' });
  }

  const defaultDarkMode = data.default_dark_mode === true || data.default_dark_mode === 'true';

  const existing = await query('SELECT id FROM settings WHERE id = 1');
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const auditDetails = { site_name: siteName, org_name: orgName };

  let result;
  if (existing.rows.length > 0) {
    result = await query(
      `UPDATE settings
       SET site_name=$1, site_logo=$2, site_favicon=$3, org_name=$4, org_address=$5,
           org_instagram=$6, org_whatsapp=$7, org_email=$8, default_dark_mode=$9,
           login_background=$10, updated_at=NOW(), updated_by=$11
       WHERE id = 1
       RETURNING *`,
      [
        siteName,
        fields.site_logo,
        fields.site_favicon,
        orgName,
        fields.org_address,
        fields.org_instagram,
        fields.org_whatsapp,
        fields.org_email,
        defaultDarkMode,
        fields.login_background,
        user.id
      ]
    );
  } else {
    result = await query(
      `INSERT INTO settings
       (id, site_name, site_logo, site_favicon, org_name, org_address, org_instagram, org_whatsapp, org_email, default_dark_mode, login_background, updated_by)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        siteName,
        fields.site_logo,
        fields.site_favicon,
        orgName,
        fields.org_address,
        fields.org_instagram,
        fields.org_whatsapp,
        fields.org_email,
        defaultDarkMode,
        fields.login_background,
        user.id
      ]
    );
  }

  await logAudit({
    userId: user.id,
    action: 'SETTINGS_UPDATED',
    ip,
    userAgent,
    details: JSON.stringify(auditDetails)
  });

  const saved = result.rows[0];
  return res.status(200).json({
    message: 'Pengaturan berhasil disimpan',
    settings: {
      site_name: saved.site_name,
      site_logo: saved.site_logo,
      site_favicon: saved.site_favicon,
      org_name: saved.org_name,
      org_address: saved.org_address,
      org_instagram: saved.org_instagram,
      org_whatsapp: saved.org_whatsapp,
      org_email: saved.org_email,
      default_dark_mode: !!saved.default_dark_mode,
      login_background: saved.login_background,
      updated_at: saved.updated_at
    }
  });
}

function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return Promise.resolve(req.body);
    if (typeof req.body === 'string') {
      try { return Promise.resolve(JSON.parse(req.body || '{}')); } catch (e) { return Promise.resolve(null); }
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (e) { resolve(null); }
    });
    req.on('error', () => resolve(null));
  });
}