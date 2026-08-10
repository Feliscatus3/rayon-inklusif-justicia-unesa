require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function test() {
  try {
    console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);
    
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log('USER COUNT:', countResult.rows[0].count);
    
    const usersResult = await pool.query('SELECT id, username, full_name, email, role, status, privilege, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 50 OFFSET 0');
    console.log('USERS:');
    usersResult.rows.forEach(u => {
      console.log('  -', u.username, u.full_name, u.email, u.role, u.status, u.privilege, u.is_active, u.created_at);
    });
    
    await pool.end();
  } catch (err) {
    console.error('ERROR:', err.message, err.stack);
    process.exit(1);
  }
}

test();