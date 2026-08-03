-- ============================================
-- Migration v2: User Management Enhancements
-- Adds phone, photo fields; status replaces is_active
-- Run AFTER migration.sql
-- ============================================

-- Add phone and photo columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT;

-- Add status column (active, inactive, suspended) replacing is_active
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive', 'suspended'));

-- Migrate existing is_active data to status
UPDATE users SET status = CASE WHEN is_active = true THEN 'active' ELSE 'inactive' END
  WHERE status IS NULL;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
