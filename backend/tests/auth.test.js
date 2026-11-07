import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

await test('Authentication API and guards', async t => {
  process.env.DB_PATH = ':memory:';
  process.env.REGISTER_RATE_LIMIT = '100';
  process.env.JWT_SECRET = 'test-secret-'.repeat(5);
  const { app } = await import('../src/app.js');
  const { db } = await import('../src/database/connection.js');
  const { migrate } = await import('../src/database/migrate.js');
  const { seedMovies } = await import('../src/database/seed.js');
  const { authenticate } = await import('../src/middleware/authenticate.js');
  const { errorHandler } = await import('../src/middleware/error-handler.js');
  migrate();
  seedMovies();

  // Route ini hanya ada di server pengujian untuk memeriksa middleware.
  const harness = express();
  harness.get('/test-profile', authenticate, (request, response) => response.json(request.user));
  harness.use(app);
  harness.use(errorHandler);
  const server = harness.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    db.close();
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function post(path, body, status) {
    const response = await fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await response.json();
    assert.equal(response.status, status, JSON.stringify(data));
    return data;
  }
  async function profile(token, status) {
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    const response = await fetch(base + '/test-profile', { headers });
    assert.equal(response.status, status);
    if (status === 401) assert.equal(response.headers.get('www-authenticate'), 'Bearer');
    return response.json();
  }

  const account = { username: ' Alice ', email: ' ALICE@example.com ', password: 'correct-password' };
  let login;
  await t.test('register stores bcrypt and returns only public user fields', async () => {
    const { user } = await post('/api/auth/register', account, 201);
    assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'username']);
    assert.equal(user.username, 'Alice');
    assert.equal(user.email, 'alice@example.com');
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    assert.match(row.password_hash, /^\$2[aby]\$12\$/);
    assert.ok(await bcrypt.compare(account.password, row.password_hash));
  });
  await t.test('duplicate email including concurrent requests returns 409', async () => {
    await post('/api/auth/register', { ...account, email: 'alice@EXAMPLE.com' }, 409);
    const results = await Promise.all([1, 2].map(() => fetch(base + '/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...account, email: 'concurrent@example.com' })
    })));
    assert.deepEqual(results.map(response => response.status).sort(), [201, 409]);
    await Promise.all(results.map(response => response.json()));
  });
  await t.test('login succeeds and credentials failures have the same response', async () => {
    login = await post('/api/auth/login', account, 200);
    assert.equal(typeof login.token, 'string');
    assert.equal(login.user.email, 'alice@example.com');
    assert.equal(login.user.password_hash, undefined);
    const claims = jwt.verify(login.token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'filmlog-api', audience: 'filmlog'
    });
    assert.equal(claims.exp - claims.iat, 7 * 24 * 60 * 60);
    const wrong = await post('/api/auth/login', { ...account, password: 'wrong' }, 401);
    const absent = await post('/api/auth/login', { ...account, email: 'unknown@example.com' }, 401);
    assert.deepEqual(wrong, absent);
  });
  await t.test('reject invalid types, empty values, short and oversized passwords', async () => {
    for (const field of ['username', 'email', 'password']) {
      for (const value of [null, {}, { trim: 123 }, [], 42, false, '']) {
        await post('/api/auth/register', { ...account, [field]: value }, 400);
      }
    }
    for (const body of [[], null, {}, { ...account, username: '   ' },
      { ...account, password: 'short' }, { ...account, email: 'invalid' },
      { ...account, password: 'é'.repeat(37) }]) {
      await post('/api/auth/register', body, 400);
    }
    await post('/api/auth/register', { ...account, email: 'boundary@example.com', password: 'é'.repeat(36) }, 201);
    const malformed = await fetch(base + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email":'
    });
    assert.equal(malformed.status, 400);
    await malformed.text();
  });
  await t.test('middleware accepts valid identity and rejects invalid token claims', async () => {
    const user = await profile(login.token, 200);
    assert.equal(user.id, login.user.id);
    assert.equal(user.password_hash, undefined);
    const options = { algorithm: 'HS256', subject: String(user.id), issuer: 'filmlog-api', audience: 'filmlog', expiresIn: '1h' };
    const invalid = [
      undefined, 'broken', login.token + 'x',
      jwt.sign({}, 'another-secret-'.repeat(4), options),
      jwt.sign({}, process.env.JWT_SECRET, { ...options, expiresIn: -1 }),
      jwt.sign({}, process.env.JWT_SECRET, { ...options, notBefore: '1h' }),
      jwt.sign({}, process.env.JWT_SECRET, { ...options, algorithm: 'HS384' }),
      jwt.sign({}, process.env.JWT_SECRET, { ...options, issuer: 'other-app' }),
      jwt.sign({}, process.env.JWT_SECRET, { ...options, audience: 'other-app' }),
      jwt.sign({}, process.env.JWT_SECRET, { ...options, subject: '9999' }),
      jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, { issuer: 'filmlog-api', audience: 'filmlog' })
    ];
    for (const token of invalid) await profile(token, 401);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    await profile(login.token, 401);
  });
  await t.test('public health and catalog remain accessible', async () => {
    const health = await fetch(base + '/api/health');
    assert.equal(health.status, 200);
    await health.json();
    const movies = await fetch(base + '/api/movies');
    assert.equal(movies.status, 200);
    assert.equal((await movies.json()).length, 20);
  });
  await t.test('Express serves frontend and fallback while backend files stay private', async () => {
    for (const path of ['/', '/app.js', '/data/movies.json']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      const body = await response.text();
      assert.ok(body.length > 0);
      if (path === '/') assert.match(body, /FilmLog/);
      if (path === '/data/movies.json') assert.equal(JSON.parse(body).length, 20);
    }
    for (const path of ['/.env', '/backend/.env', '/storage/filmlog.sqlite', '/src/config/env.js']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 404, path);
      await response.text();
    }
  });

});

