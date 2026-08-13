-- ============================================
-- Migration v9: Tabungan (Savings) Module
-- Run AFTER migration-v8.sql (and migration-settings.sql, migration-audit.sql)
--
-- Adds:
--   saving_categories    - savings categories (soft-disabled via is_active)
--   saving_transactions  - savings payment transactions (PENDING/PAID/REJECTED)
--   savings_settings     - singleton settings: QRIS image + min_amount
--
-- Money is stored as BIGINT (integer rupiah) — never floating point.
-- `proof_url` stores a data-URI (base64) image, the same storage mechanism the
-- project already uses for settings media (no filesystem/blob in serverless).
-- ============================================

CREATE TABLE IF NOT EXISTS saving_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent duplicate category names (case-insensitive, allows soft-disable reuse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_saving_categories_name
  ON saving_categories (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_saving_categories_active
  ON saving_categories (is_active, created_at);

CREATE TABLE IF NOT EXISTS saving_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES saving_categories(id),
  transaction_code VARCHAR(40) NOT NULL UNIQUE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'QRIS',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING', 'PAID', 'REJECTED')),
  proof_url TEXT,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saving_tx_user ON saving_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saving_tx_status ON saving_transactions (payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saving_tx_category ON saving_transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_saving_tx_code ON saving_transactions (transaction_code);

-- Singleton settings row (mirrors `settings` table pattern, id=1 only)
CREATE TABLE IF NOT EXISTS savings_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  qris_image TEXT,
  qris_display_name VARCHAR(100) DEFAULT 'Tabungan PMII Justicia',
  min_amount BIGINT NOT NULL DEFAULT 1000 CHECK (min_amount >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO savings_settings (id, qris_image, qris_display_name, min_amount)
VALUES (1, NULL, 'Tabungan PMII Justicia', 1000)
ON CONFLICT (id) DO NOTHING;