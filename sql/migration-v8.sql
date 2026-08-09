-- ============================================
-- Migration v8: Registration & Approval System
-- Run AFTER migration-v7.sql
--
-- Adds:
--   - 'pending' and 'rejected' to the status CHECK constraint
--   - a `privilege` column (member / admin / super_admin) separate from `role`
--   - supporting indexes
-- Preserves all existing users, roles, and data.
-- ============================================

-- Step 1: Widen the status CHECK constraint to support pending/rejected
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'inactive', 'suspended', 'pending', 'rejected'));

-- Step 2: Backfill any NULL status to 'active' (shouldn't happen, but be safe)
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Step 3: Add a `privilege` column separate from `role`.
-- Values: 'member' (default), 'admin', 'super_admin'
ALTER TABLE users ADD COLUMN IF NOT EXISTS privilege VARCHAR(20) NOT NULL DEFAULT 'member'
  CHECK (privilege IN ('member', 'admin', 'super_admin'));

-- Step 4: Backfill privileges for existing admin roles so admin functionality
-- keeps working after the schema change.
UPDATE users SET privilege = 'admin'
  WHERE privilege = 'member' AND role IN ('admin', 'super_admin');

UPDATE users SET privilege = 'super_admin'
  WHERE privilege = 'member' AND role = 'super_admin';

-- Step 5: Index for admin filtering by status / privilege
CREATE INDEX IF NOT EXISTS idx_users_privilege ON users(privilege);
CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at DESC);
