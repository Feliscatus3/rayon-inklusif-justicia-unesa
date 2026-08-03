-- ============================================
-- Migration v4: Events / Calendar Module
-- Run AFTER migration-v3.sql
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'Rayon'
    CHECK (category IN ('PMII','Rayon','Komisariat','BEM','DPM','Faculty','University','External')),
  location VARCHAR(255),
  event_date DATE NOT NULL,
  event_time TIME,
  color VARCHAR(7) DEFAULT '#1a237e',
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
</create_field>
</invoke>
</tool_calls>
