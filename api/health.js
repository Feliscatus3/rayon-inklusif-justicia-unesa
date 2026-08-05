/**
 * GET /api/health
 *
 * Lightweight health check. Verifies the DATABASE_URL env var is present and
 * (optionally) attempts a trivial DB query so you can confirm Neon connectivity
 * after deploying to Vercel.
 *
 * Returns JSON — never throws.
 */
const { query, pool } = require('../lib/db');

module.exports = async (req, res) => {
  // CORS for cross-origin debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasSecret = !!process.env.SESSION_SECRET;

  let dbStatus = 'not-configured';
  let dbError = null;

  if (hasDbUrl) {
    try {
      await query('SELECT 1 AS ok');
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
      dbError = err.message;
    }
  }

  return res.status(200).json({
    status: 'ok',
    env: {
      node_env: process.env.NODE_ENV || 'development',
      database_url_set: hasDbUrl,
      session_secret_set: hasSecret
    },
    database: {
      status: dbStatus,
      error: dbError
    }
  });
};
