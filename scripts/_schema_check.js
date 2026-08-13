require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
(async () => {
  try {
    const t = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'saving%' ORDER BY table_name`);
    console.log('tables:', JSON.stringify(t.rows.map(r=>r.table_name)));
    for (const r of t.rows) {
      const c = await pool.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [r.table_name]);
      console.log('--- ' + r.table_name);
      c.rows.forEach(x => console.log('  ' + x.column_name + ' ' + x.data_type + ' null=' + x.is_nullable + (x.column_default ? ' def=' + x.column_default : '')));
    }
    const nonexist = ['saving_categories','saving_transactions','savings_settings'].filter(name => !t.rows.some(r=>r.table_name===name));
    console.log('MISSING tables:', JSON.stringify(nonexist));
    if (t.rows.some(r=>r.table_name==='saving_categories')) { const ex = await pool.query('SELECT id,name,is_active FROM saving_categories LIMIT 5'); console.log('sample cats:', JSON.stringify(ex.rows)); }
    if (t.rows.some(r=>r.table_name==='saving_transactions')) { const ex = await pool.query('SELECT id,user_id,category_id,transaction_code,amount,payment_status FROM saving_transactions LIMIT 5'); console.log('sample tx:', JSON.stringify(ex.rows)); }
    if (t.rows.some(r=>r.table_name==='savings_settings')) { const ex = await pool.query('SELECT * FROM savings_settings'); console.log('savings_settings:', JSON.stringify(ex.rows)); }
  } catch (e) { console.log('DB ERROR:', e.message); }
  finally { await pool.end(); }
})();
