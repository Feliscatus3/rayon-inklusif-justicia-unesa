/**
 * /api/savings — Consolidated Tabungan (Savings) Handler
 *
 * Single serverless function for the whole Tabungan module (Vercel Hobby budget:
 * stays within the ≤10 function limit — this is the 10th handler).
 *
 * Public contract (via vercel.json rewrite, __path query param):
 *   GET    /api/savings/summary                         — own balances + stats
 *   GET    /api/savings/categories                      — list categories
 *   POST   /api/savings/categories                      — admin create category
 *   PUT    /api/savings/categories/:id                  — admin edit category
 *   PATCH  /api/savings/categories/:id/toggle           — admin soft enable/disable
 *   GET    /api/savings/settings                        — QRIS image + min amount
 *   PUT    /api/savings/settings                        — admin update settings
 *   POST   /api/savings/transactions                    — create transaction (PENDING)
 *   GET    /api/savings/transactions                    — own history (member) / all (admin w/ scope=all)
 *   GET    /api/savings/transactions/:id                — detail (owner or admin)
 *   POST   /api/savings/transactions/:id/proof          — upload/replace payment proof
 *   POST   /api/savings/transactions/:id/validate       — admin → PAID (atomic, idempotent)
 *   POST   /api/savings/transactions/:id/reject         — admin → REJECTED (keeps proof)
 *   GET    /api/savings/admin/stats                     — admin dashboard stats
 *
 * Security model:
 *   - All endpoints require authentication (requireAuth).
 *   - State changes require a valid CSRF header (X-CSRF-Token).
 *   - Category management, settings, validate, reject are admin-only
 *     (requireRole 'admin'/'super_admin' honors the `privilege` column too).
 *   - Users may only read/create/upload-proof for their OWN transactions.
 *   - Money is stored as BIGINT (integer rupiah). DELETE is never used:
 *     old categories are soft-disabled; transactions are never deleted.
 */

const { query } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');
const { logAudit } = require('../lib/audit');
const { corsMiddleware } = require('../lib/cors');
const { parseJsonBody } = require('../lib/bodyParser');
const csrf = require('../lib/csrf');
const sec = require('../lib/security');

const STATUS_VALUES = ['PENDING', 'PAID', 'REJECTED'];
const MAX_BODY_BYTES = 4 * 1024 * 1024;        // 4 MB JSON (allows ~2.5MB base64 image proof)
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;     // 2.5 MB decoded image proof
const DATAURI_PREFIX = /^data:image\/(jpeg|png|webp);base64,/i;

module.exports = async (req, res) => {
  if (corsMiddleware(req, res)) return;
  if (req.query && typeof req.query.__path === 'string') {
    req.url = req.query.__path;
  }

  const user = await requireAuth(req, res);
  if (!user) return;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';

  try {
    const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const parts = url.pathname.replace('/api/savings', '').split('/').filter(Boolean);
    const method = req.method;

    // ── Category routes ────────────────────────────────────────────────
    if (parts[0] === 'categories') {
      if (method === 'GET' && !parts[1]) return await listCategories(req, res);
      if (method === 'POST' && !parts[1]) return await adminGate(req, res, user, () => createCategory(req, res, user, ip, ua));
      if (parts[1] && parts[2] === 'toggle' && method === 'PATCH') {
        return await adminGate(req, res, user, () => toggleCategory(req, res, user, ip, ua));
      }
      if (parts[1] && !parts[2] && method === 'PUT') {
        return await adminGate(req, res, user, () => updateCategory(req, res, user, ip, ua));
      }
    }

    // ── Settings routes (QRIS + min amount) ────────────────────────────
    if (parts[0] === 'settings') {
      if (method === 'GET' && !parts[1]) return await getSavingsSettings(req, res);
      if (method === 'PUT' && !parts[1]) return await adminGate(req, res, user, () => updateSavingsSettings(req, res, user, ip, ua));
    }

    // ── Summary (own balances) ─────────────────────────────────────────
    if (parts[0] === 'summary' && !parts[1] && method === 'GET') {
      return await getSummary(req, res, user);
    }

    // ── Admin stats ────────────────────────────────────────────────────
    if (parts[0] === 'admin' && parts[1] === 'stats' && !parts[2] && method === 'GET') {
      return await adminGate(req, res, user, () => getAdminStats(req, res));
    }

    // ── Transactions ───────────────────────────────────────────────────
    if (parts[0] === 'transactions') {
      // POST /api/savings/transactions  (create)
      if (method === 'POST' && !parts[1]) return await createTransaction(req, res, user, ip, ua);

      // GET /api/savings/transactions  (own history; admin may scope=all)
      if (method === 'GET' && !parts[1]) {
        const scope = url.searchParams.get('scope');
        if (scope === 'all' && requireRole(user, 'admin', 'super_admin')) {
          return await listTransactionsAdmin(req, res, user);
        }
        return await listTransactions(req, res, user);
      }

      if (parts[1] && !parts[2]) {
        // GET /api/savings/transactions/:id
        if (method === 'GET') return await getTransactionDetail(req, res, user, parts[1]);
      }
      if (parts[1] && parts[2] === 'proof' && method === 'POST') {
        return await uploadProof(req, res, user, parts[1], ip, ua);
      }
      if (parts[1] && parts[2] === 'validate' && method === 'POST') {
        return await adminGate(req, res, user, () => validateTransaction(req, res, user, parts[1], ip, ua));
      }
      if (parts[1] && parts[2] === 'reject' && method === 'POST') {
        return await adminGate(req, res, user, () => rejectTransaction(req, res, user, parts[1], ip, ua));
      }
    }

    // ── Admin transaction list (with search + filters) ─────────────────
    if (parts[0] === 'admin' && parts[1] === 'transactions' && !parts[2] && method === 'GET') {
      return await adminGate(req, res, user, () => listTransactionsAdmin(req, res, user));
    }

    return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
  } catch (error) {
    console.error('Savings API error:', error);
    return res.status(500).json({ error: error && error.message ? error.message : 'Internal server error' });
  }
};

