const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'migration.sql'), 'utf8');

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
      i++;
      continue;
    }
  }
  
  if (inBlockComment) {
    if (ch === '*' && next === '/') {
      inBlockComment = false;
      i++;
    }
    continue;
  }
  
  if (!inDollarQuote && !inSingleQuote && !inDoubleQuote && !inBlockComment) {
    if (ch === '-' && next === '-') {
      inLineComment = true;
      i++;
      continue;
    }
  }
  
  if (inLineComment) {
    if (ch === '\n') inLineComment = false;
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
          console.log(`START DOLLAR QUOTE at ${i}: tag="${tag}" context: "${sql.substring(Math.max(0,i-20), i+tag.length+20)}"`);
        } else if (tag === dollarTag) {
          inDollarQuote = false;
          console.log(`END DOLLAR QUOTE at ${i}: tag="${tag}" context: "${sql.substring(Math.max(0,i-20), i+tag.length+20)}"`);
          dollarTag = '';
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
  
  if (ch === ';' && !inDollarQuote && !inSingleQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
    console.log(`STATEMENT END at ${i}: inDollarQuote=${inDollarQuote}, inSingleQuote=${inSingleQuote}, inDoubleQuote=${inDoubleQuote}`);
  }
}

console.log('Final state:', { inDollarQuote, dollarTag, inSingleQuote, inDoubleQuote, inLineComment, inBlockComment });