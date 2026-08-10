require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const dir = __dirname;
const out = fs.openSync(path.join(dir, '_out.log'), 'w');
const errOut = fs.openSync(path.join(dir, '_err.log'), 'w');

const srv = spawn(process.execPath, [path.join(dir, '_harness.js')], { cwd: dir, stdio: ['ignore', out, errOut] });

setTimeout(() => {
  const test = spawn(process.execPath, [path.join(dir, '_apitest.js')], { cwd: dir, stdio: ['ignore', out, errOut] });
  test.on('close', () => {
    try { srv.kill(); } catch (e) {}
    fs.closeSync(out);
    fs.closeSync(errOut);
    process.exit(0);
  });
}, 3000);
