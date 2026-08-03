-- ============================================
-- Migration v3: RBAC — Full Role-Based Access Control
-- Run AFTER migration-v2.sql
-- ============================================

-- Step 1: Drop the old CHECK constraint on role (if exists)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add new CHECK constraint with all 9 roles
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'super_admin',
    'admin',
    'ketua_rayon',
    'sekretaris',
    'bendahara',
    'kabid',
    'wakabid',
    'kader',
    'anggota'
  ));

-- Step 3: Migrate existing data
-- 'admin' stays as 'admin', 'kader' stays as 'kader'
-- Any other values default to 'kader'
UPDATE users SET role = 'kader' WHERE role NOT IN (
  'super_admin', 'admin', 'ketua_rayon', 'sekretaris', 'bendahara',
  'kabid', 'wakabid', 'kader', 'anggota'
);

-- Step 4: Ensure all users have a valid status
UPDATE users SET status = 'active' WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'suspended');

-- Step 5: Remove old is_active column if it still exists
-- (migration-v2 already replaced it with status, but just in case)
-- We keep is_active for backward compatibility but it's deprecated
-- ALTER TABLE users DROP COLUMN IF EXISTS is_active;

-- Step 6: Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 7: Add full_name index if not exists
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);

-- Step 8: Update existing sessions to use the new auth validation
-- (No structural change needed, sessions already reference user_id)
</｜｜DSML｜｜parameter>
</invoke>
</｜｜DSML｜｜tool_calls>