/** Require CSRF on state changes, then admin-only gate. */
async function adminGate(req, res, user, handler) {
  if (!csrf.validateCsrf(req)) {
    return res.status(403).json({ error: 'CSRF token tidak valid. Muat ulang halaman.' });
  }
  if (!requireRole(user, 'admin', 'super_admin')) {
    return res.status(403).json({ error: 'Forbidden: Hanya admin atau super admin' });
  }
  return handler();
}

/** Require CSRF for any non-GET (member state changes too). */
function requireCsrf(req, res) {
  if (csrf.validateCsrf(req)) return true;
  res.status(403).json({ error: 'CSRF token tidak valid. Muat ulang halaman.' });
  return false;
}

function parseId(v) {
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function formatDateOnly(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/** Read a JSON body with a larger (configurable) limit (for proof uploads). */
function readBodyMax(req, maxBytes) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === 'object' ? parsed : null);
      } catch (e) {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════════════════════════════════

async function listCategories(req, res) {
  const result = await query(
    `SELECT id, name, description, is_active, created_at, updated_at
     FROM saving_categories
     ORDER BY is_active DESC, created_at ASC, id ASC`
  );
  return res.status(200).json({ categories: result.rows });
}

async function createCategory(req, res, user, ip, ua) {
  const body = await parseJsonBody(req);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });

  const name = body.name !== undefined ? String(body.name).trim() : '';
  const description = body.description !== undefined ? String(body.description).slice(0, 500) : null;
  if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi' });
  if (name.length > 100) return res.status(400).json({ error: 'Nama kategori maksimal 100 karakter' });

  const dup = await query(`SELECT id FROM saving_categories WHERE LOWER(name) = LOWER($1)`, [name]);
  if (dup.rows.length > 0) return res.status(400).json({ error: 'Kategori dengan nama tersebut sudah ada' });

  const result = await query(
    `INSERT INTO saving_categories (name, description) VALUES ($1, $2) RETURNING *`,
    [name, description]
  );
  await logAudit({ userId: user.id, action: 'SAVING_CATEGORY_CREATED', ip, userAgent: ua, details: JSON.stringify({ id: result.rows[0].id, name }) });
  return res.status(201).json({ message: 'Kategori berhasil dibuat', category: result.rows[0] });
}

