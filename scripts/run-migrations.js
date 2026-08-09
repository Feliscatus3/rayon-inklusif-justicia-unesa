const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

/**
 * Split SQL file into individual statements, handling:
 * - Dollar-quoted strings ($$ ... $$)
 * - Single-quoted strings
 * - Comments (-- ...)
 * - Multi-line statements
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];
    
    // Handle block comments /* ... */
    if (!inDollarQuote && !inSingleQuote && !inDoubleQuote && !inLineComment) {
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        current += '/*';
        i++;
        continue;
      }
    }
    
    if (inBlockComment) {
      current += ch;
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        current += '/';
        i++;
      }
      continue;
    }
    
    // Handle line comments -- ...
    if (!inDollarQuote && !inSingleQuote && !inDoubleQuote && !inBlockComment) {
      if (ch === '-' && next === '-') {
        inLineComment = true;
        current += '--';
        i++;
        continue;
      }
    }
    
    if (inLineComment) {
      current += ch;
      if (ch === '\n') {
        inLineComment = false;
      }
      continue;
    }
    
    // Handle dollar quotes $$ ... $$ or $tag$ ... $tag$
    if (!inSingleQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
      if (ch === '$') {
        // Check if this starts a dollar quote
        let tag = '$';
        let j = i + 1;
        while (j < sql.length && sql[j] !== '$' && /[a-zA-Z0-9_]/.test(sql[j])) {
          tag += sql[j];
          j++;
        }
        if (j < sql.length && sql[j] === '$') {
          tag += '$';
          if (!inDollarQuote) {
            inDollarQuote = true;
            dollarTag = tag;
          } else if (tag === dollarTag) {
            inDollarQuote = false;
            dollarTag = '';
          }
          // Add the whole tag to current
          for (let k = 0; k < tag.length; k++) {
            current += sql[i + k];
          }
          i += tag.length - 1;
          continue;
        }
      }
    }
    
    // Handle single quotes
    if (!inDollarQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
      if (ch === "'" && (i === 0 || sql[i - 1] !== '\\')) {
        inSingleQuote = !inSingleQuote;
      }
    }
    
    // Handle double quotes (identifiers)
    if (!inDollarQuote && !inSingleQuote && !inLineComment && !inBlockComment) {
      if (ch === '"' && (i === 0 || sql[i - 1] !== '\\')) {
        inDoubleQuote = !inDoubleQuote;
      }
    }
    
    current += ch;
    
    // Statement terminator
    if (ch === ';' && !inDollarQuote && !inSingleQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
    }
  }
  
  // Add any remaining
  const remaining = current.trim();
  if (remaining.length > 0) {
    statements.push(remaining);
  }
  
  return statements.filter(s => s.length > 0 && !s.startsWith('--'));
}

const migrationFiles = [
  'migration.sql',
  'migration-v2.sql',
  'migration-v3.sql',
  'migration-v4.sql',
  'migration-v5.sql',
  'migration-v6.sql',
  'migration-v7.sql',
  'migration-settings.sql',
  'migration-audit.sql',
  'migration-v8.sql'
];

async function runMigration(filename) {
  const filepath = path.join(__dirname, '..', 'sql', filename);
  const sql = fs.readFileSync(filepath, 'utf8');
  console.log(`\n=== Running ${filename} ===`);
  
  const statements = splitSqlStatements(sql);
  console.log(`  Parsed ${statements.length} statements`);
  
  // Clean statements: strip leading comments and whitespace (handle \r\n and \n)
  const cleanedStatements = statements
    .map(s => s.trim())
    .map(s => s.replace(/^(?:--[^\r\n]*[\r\n]+)+/, ''))  // Remove leading -- comment lines
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`  Cleaned to ${cleanedStatements.length} statements`);
  cleanedStatements.forEach((s, i) => console.log(`    [${i+1}] ${s.substring(0, 60)}...`));
  
  for (let idx = 0; idx < cleanedStatements.length; idx++) {
    const stmt = cleanedStatements[idx];
    try {
      await pool.query(stmt);
      const preview = stmt.replace(/\s+/g, ' ').substring(0, 80);
      console.log(`  ✓ [${idx + 1}/${statements.length}] ${preview}...`);
    } catch (err) {
      // Check if it's a "already exists" error which is OK for IF NOT EXISTS
      if (err.code === '42P07' || err.message.includes('already exists') || 
          err.message.includes('duplicate key') || err.code === '42710') {
        console.log(`  ⊘ [${idx + 1}/${statements.length}] (already exists, OK)`);
      } else {
        console.error(`  ✗ FAILED [${idx + 1}/${statements.length}]: ${err.message}`);
        console.error(`     Statement: ${stmt.substring(0, 200)}`);
        throw err;
      }
    }
  }
}

async function main() {
  console.log('Starting migration run...');
  console.log('Database:', new URL(process.env.DATABASE_URL).host);
  
  try {
    for (const file of migrationFiles) {
      await runMigration(file);
    }
    console.log('\n✓ All migrations completed successfully!');
    
    // Verify tables
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename
    `);
    console.log('\nTables in database:');
    tables.rows.forEach(r => console.log('  -', r.tablename));
    
    // Verify key columns
    const usersCols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='users' ORDER BY ordinal_position
    `);
    console.log('\nUsers table columns:');
    usersCols.rows.forEach(r => console.log('  -', r.column_name, r.data_type));
    
    // Verify events/announcements created_by type
    const eventsCols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='events' ORDER BY ordinal_position
    `);
    console.log('\nEvents table columns:');
    eventsCols.rows.forEach(r => console.log('  -', r.column_name, r.data_type));
    
    const announcementsCols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='announcements' ORDER BY ordinal_position
    `);
    console.log('\nAnnouncements table columns:');
    announcementsCols.rows.forEach(r => console.log('  -', r.column_name, r.data_type));
    
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();