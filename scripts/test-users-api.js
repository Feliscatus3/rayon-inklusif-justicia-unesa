require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const http = require('http');
const usersHandler = require('../api/users.js');
const authHandler = require('../api/auth.js');

function createMockReq(method, url, body = null, headers = {}) {
  return {
    method,
    url,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    query: {},
    body,
    on: (event, cb) => {
      if (event === 'data' && body) cb(Buffer.from(JSON.stringify(body)));
      if (event === 'end') cb();
    }
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    _ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    removeHeader(name) {
      delete this.headers[name.toLowerCase()];
    },
    append(name, value) {
      const existing = this.headers[name.toLowerCase()];
      if (existing) {
        this.headers[name.toLowerCase()] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        this.headers[name.toLowerCase()] = value;
      }
    },
    writeHead(code, h) {
      this.statusCode = code;
      if (h) Object.assign(this.headers, h);
    },
    write(data) {
      this.body = (this.body || '') + data;
    },
    end(data) {
      if (data) this.write(data);
      this._ended = true;
    },
    json(data) {
      this.setHeader('content-type', 'application/json');
      this.end(JSON.stringify(data));
    }
  };
  return res;
}

async function testUsersList(token) {
  console.log('\n=== Testing GET /api/users ===');
  const req = createMockReq('GET', '/api/users', null, { cookie: `session_token=${token}` });
  const res = createMockRes();
  await usersHandler(req, res);
  console.log('Status:', res.statusCode);
  console.log('Body:', res.body);
  return JSON.parse(res.body);
}

async function testUsersListAll(token) {
  console.log('\n=== Testing GET /api/users (all) ===');
  const req = createMockReq('GET', '/api/users', null, { cookie: `session_token=${token}` });
  const res = createMockRes();
  await usersHandler(req, res);
  console.log('Status:', res.statusCode);
  console.log('Body:', res.body);
  return JSON.parse(res.body);
}

async function testLogin() {
  console.log('\n=== Testing POST /api/auth/login ===');
  const req = createMockReq('POST', '/api/auth/login', { username: 'nizarfazari193', password: 'nizarfazari889' });
  const res = createMockRes();
  await authHandler(req, res);
  console.log('Login Status:', res.statusCode);
  
  let token = null;
  const cookies = res.headers['set-cookie'];
  if (cookies) {
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const sessionCookie = cookieArray.find(c => c && c.startsWith('session_token='));
    if (sessionCookie) {
      token = sessionCookie.split(';')[0].split('=')[1];
      console.log('Session token:', token);
    }
  }
  return token;
}

async function runTests() {
  try {
    const token = await testLogin();
    
    if (token) {
      await testUsersListAll(token);
      await testUsersList(token);
    } else {
      console.log('No session token received');
    }
    
    console.log('\n=== All tests completed ===');
  } catch (err) {
    console.error('Test failed:', err);
    console.error(err.stack);
    process.exit(1);
  }
}

runTests();