async function updateCategory(req, res, user, ip, ua) {
  const id = parseId(req.url.split('/').filter(Boolean).pop());
  if (!id) return res.status(400).json({ error: 'ID kategori tidak valid' });

  const body = await parseJsonBody(req);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });

  const exists = await query(`SELECT id, name FROM saving_categories WHERE id = $1`, [id]);
  if (exists.rows.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

  const name = body.name !== undefined ? String(body.name).trim() : exists.rows[0].name;
  const description = body.description !== undefined ? String(body.description).slice(0, 500) : null;
  if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi' });
  if (name.length > 100) return res.status(400).json({ error: 'Nama kategori maksimal 100 karakter' });

  const dup = await query(`SELECT id FROM saving_categories WHERE LOWER(name) = LOWER($1) AND id <> $2`, [name, id]);
  if (dup.rows.length > 0) return res.status(400).json({ error: 'Kategori dengan nama tersebut sudah ada' });

  const result = await query(
    `UPDATE saving_categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, description, id]
  );
  await logAudit({ userId: user.id, action: 'SAVING_CATEGORY_UPDATED', ip, userAgent: ua, details: JSON.stringify({ id, name }) });
  return res.status(200).json({ message: 'Kategori berhasil diperbarui', category: result.rows[0] });
}

async function toggleCategory(req, res, user, ip, ua) {
  const id = parseId(req.url.split('/').filter(Boolean).slice(-2)[0]);
  if (!id) return res.status(400).json({ error: 'ID kategori tidak valid' });

  const exists = await query(`SELECT id, is_active FROM saving_categories WHERE id = $1`, [id]);
  if (exists.rows.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

  const next = !exists.rows[0].is_active;
  await query(`UPDATE saving_categories SET is_active = $1, updated_at = NOW() WHERE id = $2`, [next, id]);
  await logAudit({ userId: user.id, action: next ? 'SAVING_CATEGORY_ACTIVATED' : 'SAVING_CATEGORY_DEACTIVATED', ip, userAgent: ua, details: JSON.stringify({ id }) });
  return res.status(200).json({ message: next ? 'Kategori diaktifkan' : 'Kategori dinonaktifkan', is_active: next });
}

// ═══════════════════════════════════════════════════════════════════════
// Settings (QRIS + min amount)
// ═══════════════════════════════════════════════════════════════════════

async function getSavingsSettings(req, res) {
  const result = await query(`SELECT qris_image, qris_display_name, min_amount FROM savings_settings WHERE id = 1`);
  if (result.rows.length === 0) {
    return res.status(200).json({ settings: { qris_image: null, qris_display_name: 'Tabungan PMII Justicia', min_amount: 1000 } });
  }
  return res.status(200).json({ settings: result.rows[0] });
}

async function updateSavingsSettings(req, res, user, ip, ua) {
  const body = await readBodyMax(req, MAX_BODY_BYTES);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });

  const qrisImage = body.qris_image !== undefined && body.qris_image !== null ? String(body.qris_image) : null;
  if (qrisImage) {
    const okMedia = qrisImage.startsWith('data:image/') || qrisImage.startsWith('https://') || qrisImage.startsWith('http://') || qrisImage.startsWith('/');
    if (!okMedia || qrisImage.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'Gambar QRIS tidak valid' });
    }
  }

  const minAmountRaw = body.min_amount !== undefined ? parseInt(body.min_amount, 10) : null;
  let minAmount = 1000;
  if (minAmountRaw !== null && Number.isInteger(minAmountRaw) && minAmountRaw >= 0) minAmount = minAmountRaw;

  const displayName = body.qris_display_name !== undefined && body.qris_display_name !== null
    ? String(body.qris_display_name).trim().slice(0, 100) : 'Tabungan PMII Justicia';

  await query(
    `UPDATE savings_settings SET qris_image = $1, qris_display_name = $2, min_amount = $3, updated_at = NOW(), updated_by = $4 WHERE id = 1`,
    [qrisImage, displayName, minAmount, user.id]
  );
  await logAudit({ userId: user.id, action: 'SAVING_SETTINGS_UPDATED', ip, userAgent: ua, details: JSON.stringify({ min_amount: minAmount }) });
  return res.status(200).json({ message: 'Pengaturan tabungan disimpan', settings: { qris_image: qrisImage, qris_display_name: displayName, min_amount: minAmount } });
}

// ═══════════════════════════════════════════════════════════════════════
// Summary (own balances)
// ═══════════════════════════════════════════════════════════════════════

async function getSummary(req, res, user) {
  const totalRes = await query(
    `SELECT COALESCE(SUM(amount), 0)::BIGINT AS total,
            COUNT(*) FILTER (WHERE payment_status = 'PENDING') AS pending_count,
            COUNT(*) FILTER (WHERE payment_status = 'PAID') AS paid_count,
            COUNT(*) FILTER (WHERE payment_status = 'REJECTED') AS rejected_count
     FROM saving_transactions WHERE user_id = $1`,
    [user.id]
  );
  const catRes = await query(
    `SELECT c.id, c.name, c.description, c.is_active,
            COALESCE(SUM(t.amount), 0)::BIGINT AS total,
            COUNT(t.id) FILTER (WHERE t.payment_status = 'PAID') AS paid_tx
     FROM saving_categories c
     LEFT JOIN saving_transactions t ON t.category_id = c.id AND t.user_id = $1
     GROUP BY c.id
     ORDER BY c.is_active DESC, c.created_at ASC, c.id ASC`,
    [user.id]
  );
  const total = parseInt(totalRes.rows[0].total || 0, 10);
  const pendingCount = parseInt(totalRes.rows[0].pending_count || 0, 10);
  const paidCount = parseInt(totalRes.rows[0].paid_count || 0, 10);
  const rejectedCount = parseInt(totalRes.rows[0].rejected_count || 0, 10);

  const byCategory = catRes.rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    is_active: !!r.is_active,
    total: parseInt(r.total || 0, 10),
    paid_tx: parseInt(r.paid_tx || 0, 10)
  }));

  return res.status(200).json({
    summary: {
      total,
      paid_count: paidCount,
      pending_count: pendingCount,
      rejected_count: rejectedCount
    },
    categories: byCategory
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Transactions
// ═══════════════════════════════════════════════════════════════════════

async function genTransactionCode() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const today = await query(
      `SELECT COUNT(*)::int AS c FROM saving_transactions WHERE transaction_code LIKE $1`,
      [`TRX-${ymd}-%`]
    );
    const n = parseInt(today.rows[0].c || 0, 10) + 1 + attempt;
    const code = `TRX-${ymd}-${String(n).padStart(5, '0')}`;
    const exists = await query(`SELECT 1 FROM saving_transactions WHERE transaction_code = $1`, [code]);
    if (exists.rows.length === 0) return code;
  }
  return `TRX-${ymd}-${Date.now().toString().slice(-5)}`;
}

async function createTransaction(req, res, user, ip, ua) {
  const body = await parseJsonBody(req);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });

  const categoryId = parseId(body.category_id);
  if (!categoryId) return res.status(400).json({ error: 'Kategori wajib dipilih' });

  const amount = parseInt(body.amount, 10);
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Nominal harus berupa angka lebih besar dari 0' });
  }
  if (amount > 1000000000) return res.status(400).json({ error: 'Nominal terlalu besar' });

  const cat = await query(`SELECT id, name, is_active FROM saving_categories WHERE id = $1`, [categoryId]);
  if (cat.rows.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
  if (!cat.rows[0].is_active) return res.status(400).json({ error: 'Kategori sedang dinonaktifkan' });

  const settings = await query(`SELECT min_amount FROM savings_settings WHERE id = 1`);
  const minAmount = parseInt(settings.rows[0] && settings.rows[0].min_amount || 0, 10);
  if (minAmount > 0 && amount < minAmount) {
    return res.status(400).json({ error: `Nominal minimal Rp${minAmount.toLocaleString('id-ID')}` });
  }

  const code = await genTransactionCode();
  const paymentMethod = body.payment_method === 'TRANSFER' ? 'TRANSFER' : 'QRIS';
  const result = await query(
    `INSERT INTO saving_transactions (user_id, category_id, transaction_code, amount, payment_method, payment_status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
    [user.id, categoryId, code, amount, paymentMethod]
  );
  await logAudit({ userId: user.id, action: 'SAVING_TRANSACTION_CREATED', ip, userAgent: ua, details: JSON.stringify({ id: result.rows[0].id, code, amount }) });
  return res.status(201).json({
    message: 'Transaksi tabungan dibuat. Silakan lakukan pembayaran.',
    transaction: { ...result.rows[0], category_name: cat.rows[0].name },
    min_amount: minAmount
  });
}

const TX_SELECT = `
  SELECT t.id, t.user_id, t.category_id, t.transaction_code, t.amount, t.payment_method,
         t.payment_status, t.proof_url, t.verified_by, t.verified_at, t.rejection_reason,
         t.created_at, t.updated_at,
         c.name AS category_name, c.is_active AS category_active,
         u.full_name AS user_name, u.username AS user_username,
         v.full_name AS verified_by_name
  FROM saving_transactions t
  JOIN saving_categories c ON c.id = t.category_id
  JOIN users u ON u.id = t.user_id
  LEFT JOIN users v ON v.id = t.verified_by
`;

async function listTransactions(req, res, user) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const status = url.searchParams.get('status') || '';
  const category = url.searchParams.get('category') || '';
  const limit = sec.clampInt(url.searchParams.get('limit'), 1, 100, 50);
  const offset = sec.clampInt(url.searchParams.get('offset'), 0, 100000, 0);

  let sql = TX_SELECT + ` WHERE t.user_id = $1`;
  const params = [user.id];
  let i = 2;
  if (STATUS_VALUES.includes(status)) { sql += ` AND t.payment_status = $${i++}`; params.push(status); }
  if (category) { const cid = parseId(category); if (cid) { sql += ` AND t.category_id = $${i++}`; params.push(cid); } }
  sql += ` ORDER BY t.created_at DESC, t.id DESC LIMIT $${i++} OFFSET $${i++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return res.status(200).json({ transactions: result.rows });
}

async function getTransactionDetail(req, res, user, idRaw) {
  const id = parseId(idRaw);
  if (!id) return res.status(400).json({ error: 'ID transaksi tidak valid' });
  const result = await query(TX_SELECT + ` WHERE t.id = $1`, [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  const tx = result.rows[0];
  if (tx.user_id !== user.id && !requireRole(user, 'admin', 'super_admin')) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  return res.status(200).json({ transaction: tx });
}

async function uploadProof(req, res, user, idRaw, ip, ua) {
  if (!requireCsrf(req, res)) return;
  const id = parseId(idRaw);
  if (!id) return res.status(400).json({ error: 'ID transaksi tidak valid' });

  const result = await query(
    `SELECT id, user_id, payment_status FROM saving_transactions WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  const tx = result.rows[0];
  if (tx.user_id !== user.id) return res.status(403).json({ error: 'Akses ditolak' });
  if (tx.payment_status === 'PAID') {
    return res.status(400).json({ error: 'Transaksi sudah diverifikasi, bukti tidak dapat diubah' });
  }

  const body = await readBodyMax(req, MAX_BODY_BYTES);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });

  const data = body.proof !== undefined && body.proof !== null ? String(body.proof) : '';
  if (!DATAURI_PREFIX.test(data)) {
    return res.status(400).json({ error: 'File bukti harus berupa gambar JPG/PNG/WebP (base64)' });
  }
  const b64 = data.slice(data.indexOf(',') + 1);
  let approxBytes = 0;
  try { approxBytes = Buffer.from(b64, 'base64').length; } catch (e) { approxBytes = 0; }
  if (approxBytes > MAX_IMAGE_BYTES) {
    return res.status(400).json({ error: 'Ukuran file terlalu besar (maksimal 2 MB)' });
  }
  if (approxBytes < 50) return res.status(400).json({ error: 'File bukti tidak valid' });

  const nextStatus = tx.payment_status === 'REJECTED' ? 'PENDING' : tx.payment_status;
  await query(
    `UPDATE saving_transactions
        SET proof_url = $1, payment_status = $2, rejection_reason = NULL, updated_at = NOW()
      WHERE id = $3`,
    [data, nextStatus, id]
  );
  await logAudit({ userId: user.id, action: 'SAVING_PROOF_UPLOADED', ip, userAgent: ua, details: JSON.stringify({ id, code: tx.transaction_code || id }) });
  return res.status(200).json({
    message: nextStatus === 'PENDING'
      ? 'Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.'
      : 'Bukti pembayaran berhasil disimpan.',
    payment_status: nextStatus
  });
}

