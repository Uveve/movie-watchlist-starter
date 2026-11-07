import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import jwt from 'jsonwebtoken';

await test('Watchlist and watched API', async t => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'watchlist-test-secret-'.repeat(3);
  const { app } = await import('../src/app.js');
  const { db } = await import('../src/database/connection.js');
  const { migrate } = await import('../src/database/migrate.js');
  const { seedMovies } = await import('../src/database/seed.js');
  migrate();
  seedMovies();
  const tokens = [];
  for (const id of [1, 2]) {
    db.prepare('INSERT INTO users (id,username,email,password_hash) VALUES (?,?,?,?)')
      .run(id, 'User ' + id, 'user' + id + '@example.com', 'test-fixture');
    tokens.push(jwt.sign({}, process.env.JWT_SECRET, {
      algorithm: 'HS256', subject: String(id), expiresIn: '1h',
      issuer: 'filmlog-api', audience: 'filmlog'
    }));
  }
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    db.close();
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(method, path, token, body) {
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = response.status === 204 ? await response.text() : await response.json();
    return { status: response.status, data };
  }
  async function expect(method, path, status, token, body) {
    const result = await request(method, path, token, body);
    assert.equal(result.status, status, JSON.stringify(result));
    return result.data;
  }

  await t.test('all private endpoints reject missing, tampered and expired JWTs', async () => {
    const expired = jwt.sign({}, process.env.JWT_SECRET, {
      subject: '1', expiresIn: -1, issuer: 'filmlog-api', audience: 'filmlog'
    });
    for (const token of [undefined, tokens[0] + 'x', expired]) {
      for (const [method, path] of [
        ['GET', '/api/watchlist'], ['POST', '/api/watchlist'], ['DELETE', '/api/watchlist/7'],
        ['GET', '/api/watched'], ['POST', '/api/watched']
      ]) await expect(method, path, 401, token);
    }
  });

  await t.test('watchlist returns movies and prevents concurrent duplicates', async () => {
    assert.deepEqual(await expect('GET', '/api/watchlist', 200, tokens[0]), []);
    const entry = await expect('POST', '/api/watchlist', 201, tokens[0], { movieId: 7, movie_id: 7 });
    assert.equal(entry.movie.title, 'Whiplash');
    assert.equal(entry.movie_id, 7);
    assert.ok(Number.isFinite(Date.parse(entry.created_at)));
    await expect('POST', '/api/watchlist', 409, tokens[0], { movieId: 7 });
    const results = await Promise.all([1, 2].map(() =>
      request('POST', '/api/watchlist', tokens[0], { movieId: 8 })));
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    const list = await expect('GET', '/api/watchlist', 200, tokens[0]);
    assert.equal(list.length, 2);
    assert.ok(Array.isArray(list[0].movie.genres));
  });

  await t.test('ownership comes from token even when the body supplies another user ID', async () => {
    assert.deepEqual(await expect('GET', '/api/watchlist', 200, tokens[1]), []);
    await expect('DELETE', '/api/watchlist/7', 404, tokens[1]);
    await expect('POST', '/api/watchlist', 201, tokens[1], { movieId: 7, userId: 1, user_id: 1 });
    assert.equal((await expect('GET', '/api/watchlist', 200, tokens[1])).length, 1);
    assert.equal(await expect('DELETE', '/api/watchlist/7', 204, tokens[1]), '');
    assert.equal((await expect('GET', '/api/watchlist', 200, tokens[0])).length, 2);
    await expect('DELETE', '/api/watchlist/7', 404, tokens[1]);
  });

  await t.test('movie ID validation and unknown movie handling preserve data', async () => {
    for (const value of [null, true, {}, [], 0, -1, 1.5, 'abc', '1 OR 1=1', Number.MAX_SAFE_INTEGER + 1]) {
      await expect('POST', '/api/watchlist', 400, tokens[0], { movieId: value });
      await expect('POST', '/api/watched', 400, tokens[0], { movieId: value, rating: 5, review: 'Valid' });
    }
    for (const body of [[], null, {}]) await expect('POST', '/api/watchlist', 400, tokens[0], body);
    await expect('POST', '/api/watchlist', 404, tokens[0], { movieId: 999 });
    await expect('POST', '/api/watched', 404, tokens[0], { movieId: 999, rating: 5, review: 'Valid' });
    await expect('DELETE', '/api/watchlist/invalid', 400, tokens[0]);
    assert.equal((await expect('GET', '/api/watchlist', 200, tokens[0])).length, 2);
    assert.equal(db.prepare('SELECT count(*) AS total FROM reviews').get().total, 0);
  });

  await t.test('invalid ratings and reviews return 400 without creating entries', async () => {
    for (const rating of [0, 6, 2.5, '5', null, {}, true]) {
      await expect('POST', '/api/watched', 400, tokens[0], { movieId: 7, rating, review: 'Valid' });
    }
    for (const review of ['', '   ', null, {}, { trim: 123 }, [], 'x'.repeat(2001), '\0text']) {
      await expect('POST', '/api/watched', 400, tokens[0], { movieId: 7, rating: 5, review });
    }
    assert.equal(db.prepare('SELECT count(*) AS total FROM reviews').get().total, 0);
  });

  await t.test('viewing history supports rewatches and separates catalog and user ratings', async () => {
    const first = await expect('POST', '/api/watched', 201, tokens[0], {
      movieId: 7, rating: 4, review: ' First viewing ', userId: 2
    });
    const second = await expect('POST', '/api/watched', 201, tokens[0], {
      movieId: '7', movie_id: 7, rating: 5, review: 'Second viewing', opinion: 'Second viewing'
    });
    assert.notEqual(first.id, second.id);
    assert.equal(first.review, 'First viewing');
    const history = await expect('GET', '/api/watched', 200, tokens[0]);
    assert.equal(history.length, 2);
    assert.equal(history[0].id, second.id);
    assert.equal(history[0].rating, 5);
    assert.equal(history[0].movie.rating, 8.5);
    assert.ok(Number.isFinite(Date.parse(history[0].created_at)));
    assert.deepEqual(await expect('GET', '/api/watched', 200, tokens[1]), []);
    assert.equal((await expect('GET', '/api/watchlist', 200, tokens[0])).length, 2);
  });

  await t.test('frontend displays review markup as text', async () => {
    const review = '<img src=x onerror="alert(1)">';
    const entry = await expect('POST', '/api/watched', 201, tokens[1], { movieId: 7, rating: 5, review });
    const elements = new Map();
    const context = vm.createContext({
      window: { location: { origin: base } },
      localStorage: { getItem: () => null },
      document: {
        addEventListener() {},
        getElementById(id) {
          if (!elements.has(id)) elements.set(id, { innerHTML: '', classList: { add() {}, remove() {} } });
          return elements.get(id);
        }
      },
      lucide: { createIcons() {} }
    });
    vm.runInContext(readFileSync(new URL('../../frontend/app.js', import.meta.url), 'utf8'), context);
    context.entries = [entry];
    vm.runInContext('state.watchedList = entries; renderWatchedList();', context);
    const html = elements.get('watched-list').innerHTML;
    assert.ok(!html.includes(review));
    assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
  });
});

