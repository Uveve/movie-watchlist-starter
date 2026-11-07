import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';

test('Rate limits are independent by endpoint', async t => {
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'rate-limit-test-secret-'.repeat(3);
  process.env.GEMINI_API_KEY = 'test';
  process.env.REGISTER_RATE_LIMIT = '5';

  const { app } = await import('../src/app.js');
  const { db } = await import('../src/database/connection.js');
  const { migrate } = await import('../src/database/migrate.js');
  const { seedMovies } = await import('../src/database/seed.js');
  migrate();
  seedMovies();

  const originalFetch = globalThis.fetch;
  let geminiRequests = 0;
  globalThis.fetch = async () => {
    geminiRequests++;
    return Response.json({
      candidates: [{ content: { parts: [{ text: '{"movie_id":"7","reasoning":"Film musik."}' }] } }]
    });
  };

  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await new Promise(resolve => server.close(resolve));
    db.close();
  });
  await once(server, 'listening');
  const baseUrl = 'http://127.0.0.1:' + server.address().port;

  async function request(path, body) {
    return originalFetch(baseUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  const cases = [
    { path: '/api/auth/login', limit: 10, body: {}, expected: 400 },
    { path: '/api/auth/register', limit: 5, body: {}, expected: 400 },
    { path: '/api/movies/recommend', limit: 5, body: { prompt: 'Film musik' }, expected: 200 }
  ];

  for (const { path, limit, body, expected } of cases) {
    for (let index = 0; index < limit; index++) {
      const response = await request(path, body);
      assert.equal(response.status, expected, path);
      await response.text();
    }
    const blocked = await request(path, body);
    assert.equal(blocked.status, 429, path);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    assert.equal(typeof (await blocked.json()).message, 'string');
  }
  assert.equal(geminiRequests, 5);
});