async function validateTransaction(req, res, user, idRaw, ip, ua) {
  const id = parseId(idRaw);
  if (!id) return res.status(400).json({ error: 'ID transaksi tidak valid' });

  // Atomic & idempotent: only transitions PENDING → PAID. A second validate
  // matches zero rows (status is already PAID) so saldo can never be credited twice.
  // proof_url is cleared in the SAME statement = storage cleanup for this module's
  // data-URI proof storage (the project stores media inline, not on a filesystem).
  const result = await query(
    `UPDATE saving_transactions
        SET payment_status = 'PAID', verified_by = $2, verified_at = NOW(),
            proof_url = NULL, rejection_reason = NULL, updated_at = NOW()
      WHERE id = $1 AND payment_status = 'PENDING'
      RETURNING id, transaction_code, amount, category_id, user_id`,
    [id, user.id]
  );
  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Transaksi tidak dapat divalidasi (sudah diproses atau tidak ditemukan)' });
  }
  const tx = result.rows[0];
  await logAudit({ userId: user.id, action: 'ADMIN_VALIDATED_SAVING', ip, userAgent: ua, details: JSON.stringify({ id, code: tx.transaction_code, amount: tx.amount }) });
  return res.status(200).json({ message: 'Pembayaran divalidasi. Saldo anggota bertambah.', transaction: tx });
}

