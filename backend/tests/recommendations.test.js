
import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend } from '../src/services/gemini.service.js';

test('Gemini grounding and failure handling', async t => {
  const original = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test';
  t.after(() => { globalThis.fetch = original; });
  let output = { movie_id: '7', reasoning: 'Film musik' };
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.generationConfig.responseSchema.properties.movie_id.enum, ['7', 'OUT_OF_SCOPE']);
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] });
  };
  assert.equal((await recommend('musik', [{ id: 7, catalog_rating: 8.5 }])).movie_id, 7);
  output = { movie_id: 'OUT_OF_SCOPE', reasoning: 'Teks ini tidak boleh diteruskan.' };
  assert.equal(await recommend('Buatkan kode Python', [{ id: 7 }]), null);
  for (const movie_id of [999, true, [], null]) {
    output = { movie_id, reasoning: 'Invalid' };
    await assert.rejects(recommend('musik', [{ id: 7 }]), { status: 502 });
  }
  globalThis.fetch = async () => new Response(null, { status: 429 });
  await assert.rejects(recommend('musik', [{ id: 7 }]), { status: 429 });
  globalThis.fetch = async () => { throw new DOMException('Timeout', 'TimeoutError'); };
  await assert.rejects(recommend('musik', [{ id: 7 }]), { status: 504 });
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(recommend('musik', [{ id: 7 }]), { status: 503 });
});
