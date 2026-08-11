/**
 * /api/events — Consolidated Calendar Events Handler
 * Merges: events/index.js
 */
const { query } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');
const { logAudit } = require('../lib/audit');
const { corsMiddleware } = require('../lib/cors');
const { parseJsonBody } = require('../lib/bodyParser');
const csrf = require('../lib/csrf');
const sec = require('../lib/security');

module.exports = async (req, res) => {
  if (corsMiddleware(req, res)) return;
  if (req.query && typeof req.query.__path === 'string') {
    req.url = req.query.__path;
  }

  // Calendar is a kader-panel feature. Only authenticated users may read events.
  const user = await requireAuth(req, res);
  if (!user) return;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    switch (req.method) {
      case 'GET':
        return await getEvents(req, res);
      case 'POST':
      case 'PUT':
      case 'DELETE':
        if (!csrf.validateCsrf(req)) {
          return res.status(403).json({ error: 'CSRF token tidak valid' });
        }
        if (req.method === 'POST') {
          if (!requireRole(user, 'admin', 'super_admin')) {
            return res.status(403).json({ error: 'Forbidden: Hanya admin atau super admin yang dapat membuat event' });
          }
          return await createEvent(req, res, user, ip, userAgent);
        }
        if (req.method === 'PUT') {
          if (!requireRole(user, 'admin', 'super_admin')) {
            return res.status(403).json({ error: 'Forbidden: Hanya admin atau super admin yang dapat mengedit event' });
          }
          return await updateEvent(req, res, user, ip, userAgent);
        }
        if (req.method === 'DELETE') {
          if (!requireRole(user, 'admin', 'super_admin')) {
            return res.status(403).json({ error: 'Forbidden: Hanya admin atau super admin yang dapat menghapus event' });
          }
          return await deleteEvent(req, res, user, ip, userAgent);
        }
        break;
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Events API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getEvents(req, res) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/events', '').split('/').filter(Boolean);
  const eventId = parts[0] || null;

  if (eventId) {
    const result = await query(
      'SELECT e.*, to_char(e.event_date, \'YYYY-MM-DD\') AS event_date, u.full_name AS created_by_name, u.username AS created_by_username FROM events e JOIN users u ON e.created_by = u.id WHERE e.id = $1',
      [eventId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event tidak ditemukan' });
    return res.status(200).json(result.rows[0]);
  }

  const month = url.searchParams.get('month');
  const year = url.searchParams.get('year');
  const category = url.searchParams.get('category');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

  let sql = 'SELECT e.*, to_char(e.event_date, \'YYYY-MM-DD\') AS event_date, u.full_name AS created_by_name FROM events e JOIN users u ON e.created_by = u.id WHERE 1=1';
  let params = [];
  let i = 1;

  if (month && year) {
    sql += ' AND EXTRACT(MONTH FROM e.event_date) = $' + i++;
    params.push(month);
    sql += ' AND EXTRACT(YEAR FROM e.event_date) = $' + i++;
    params.push(year);
  } else if (startDate && endDate) {
    sql += ' AND e.event_date >= $' + i++ + ' AND e.event_date <= $' + i++;
    params.push(startDate, endDate);
  }

  if (category) {
    sql += ' AND e.category = $' + i++;
    params.push(category);
  }

  sql += ' ORDER BY e.event_date ASC, e.event_time ASC';

  const result = await query(sql, params);
  return res.status(200).json(result.rows);
}

async function createEvent(req, res, user, ip, userAgent) {
  const body = await parseJsonBody(req);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });
  const { title, description, category, location, event_date, event_time, color } = body;

  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Judul event wajib diisi' });
  if (!sec.isValidDate(event_date)) return res.status(400).json({ error: 'Tanggal event tidak valid' });
  if (event_time && !sec.isValidTime(event_time)) return res.status(400).json({ error: 'Waktu event tidak valid' });
  if (color && !sec.isValidColor(color)) return res.status(400).json({ error: 'Warna event tidak valid' });

  const validCategories = ['PMII', 'Rayon', 'Komisariat', 'BEM', 'DPM', 'Faculty', 'University', 'External'];
  const eventCategory = category && validCategories.includes(category) ? category : 'Rayon';

  const result = await query(
    'INSERT INTO events (title, description, category, location, event_date, event_time, color, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [String(title).trim(), description || null, eventCategory, location || null, event_date, event_time || null, color || '#1a237e', user.id]
  );

  await logAudit({ userId: user.id, action: 'EVENT_CREATED', ip, userAgent, details: JSON.stringify({ id: result.rows[0].id, title: result.rows[0].title }) });
  return res.status(201).json({ message: 'Event berhasil dibuat', event: result.rows[0] });
}

async function updateEvent(req, res, user, ip, userAgent) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/events', '').split('/').filter(Boolean);
  const eventId = parts[0];
  if (!eventId) return res.status(400).json({ error: 'Event ID diperlukan' });

  const existing = await query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Event tidak ditemukan' });

  const body = await parseJsonBody(req);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });
  const { title, description, category, location, event_date, event_time, color } = body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Judul event wajib diisi' });
  if (!event_date) return res.status(400).json({ error: 'Tanggal event wajib diisi' });

  const validCategories = ['PMII', 'Rayon', 'Komisariat', 'BEM', 'DPM', 'Faculty', 'University', 'External'];
  const eventCategory = category && validCategories.includes(category) ? category : existing.rows[0].category;

  const result = await query(
    'UPDATE events SET title=$1, description=$2, category=$3, location=$4, event_date=$5, event_time=$6, color=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
    [title.trim(), description !== undefined ? description : existing.rows[0].description, eventCategory,
     location !== undefined ? location : existing.rows[0].location, event_date,
     event_time !== undefined ? event_time : existing.rows[0].event_time,
     color || existing.rows[0].color, eventId]
  );

  await logAudit({ userId: user.id, action: 'EVENT_UPDATED', ip, userAgent, details: JSON.stringify({ id: eventId, title: result.rows[0].title }) });
  return res.status(200).json({ message: 'Event berhasil diperbarui', event: result.rows[0] });
}

async function deleteEvent(req, res, user, ip, userAgent) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/events', '').split('/').filter(Boolean);
  const eventId = parts[0];
  if (!eventId) return res.status(400).json({ error: 'Event ID diperlukan' });

  const existing = await query('SELECT id, title FROM events WHERE id = $1', [eventId]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Event tidak ditemukan' });

  await query('DELETE FROM events WHERE id = $1', [eventId]);
  await logAudit({ userId: user.id, action: 'EVENT_DELETED', ip, userAgent, details: JSON.stringify({ id: eventId, title: existing.rows[0].title }) });
  return res.status(200).json({ message: 'Event berhasil dihapus' });
}
