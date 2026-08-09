/**
 * seed-superadmin.js
 *
 * Idempotent one-time seed for the initial Super Admin account.
 *
 *   username  : nizarfazari193
 *   password  : nizarfazari889  (bcrypt-hashed, NEVER stored plaintext)
 *   full_name : Nizar Fazari
 *   email     : nizarfazari193@gmail.com
 *   role      : ketua rayon
 *   privilege : super_admin
 *   status    : active (approved)
 *   is_active : true
 *
 * Behavior:
 *   - If the user does NOT exist  -> create it (bcrypt-hash the password).
 *   - If the user ALREADY exists  -> DO NOT duplicate. Only update the
 *     authorization/admin fields (role, privilege, status, is_active).
 *     The existing password_hash is NEVER overwritten unless
 *     --reset-password is passed.
 *
 * Usage:
 *   node scripts/seed-superadmin.js
 *   node scripts/seed-superadmin.js --reset-password   (force reset password)
 *
 * Requires DATABASE_URL in the environment (or .env file).
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('../lib/db');

const SUPER_ADMIN = {
  username: 'nizarfazari193',
  password: 'nizarfazari889',
  fullName: 'Nizar Fazari',
  email: 'nizarfazari193@gmail.com',
  role: 'ketua_rayon',
  privilege: 'super_admin',
  status: 'active',
  isActive: true
};

async function main() {
  const resetPassword = process.argv.includes('--reset-password');

  if (!process.env.DATABASE_URL) {
    console.error('[seed] DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  try {
    // ── 1. Check if the account already exists ──────────────────────
    const existing = await query(
      'SELECT id, username, email, password_hash, role, privilege, status, is_active FROM users WHERE username = $1',
      [SUPER_ADMIN.username]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      console.log('[seed] Super admin "' + SUPER_ADMIN.username + '" already exists (id=' + user.id + ').');

      // Update authorization/admin fields only — preserve password unless forced.
      const sets = [];
      const vals = [];
      let i = 1;

      if (user.role !== SUPER_ADMIN.role) { sets.push('role=$' + i++); vals.push(SUPER_ADMIN.role); }
      if (user.privilege !== SUPER_ADMIN.privilege) { sets.push('privilege=$' + i++); vals.push(SUPER_ADMIN.privilege); }
      if (user.status !== SUPER_ADMIN.status) { sets.push('status=$' + i++); vals.push(SUPER_ADMIN.status); }
      if (user.is_active !== SUPER_ADMIN.isActive) { sets.push('is_active=$' + i++); vals.push(SUPER_ADMIN.isActive); }
      if (user.email !== SUPER_ADMIN.email) { sets.push('email=$' + i++); vals.push(SUPER_ADMIN.email); }

      if (resetPassword) {
        const hash = await bcrypt.hash(SUPER_ADMIN.password, 10);
        sets.push('password_hash=$' + i++);
        vals.push(hash);
        console.log('[seed] --reset-password flag detected. Password will be reset.');
      } else {
        console.log('[seed] Password preserved (not overwritten). Use --reset-password to force reset.');
      }

      if (sets.length > 0) {
        vals.push(user.id);
        await query('UPDATE users SET ' + sets.join(', ') + ' WHERE id=$' + i, vals);
        console.log('[seed] Updated fields: ' + sets.map(s => s.split('=')[0]).join(', '));
      } else {
        console.log('[seed] No updates required — account already matches desired state.');
      }

      console.log('[seed] Super admin is: role=ketua_rayon, privilege=super_admin, status=active, is_active=true');
      process.exit(0);
    }

    // ── 2. Account does not exist → create it ───────────────────────
    console.log('[seed] Creating super admin "' + SUPER_ADMIN.username + '"...');
    const passwordHash = await bcrypt.hash(SUPER_ADMIN.password, 10);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, role, privilege, status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, full_name, role, privilege, status, is_active, created_at`,
      [
        SUPER_ADMIN.username,
        SUPER_ADMIN.email.toLowerCase(),
        passwordHash,
        SUPER_ADMIN.fullName,
        SUPER_ADMIN.role,
        SUPER_ADMIN.privilege,
        SUPER_ADMIN.status,
        SUPER_ADMIN.isActive
      ]
    );

    const created = result.rows[0];
    console.log('[seed] Super admin created successfully.');
    console.log('[seed]   id        :', created.id);
    console.log('[seed]   username  :', created.username);
    console.log('[seed]   email     :', created.email);
    console.log('[seed]   full_name :', created.full_name);
    console.log('[seed]   role      :', created.role);
    console.log('[seed]   privilege :', created.privilege);
    console.log('[seed]   status    :', created.status);
    console.log('[seed]   is_active :', created.is_active);
    console.log('[seed]   password  : bcrypt-hashed (' + (passwordHash.length) + ' chars)');
    process.exit(0);

  } catch (err) {
    console.error('[seed] Error:', err.message);
    process.exit(1);
  }
}

main();