async function rejectTransaction(req, res, user, idRaw, ip, ua) {
  const id = parseId(idRaw);
  if (!id) return res.status(400).json({ error: 'ID transaksi tidak valid' });

  const body = await readBodyMax(req, MAX_BODY_BYTES);
  if (body === null) return res.status(400).json({ error: 'Invalid JSON body' });
  const reason = body.reason !== undefined ? String(body.reason).trim().slice(0, 500) : '';
  if (!reason) return res.status(400).json({ error: 'Alasan penolakan wajib diisi' });

  // Only allow rejecting PENDING. Proof is NOT deleted (user may re-upload).
  const result = await query(
    `UPDATE saving_transactions
        SET payment_status = 'REJECTED', rejection_reason = $2, updated_at = NOW()
      WHERE id = $1 AND payment_status = 'PENDING'
      RETURNING id, transaction_code`,
    [id, reason]
  );
  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Transaksi tidak dapat ditolak (sudah diproses atau tidak ditemukan)' });
  }
  await logAudit({ userId: user.id, action: 'ADMIN_REJECTED_SAVING', ip, userAgent: ua, details: JSON.stringify({ id, code: result.rows[0].transaction_code, reason }) });
  return res.status(200).json({ message: 'Pembayaran ditolak' });
}

async function listTransactionsAdmin(req, res, user) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const category = url.searchParams.get('category') || '';
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';
  const limit = sec.clampInt(url.searchParams.get('limit'), 1, 200, 50);
  const offset = sec.clampInt(url.searchParams.get('offset'), 0, 100000, 0);

  let sql = TX_SELECT + ` WHERE 1=1`;
  const params = [];
  let i = 1;

  if (search) {
    sql += ` AND (u.full_name ILIKE $${i} OR u.username ILIKE $${i} OR t.transaction_code ILIKE $${i})`;
    params.push(`%${search}%`);
    i++;
  }
  if (STATUS_VALUES.includes(status)) { sql += ` AND t.payment_status = $${i++}`; params.push(status); }
  if (category) { const cid = parseId(category); if (cid) { sql += ` AND t.category_id = $${i++}`; params.push(cid); } }
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) { sql += ` AND t.created_at::date >= $${i++}`; params.push(from); }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) { sql += ` AND t.created_at::date <= $${i++}`; params.push(to); }

  sql += ` ORDER BY t.created_at DESC, t.id DESC LIMIT $${i++} OFFSET $${i++}`;
  params.push(limit, offset);
  const result = await query(sql, params);

  const countRes = await query(`SELECT COUNT(*) FROM saving_transactions`, []);
  const total = parseInt(countRes.rows[0].count, 10);
  return res.status(200).json({ transactions: result.rows, total });
}

async function getAdminStats(req, res) {
  const result = await query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE payment_status = 'PAID'), 0)::BIGINT AS total_saldo,
       COUNT(*) AS total_tx,
       COUNT(*) FILTER (WHERE payment_status = 'PENDING') AS pending_tx,
       COALESCE(SUM(amount) FILTER (WHERE payment_status = 'PAID' AND created_at::date = CURRENT_DATE), 0)::BIGINT AS today_paid,
       COALESCE(SUM(amount) FILTER (WHERE payment_status = 'PAID' AND created_at::date = CURRENT_DATE), 0)::BIGINT AS today_amount
     FROM saving_transactions`
  );
  const r = result.rows[0] || {};
  return res.status(200).json({
    stats: {
      total_saldo: parseInt(r.total_saldo || 0, 10),
      total_tx: parseInt(r.total_tx || 0, 10),
      pending_tx: parseInt(r.pending_tx || 0, 10),
      today_paid: parseInt(r.today_paid || 0, 10),
      today_amount: parseInt(r.today_amount || 0, 10)
    }
  });
}