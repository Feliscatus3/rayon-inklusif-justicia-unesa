/**
 * /api/announcements — Consolidated Announcements Handler
 * Merges: announcements/index.js
 */
const { query } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');
const { logAudit } = require('../lib/audit');
const { corsMiddleware } = require('../lib/cors');
const { parseJsonBody } = require('../lib/bodyParser');
const csrf = require('../lib/csrf');
const sec = require('../lib/security');

const PINNED_LIMIT = 5;
const VALID_CATEGORIES = ['Umum', 'Kegiatan', 'Pendidikan', 'Organisasi', 'Kaderisasi', 'KOPRI', 'Lembaga', 'External'];

module.exports = async (req, res) => {
  if (corsMiddleware(req, res)) return;
  if (req.query && typeof req.query.__path === 'string') {
    req.url = req.query.__path;
  }

  // Public read access: GET is intentionally unauthenticated so published
  // announcements can be shown on the public homepage without a session.
  if (req.method === 'GET') {
    try {
      return await getAnnouncements(req, res);
    } catch (error) {
      console.error('Announcements API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  const user = await requireAuth(req, res);
  if (!user) return;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';

  try {
    switch (req.method) {
      case 'POST':
      case 'PUT':
      case 'PATCH':
      case 'DELETE':
        if (!csrf.validateCsrf(req)) {
          return res.status(403).json({ error: 'CSRF token tidak valid. Muat ulang halaman.' });
        }
        if (req.method === 'POST') {
          if (!requireRole(user, 'super_admin', 'admin', 'ketua_rayon', 'sekretaris')) {
            return res.status(403).json({ error: 'Forbidden: Hanya pengurus inti yang dapat membuat pengumuman' });
          }
          return await createAnnouncement(req, res, user, ip, ua);
        }
        if (req.method === 'PUT') {
          if (!requireRole(user, 'super_admin', 'admin', 'ketua_rayon', 'sekretaris')) {
            return res.status(403).json({ error: 'Forbidden: Hanya pengurus inti yang dapat mengedit pengumuman' });
          }
          return await updateAnnouncement(req, res, user, ip, ua);
        }
        if (req.method === 'PATCH') {
          if (!requireRole(user, 'super_admin', 'admin')) {
            return res.status(403).json({ error: 'Forbidden: Hanya super admin atau admin' });
          }
          return await togglePin(req, res, user, ip, ua);
        }
        if (req.method === 'DELETE') {
          if (!requireRole(user, 'super_admin', 'admin')) {
            return res.status(403).json({ error: 'Forbidden: Hanya super admin atau admin' });
          }
          return await deleteAnnouncement(req, res, user, ip, ua);
        }
        break;
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Announcements API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getAnnouncements(req, res) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/announcements', '').split('/').filter(Boolean);
  const annId = parts[0] || null;

  if (annId && parts[1] !== 'pin') {
    const result = await query(
      `SELECT a.*, u.full_name AS created_by_name, u.username AS created_by_username
       FROM announcements a JOIN users u ON a.created_by = u.id WHERE a.id = $1`,
      [annId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' });
    return res.status(200).json(result.rows[0]);
  }

  const category = url.searchParams.get('category');
  const pinned = url.searchParams.get('pinned');
  const search = url.searchParams.get('search');
  const limit = sec.clampInt(url.searchParams.get('limit'), 1, 200, 50);
  const offset = sec.clampInt(url.searchParams.get('offset'), 0, 100000, 0);

  let sql = `SELECT a.*, u.full_name AS created_by_name
             FROM announcements a JOIN users u ON a.created_by = u.id WHERE 1=1`;
  const params = [];
  let i = 1;

  if (category) { sql += ` AND a.category = $${i++}`; params.push(category); }
  if (pinned === 'true' || pinned === '1') sql += ' AND a.is_pinned = true';
  else if (pinned === 'false' || pinned === '0') sql += ' AND a.is_pinned = false';
  if (search) { sql += ` AND (a.title ILIKE $${i++} OR a.content ILIKE $${i++})`; const term = `%${search}%`; params.push(term, term); }

  sql += ' ORDER BY a.is_pinned DESC, a.created_at DESC, a.id DESC';
  sql += ` LIMIT $${i++} OFFSET $${i++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return res.status(200).json({ announcements: result.rows });
}

async function createAnnouncement(req, res, user, ip, ua) {
  const body = await parseJsonBody(req);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body. Untuk upload PDF gunakan form-data.' });

  const title = body.title !== undefined ? String(body.title).trim() : '';
  const content = body.content !== undefined ? String(body.content).trim() : '';
  const category = body.category || 'Umum';
  const isPinned = body.is_pinned === true || body.is_pinned === 'true' || body.is_pinned === '1';

  if (!title) return res.status(400).json({ error: 'Judul wajib diisi' });
  if (title.length > 255) return res.status(400).json({ error: 'Judul maksimal 255 karakter' });
  if (!content) return res.status(400).json({ error: 'Konten wajib diisi' });
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Kategori tidak valid' });

  let pinValue = isPinned;
  if (isPinned) {
    const pinnedCount = await query('SELECT COUNT(*) FROM announcements WHERE is_pinned = true');
    if (parseInt(pinnedCount.rows[0].count, 10) >= PINNED_LIMIT) {
      return res.status(400).json({ error: `Maksimal ${PINNED_LIMIT} pengumuman dapat disematkan` });
    }
  }

  const result = await query(
    `INSERT INTO announcements (title, content, category, is_pinned, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, content, category, pinValue, user.id]
  );

  await logAudit({ userId: user.id, action: 'ANNOUNCEMENT_CREATED', ip, userAgent: ua, details: JSON.stringify({ id: result.rows[0].id, title: result.rows[0].title }) });
  return res.status(201).json({ message: 'Pengumuman berhasil dibuat', announcement: result.rows[0] });
}

async function updateAnnouncement(req, res, user, ip, ua) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/announcements', '').split('/').filter(Boolean);
  const annId = parts[0];
  if (!annId) return res.status(400).json({ error: 'ID pengumuman diperlukan' });

  const body = await parseJsonBody(req);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });

  const existing = await query('SELECT * FROM announcements WHERE id = $1', [annId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' });

  const title = body.title !== undefined ? String(body.title).trim() : existing.rows[0].title;
  const content = body.content !== undefined ? String(body.content).trim() : existing.rows[0].content;
  const category = body.category || existing.rows[0].category;
  const isPinned = body.is_pinned !== undefined ? (body.is_pinned === true || body.is_pinned === 'true' || body.is_pinned === '1') : existing.rows[0].is_pinned;

  if (!title) return res.status(400).json({ error: 'Judul wajib diisi' });
  if (title.length > 255) return res.status(400).json({ error: 'Judul maksimal 255 karakter' });
  if (!content) return res.status(400).json({ error: 'Konten wajib diisi' });
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Kategori tidak valid' });

  if (isPinned && !existing.rows[0].is_pinned) {
    const pinnedCount = await query('SELECT COUNT(*) FROM announcements WHERE is_pinned = true');
    if (parseInt(pinnedCount.rows[0].count, 10) >= PINNED_LIMIT) {
      return res.status(400).json({ error: `Maksimal ${PINNED_LIMIT} pengumuman dapat disematkan` });
    }
  }

  const result = await query(
    `UPDATE announcements SET title = $1, content = $2, category = $3, is_pinned = $4, updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [title, content, category, isPinned, annId]
  );

  await logAudit({ userId: user.id, action: 'ANNOUNCEMENT_UPDATED', ip, userAgent: ua, details: JSON.stringify({ id: annId, title: result.rows[0].title }) });
  return res.status(200).json({ message: 'Pengumuman berhasil diperbarui', announcement: result.rows[0] });
}

async function togglePin(req, res, user, ip, ua) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/announcements', '').split('/').filter(Boolean);
  const annId = parts[0];
  if (!annId) return res.status(400).json({ error: 'ID pengumuman diperlukan' });

  const existing = await query('SELECT id, is_pinned FROM announcements WHERE id = $1', [annId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' });

  const newPin = !existing.rows[0].is_pinned;
  if (newPin) {
    const pinnedCount = await query('SELECT COUNT(*) FROM announcements WHERE is_pinned = true');
    if (parseInt(pinnedCount.rows[0].count, 10) >= PINNED_LIMIT) {
      return res.status(400).json({ error: `Maksimal ${PINNED_LIMIT} pengumuman dapat disematkan` });
    }
  }

  await query('UPDATE announcements SET is_pinned = $1 WHERE id = $2', [newPin, annId]);
  await logAudit({ userId: user.id, action: newPin ? 'ANNOUNCEMENT_PINNED' : 'ANNOUNCEMENT_UNPINNED', ip, userAgent: ua, details: JSON.stringify({ id: annId }) });
  return res.status(200).json({ message: newPin ? 'Pengumuman disematkan' : 'Pengumuman dilepas dari sematan' });
}

async function deleteAnnouncement(req, res, user, ip, ua) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/announcements', '').split('/').filter(Boolean);
  const annId = parts[0];
  if (!annId) return res.status(400).json({ error: 'ID pengumuman diperlukan' });

  const existing = await query('SELECT id, title FROM announcements WHERE id = $1', [annId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' });

  await query('DELETE FROM announcements WHERE id = $1', [annId]);
  await logAudit({ userId: user.id, action: 'ANNOUNCEMENT_DELETED', ip, userAgent: ua, details: JSON.stringify({ id: annId, title: existing.rows[0].title }) });
  return res.status(200).json({ message: 'Pengumuman berhasil dihapus' });
}

