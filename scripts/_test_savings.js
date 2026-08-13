require('dotenv').config();
const { query } = require('../lib/db');
const csrf = require('../lib/csrf');
const handler = require('../api/savings.js');

function mockRes(){
  const h = {};
  return {
    _status: 200, _body: null,
    status: function(c){ this._status = c; return this; },
    json: function(o){ this._body = o; return this; },
    setHeader: function(k,v){ h[k]=v; },
    getHeader: function(k){ return h[k]; },
    removeHeader: function(k){ delete h[k]; },
    end: function(){},
    writeHead: function(){}
  };
}
function makeReq(pathObj){
  const r = {
    method: 'POST',
    headers: {},
    query: pathObj,
    url: pathObj.__path,
    socket: { remoteAddress: '127.0.0.1' },
    body: undefined,
    on: function(){}, destroy: function(){}
  };
  return r;
}
(async () => {
  try {
    // find an active session for a user with admin privilege (role OR privilege)
    const s = await query(`
      SELECT s.token, u.id, u.username, u.role, u.privilege, u.status
      FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.expires_at > NOW() AND u.status='active'
      ORDER BY s.expires_at DESC LIMIT 5`);
    console.log('sessions available:', s.rows.length);
    if (!s.rows.length) { console.log('NO valid sessions in DB'); return; }
    const active = s.rows.find(r => r.role==='admin' || r.role==='super_admin' || r.privilege==='admin' || r.privilege==='super_admin') || s.rows[0];
    console.log('using user:', active.username, 'role=', active.role, 'priv=', active.privilege);

    // CSRF: valid signed cookie + header
    const signed = csrf.createSignedToken();
    const cookie = 'session_token=' + active.token + '; csrf_token=' + signed.token + '.' + signed.signature;

    // Test 1: create category
    let res = mockRes();
    let req = makeReq({ __path: '/api/savings/categories' });
    req.headers = { cookie, 'x-csrf-token': signed.token, 'content-type': 'application/json', host: 'localhost' };
    req.body = { name: 'Uji Kategori ' + Date.now(), description: 'harness test' };
    await handler(req, res);
    console.log('CREATE CATEGORY ->', res._status, JSON.stringify(res._body));

    // Test 2: create transaction with that category
    const catId = (res._body && res._body.category && res._body.category.id) || null;
    if (catId) {
      res = mockRes();
      req = makeReq({ __path: '/api/savings/transactions' });
      req.headers = { cookie, 'x-csrf-token': signed.token, 'content-type': 'application/json', host: 'localhost' };
      req.body = { category_id: catId, amount: 37500, payment_method: 'QRIS' };
      await handler(req, res);
      console.log('CREATE TXN ->', res._status, JSON.stringify(res._body));
    } else {
      console.log('could not create txn (no category id)');
    }
  } catch (e) { console.log('HARNESS ERROR:', e.message, e.stack); }
  finally { process.exit(0); }
})();

