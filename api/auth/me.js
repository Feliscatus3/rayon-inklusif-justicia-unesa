/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's data.
 * Reads the HTTP-only session cookie and validates it against the database.
 */

const { requireAuth } = require('../../lib/auth');
const { corsMiddleware } = require('../../lib/cors');
const csrf = require('../../lib/csrf');

module.exports = async (req, res) => {
  if (corsMiddleware(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    // Ensure the CSRF token cookie is present for this session
    const existingCookie = csrf.parseCookies(req.headers.cookie || '')[csrf.COOKIE_NAME];
    if (!existingCookie) {
      csrf.issueCsrfToken(res);
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
  } catch (error) {
    console.error('Session check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
