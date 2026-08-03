/**
 * Secure CORS helper.
 *
 * Instead of `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials:
 * true` (which is invalid/insecure), this reflects a trusted origin and only
 * allows credentials for those origins. Same-origin requests are always allowed.
 */

const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

// Always allow local dev + Vercel preview deployments
ALLOWED_ORIGINS.add('http://localhost:3000');
ALLOWED_ORIGINS.add('http://localhost:5173');
ALLOWED_ORIGINS.add('http://127.0.0.1:3000');
ALLOWED_ORIGINS.add('http://127.0.0.1:5173');

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Allow Vercel preview deployments (xxx.vercel.app)
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch (e) {
    return false;
  }
}

/**
 * Apply secure CORS headers to a response based on the request Origin.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function applyCors(req, res) {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // Same-origin / non-browser request — no CORS headers needed
    res.removeHeader('Access-Control-Allow-Origin');
  } else {
    // Unknown origin — deny credentials
    res.setHeader('Access-Control-Allow-Origin', 'null');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Expose-Headers', 'X-CSRF-Token, Retry-After');
  res.setHeader('Vary', 'Origin');
}

/**
 * Handle an OPTIONS preflight request.
 * @returns {boolean} true if the request was handled (preflight)
 */
function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Content-Length': '0' });
    res.end();
    return true;
  }
  return false;
}

/**
 * Convenience: apply CORS and handle OPTIONS.
 * Must be called right after request enters the handler.
 * @returns {boolean} true if preflight was consumed (return from handler!)
 */
function corsMiddleware(req, res) {
  applyCors(req, res);
  return handlePreflight(req, res);
}

module.exports = {
  applyCors,
  corsMiddleware,
  handlePreflight,
  isAllowedOrigin,
  ALLOWED_ORIGINS
};

