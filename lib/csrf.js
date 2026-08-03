/**
 * CSRF Protection Library
 *
 * Implements the "double-submit cookie" (synchronizer-token) pattern:
 *   1. Server issues an HttpOnly `csrf_token` cookie containing a random token
 *      (or better: HMAC-signed value) when the user authenticates.
 *   2. For every state-changing request (POST/PUT/PATCH/DELETE), the client must
 *      echo the token back in the `X-CSRF-Token` request header.
 *   3. Server compares the header value to the cookie value (constant-time).
 *
 * Because an attacker's cross-site page cannot read the cookie (SameSite=Lax
 * also stops cross-site POSTs) nor set a custom header, this blocks CSRF.
 */

const crypto = require('crypto');

const COOKIE_NAME = 'csrf_token';
const HEADER_NAME = 'x-csrf-token';

/**
 * Derive a secret for signing CSRF tokens.
 * Falls back to a per-process random secret in development so the app still
 * works without SESSION_SECRET configured (never used in production).
 */
function getSecret() {
  const envSecret = process.env.SESSION_SECRET;
  if (envSecret && envSecret.length >= 16) return envSecret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set (>= 16 chars) in production for CSRF protection');
  }
  // dev fallback — stable per process
  if (!getSecret._devSecret) {
    getSecret._devSecret = crypto.randomBytes(32).toString('hex');
  }
  return getSecret._devSecret;
}

/**
 * Generate a random CSRF token
 * @returns {string} 64-char hex token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sign a token with the server secret (prevents tampering)
 * @param {string} token
 * @returns {string} HMAC signature in hex
 */
function signToken(token) {
  return crypto.createHmac('sha256', getSecret()).update(token).digest('hex');
}

/**
 * Constant-time comparison
 */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validate a raw token+signature pair
 * @param {string} token
 * @param {string} signature
 * @returns {boolean}
 */
function isValidToken(token, signature) {
  if (!token || !signature) return false;
  if (typeof token !== 'string' || typeof signature !== 'string') return false;
  if (!/^[a-f0-9]{64}$/i.test(token)) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  return safeEqual(signature, signToken(token));
}

/**
 * Issue a CSRF cookie on a response.
 * @param {import('http').ServerResponse} res
 * @param {string} token
 */
function setCsrfCookie(res, token) {
  const cookieOptions = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=7200'
  ];
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.push('Secure');
  }
  const existing = res.getHeader('Set-Cookie');
  const newCookie = cookieOptions.join('; ');
  if (!existing) {
    res.setHeader('Set-Cookie', newCookie);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', existing.concat(newCookie));
  } else {
    res.setHeader('Set-Cookie', [existing, newCookie]);
  }
}

/**
 * Create a signed CSRF token for a session.
 * Returns { token, signature }.
 */
function createSignedToken() {
  const token = generateToken();
  return { token, signature: signToken(token) };
}

/**
 * Issue a new signed CSRF token cookie on the given response.
 * @returns {string} the plain token (to also send as header if desired)
 */
function issueCsrfToken(res) {
  const { token, signature } = createSignedToken();
  setCsrfCookie(res, `${token}.${signature}`);
  return token;
}

/**
 * Parse token + signature from a cookie value of form "token.signature"
 * @param {string} cookieValue
 * @returns {{token:string, signature:string}|null}
 */
function parseCsrfCookie(cookieValue) {
  if (!cookieValue) return null;
  const parts = String(cookieValue).split('.');
  if (parts.length !== 2) return null;
  return { token: parts[0], signature: parts[1] };
}

/**
 * Validate a request's CSRF header against its csrf_token cookie.
 * Call AFTER requireAuth (so the session cookie is present).
 *
 * @param {import('http').IncomingMessage} req
 * @returns {boolean} true if valid
 */
function validateCsrf(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const cookieValue = cookies[COOKIE_NAME];
  const headerValue = req.headers[HEADER_NAME];

  const parsed = parseCsrfCookie(cookieValue);
  if (!parsed) return false;
  if (!headerValue) return false;

  // Double-submit: header must equal cookie token (consistent with same-site cookie)
  if (!safeEqual(headerValue, parsed.token)) return false;

  // Verify signature to prevent cookie tampering
  return isValidToken(parsed.token, parsed.signature);
}

/**
 * Simple cookie parser (no external deps)
 */
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}

/**
 * Clear the CSRF cookie from a response (logout).
 */
function clearCsrfCookie(res) {
  const cookieOptions = [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0'
  ];
  if (process.env.NODE_ENV === 'production') cookieOptions.push('Secure');
  res.append('Set-Cookie', cookieOptions.join('; '));
}

module.exports = {
  COOKIE_NAME,
  HEADER_NAME,
  generateToken,
  signToken,
  isValidToken,
  safeEqual,
  setCsrfCookie,
  issueCsrfToken,
  validateCsrf,
  parseCookies,
  clearCsrfCookie,
  getSecret,
  createSignedToken
};

