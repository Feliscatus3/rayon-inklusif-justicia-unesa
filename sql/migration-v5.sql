-- ============================================
-- Migration v5: Announcements Module
-- Run AFTER migration-v4.sql
-- ============================================

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Umum'
    CHECK (category IN ('Umum','Kegiatan','Pendidikan','Organisasi','Kaderisasi','KOPRI','Lembaga','External')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pdf_url VARCHAR(500),
  pdf_name VARCHAR(255),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
