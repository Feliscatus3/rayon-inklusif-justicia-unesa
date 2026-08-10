require('dotenv').config();
const BASE = 'http://localhost:8899';
const cookieJar = {};

function jar() {
  return Object.keys(cookieJar).map((k) => k + '=' + cookieJar[k]).join('; ');
}
function saveCookies(res) {
  const sc = res.headers.get('set-cookie') || '';
  const parts = sc.split(',');
  parts.forEach((p) => {
    const m = p.match(/^([^=]+)=([^;]*)/);
    if (m) cookieJar[m[1]] = m[2];
  });
}

async function call(method, path, body, extraHeaders) {
  const headers = Object.assign({}, extraHeaders || {});
  const j = jar();
  if (j) headers['cookie'] = j;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual'
  });
  saveCookies(res);
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch (e) {}
  console.log('');
  console.log('=== ' + method + ' ' + path + ' => ' + res.status);
  console.log('  cookies now: ' + JSON.stringify(cookieJar));
  console.log('  body: ' + JSON.stringify(data));
  return { status: res.status, data, headers: res.headers };
}

(async () => {
  await call('POST', '/api/auth/login', { username: 'nizarfazari193', password: 'nizarfazari889' });
  await call('GET', '/api/auth/me');
  await call('GET', '/api/users');
  await call('GET', '/api/users?search=&page=1&limit=10');
  await call('GET', '/api/settings');
  await call('PUT', '/api/settings', { site_name: 'Kader Panel', org_name: 'PMII Rayon Inklusif Justicia' });
  await call('GET', '/api/admin?action=stats');
  await call('GET', '/api/events');
  await call('GET', '/api/announcements');
  await call('POST', '/api/auth/logout');
  await call('GET', '/api/auth/me');
  process.exit(0);
})();
