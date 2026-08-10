require('dotenv').config();
const http = require('http');
const url = require('url');

const handlers = {
  '/api/auth': require('../api/auth'),
  '/api/users': require('../api/users'),
  '/api/settings': require('../api/settings'),
  '/api/admin': require('../api/admin'),
  '/api/events': require('../api/events'),
  '/api/announcements': require('../api/announcements'),
  '/api/organization': require('../api/organization'),
  '/api/health': require('../api/health')
};

const PORT = 8899;

function route(pathname) {
  const candidates = Object.keys(handlers).filter((p) => pathname === p || pathname.startsWith(p + '/'));
  candidates.sort((a, b) => b.length - a.length);
  return candidates.length ? handlers[candidates[0]] : null;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const handler = route(parsed.pathname);

  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (obj) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(res.statusCode);
    }
    res.end(JSON.stringify(obj));
  };
  res.append = function (name, value) {
    const existing = res.getHeader(name);
    if (Array.isArray(existing)) res.setHeader(name, existing.concat(value));
    else if (existing) res.setHeader(name, [existing, value]);
    else res.setHeader(name, value);
  };

  if (!handler) { res.status(404).json({ error: 'no handler' }); return; }

  req.query = parsed.query;
  if (!req.query.__path) req.query.__path = parsed.pathname;
  req.url = parsed.pathname + (parsed.search || '');

  Promise.resolve(handler(req, res)).catch((err) => {
    console.error('HARNESS ERROR', err);
    if (!res.headersSent) res.status(500).json({ error: 'harness error' });
  });
});

server.listen(PORT, async () => {
  console.log('listening on', PORT);
  await runTests();
  server.close();
  process.exit(0);
});

const cookieJar = {};
function jar() { return Object.keys(cookieJar).map((k) => k + '=' + cookieJar[k]).join('; '); }
function saveCookies(res) {
  const sc = res.headers.get('set-cookie');
  if (!sc) return;
  String(sc).split(',').forEach((p) => {
    const m = p.match(/^([^=]+)=([^;]*)/);
    if (m) cookieJar[m[1]] = m[2];
  });
}
async function call(method, path, body, extraHeaders) {
  const headers = Object.assign({}, extraHeaders || {});
  const j = jar();
  if (j) headers['cookie'] = j;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch('http://localhost:' + PORT + path, {
    method, headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual'
  });
  saveCookies(res);
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch (e) {}
  console.log('');
  console.log('=== ' + method + ' ' + path + ' => ' + res.status);
  console.log('  body: ' + JSON.stringify(data));
  return { status: res.status, data };
}

async function runTests() {
  await call('POST', '/api/auth/login', { username: 'nizarfazari193', password: 'nizarfazari889' });
  await call('GET', '/api/auth/me');
  await call('GET', '/api/users?search=&page=1&limit=10');
  await call('GET', '/api/settings');
  await call('PUT', '/api/settings', { site_name: 'Kader Panel', org_name: 'PMII Rayon Inklusif Justicia' });
  await call('GET', '/api/admin?action=stats');
  await call('GET', '/api/events');
  await call('GET', '/api/announcements');
  await call('GET', '/api/organization');
  await call('POST', '/api/auth/logout');
  await call('GET', '/api/auth/me');
}
