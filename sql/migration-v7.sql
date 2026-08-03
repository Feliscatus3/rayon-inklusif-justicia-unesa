-- ============================================
-- Migration v7: User Management Enhancements
-- Adds new columns for complete user management
-- Run AFTER migration-v6.sql
-- ============================================

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pmii_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Laki-laki', 'Perempuan'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_program VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cohort VARCHAR(4);
ALTER TABLE users ADD COLUMN IF NOT EXISTS division VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Create index for new columns
CREATE INDEX IF NOT EXISTS idx_users_cohort ON users(cohort);
CREATE INDEX IF NOT EXISTS idx_users_faculty ON users(faculty);
CREATE INDEX IF NOT EXISTS idx_users_division ON users(division);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
