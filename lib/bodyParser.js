/**
 * Unified JSON body parser.
 *
 * Reads and parses the request body into `req.body` with a size limit to
 * prevent memory-exhaustion attacks. All API endpoints should use this so
 * behavior is consistent regardless of hosting environment.
 */

const MAX_BODY_BYTES = 100 * 1024; // 100 KB

/**
 * Parse the request body (JSON only).
 * Mutates `req.body`. On malformed JSON, resolves with `null` (caller decides).
 *
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<object|null>} parsed JSON object, or null on error/empty
 */
async function parseJsonBody(req) {
  if (req.body !== undefined && typeof req.body === 'object') {
    return req.body;
  }

  const contentType = req.headers['content-type'] || '';
  // Don't try to JSON-parse multipart requests (handled by formidable).
  if (contentType.includes('multipart/form-data')) {
    return null;
  }

  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        req.body = {};
        return resolve({});
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        const parsed = JSON.parse(raw);
        req.body = parsed && typeof parsed === 'object' ? parsed : {};
        resolve(req.body);
      } catch (err) {
        req.body = null;
        resolve(null);
      }
    });

    req.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Convenience: parse body and return a 400 error message if invalid.
 * @returns {Promise<boolean>} true if body parsed OK
 */
async function requireJsonBody(req, res) {
  const body = await parseJsonBody(req);
  if (body === null) {
    if (!res.headersSent) {
      res.status(400).json({ error: 'Invalid JSON body' });
    }
    return false;
  }
  return true;
}

module.exports = {
  parseJsonBody,
  requireJsonBody,
  MAX_BODY_BYTES
};

