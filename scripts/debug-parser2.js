const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'migration.sql'), 'utf8');

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
    
    if (!inSingleQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
      if (ch === '$') {
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
          for (let k = 0; k < tag.length; k++) {
            current += sql[i + k];
          }
          i += tag.length - 1;
          continue;
        }
      }
    }
    
    if (!inDollarQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
      if (ch === "'" && (i === 0 || sql[i - 1] !== '\\')) {
        inSingleQuote = !inSingleQuote;
      }
    }
    
    if (!inDollarQuote && !inSingleQuote && !inLineComment && !inBlockComment) {
      if (ch === '"' && (i === 0 || sql[i - 1] !== '\\')) {
        inDoubleQuote = !inDoubleQuote;
      }
    }
    
    current += ch;
    
    if (ch === ';' && !inDollarQuote && !inSingleQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
      const stmt = current.trim();
      console.log(`PUSH [${statements.length + 1}]: len=${stmt.length}, starts="${stmt.substring(0, 50)}"`);
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
    }
  }
  
  const remaining = current.trim();
  if (remaining.length > 0) {
    console.log(`PUSH REMAINING: len=${remaining.length}, starts="${remaining.substring(0, 50)}"`);
    statements.push(remaining);
  }
  
  return statements.filter(s => s.length > 0);
}

const statements = splitSqlStatements(sql);
console.log(`\nTotal: ${statements.length} statements`);
statements.forEach((s, i) => {
  const preview = s.replace(/\s+/g, ' ').substring(0, 80);
  console.log(`  [${i+1}] ${preview}...`);
});