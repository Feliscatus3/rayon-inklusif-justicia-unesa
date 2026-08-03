/**
 * Shared input validation & sanitization helpers.
 */

/**
 * Escape HTML special characters (XSS prevention).
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#39;'
  }[c]));
}

/**
 * Validate an ISO date string (YYYY-MM-DD)
 * @param {*} value
 * @returns {boolean}
 */
function isValidDate(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Validate a time string (HH:MM[:SS])
 * @param {*} value
 * @returns {boolean}
 */
function isValidTime(value) {
  if (!value) return true;
  if (typeof value !== 'string') return false;
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
}

/**
 * Validate a color hex string (#rrggbb)
 * @param {*} value
 * @returns {boolean}
 */
function isValidColor(value) {
  if (!value) return true;
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value);
}

/**
 * validate an email address (basic RFC-ish check)
 */
function isValidEmail(value) {
  if (typeof value !== 'string' || !value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validate a phone number (allow digits, spaces, +, -, parentheses, length 8-20)
 */
function isValidPhone(value) {
  if (!value) return true;
  if (typeof value !== 'string') return false;
  return /^[+0-9\s()-]{8,20}$/.test(value);
}

/**
 * Clamp an integer within [min, max]
 */
function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Truncate a string to a max length.
 */
function truncate(value, max) {
  if (value === null || value === undefined) return null;
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

module.exports = {
  escapeHtml,
  isValidDate,
  isValidTime,
  isValidColor,
  isValidEmail,
  isValidPhone,
  clampInt,
  truncate
};

