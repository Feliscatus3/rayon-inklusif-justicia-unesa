-- ============================================
-- Migration: Website Settings
-- Singleton settings row (id=1) for site branding
-- Run AFTER migration-v6.sql
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name VARCHAR(100) NOT NULL DEFAULT 'Kader Panel',
  site_logo TEXT,
  site_favicon TEXT,
  org_name VARCHAR(150) NOT NULL DEFAULT 'PMII Rayon Inklusif Justicia',
  org_address TEXT,
  org_instagram VARCHAR(100),
  org_whatsapp VARCHAR(30),
  org_email VARCHAR(100),
  default_dark_mode BOOLEAN NOT NULL DEFAULT false,
  login_background TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Seed default row if empty
INSERT INTO settings (id, site_name, org_name)
VALUES (1, 'Kader Panel', 'PMII Rayon Inklusif Justicia')
ON CONFLICT (id) DO NOTHING;

