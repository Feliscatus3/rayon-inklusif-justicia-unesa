-- ============================================
-- Migration v6: Organization Structure
-- Run AFTER migration-v5.sql
-- ============================================

CREATE TABLE IF NOT EXISTS divisions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE kader_profiles ADD COLUMN IF NOT EXISTS division_id INTEGER REFERENCES divisions(id) ON DELETE SET NULL;
ALTER TABLE kader_profiles ADD COLUMN IF NOT EXISTS division_role VARCHAR(50) CHECK (division_role IN ('kabid','wakabid','anggota')) DEFAULT 'anggota';

-- Default divisions for PMII Rayon Justicia
-- Corrected berdasarkan struktur kepengurusan PMII
INSERT INTO divisions (name, description, sort_order) VALUES
  ('Kaderisasi', 'Bidang Pengembangan Kader', 1),
  ('Sosial', 'Bidang Sosial dan Pengabdian Masyarakat', 2),
  ('Keimuan', 'Bidang Keimuan dan Intelektual', 3),
  ('Keagamaan', 'Bidang Keagamaan dan Kerohanian', 4),
  ('Komunikasi dan Jaringan Kerja', 'Bidang Komunikasi dan Jaringan Kerja (Korja)', 5),
  ('Politik', 'Bidang Politik dan Advokasi', 6)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_kader_profiles_division_id ON kader_profiles(division_id);
CREATE INDEX IF NOT EXISTS idx_divisions_sort_order ON divisions(sort_order);
