const { query } = require('../../lib/db');
const cookie = require('cookie');
const { logAudit } = require('../../lib/audit');
const { corsMiddleware } = require('../../lib/cors');
const csrf = require('../../lib/csrf');

module.exports = async (req, res) => {
  if (corsMiddleware(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate CSRF token (logout is a state-changing request)
    if (!csrf.validateCsrf(req)) {
      return res.status(403).json({ error: 'CSRF token tidak valid. Muat ulang halaman.' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Get token from cookie
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.session_token;

    let userId = null;
    let username = null;

    if (token) {
      // Find session owner before deletion
      const sessionResult = await query(
        'SELECT s.user_id, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1',
        [token]
      );

      if (sessionResult.rows.length > 0) {
        userId = sessionResult.rows[0].user_id;
        username = sessionResult.rows[0].username;
      }

      // Delete session from database
      await query('DELETE FROM sessions WHERE token = $1', [token]);
    }

    // Audit: logout
    await logAudit({
      userId,
      action: 'LOGOUT',
      ip,
      userAgent,
      username
    });

    // Clear session cookie
    res.append('Set-Cookie', cookie.serialize('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1,
      path: '/'
    }));

    // Clear CSRF cookie
    res.append('Set-Cookie', cookie.serialize(csrf.COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1,
      path: '/'
    }));

    return res.status(200).json({ message: 'Logout berhasil' });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan internal server' });
  }
};

