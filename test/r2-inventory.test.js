import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { inventory, validateConfig } from '../tools/r2-inventory.mjs';

const env = {
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  R2_ENDPOINT: `https://${'a'.repeat(32)}.r2.cloudflarestorage.com`,
  R2_BUCKET: 'srw-images',
  R2_PUBLIC_BASE_URL: 'https://public.example/images/',
};
const config = validateConfig(env);
const now = () => new Date('2026-10-18T18:00:00Z');
const object = (Key, Size = 123) => ({ Key, Size, LastModified: '2026-10-18T17:00:00Z', ETag: '"etag"' });
const page = value => async () => ({ stdout: JSON.stringify(value) });

test('R2: wymaga konfiguracji bez ujawniania jej wartości', () => {
  for (const key of Object.keys(env)) {
    assert.throws(() => validateConfig({ ...env, [key]: '' }), /Brak konfiguracji/);
  }
  assert.equal(config.publicBase, 'https://public.example/images');
});

test('R2: klucze nie mogą być wysyłane do innego hosta ani przez HTTP', () => {
  for (const endpoint of ['https://example.com', env.R2_ENDPOINT.replace('https:', 'http:'),
    `${env.R2_ENDPOINT}/bucket`, `${env.R2_ENDPOINT}?key=secret`, `${env.R2_ENDPOINT}#fragment`,
    env.R2_ENDPOINT.replace('https://', 'https://user:password@')]) {
    assert.throws(() => validateConfig({ ...env, R2_ENDPOINT: endpoint }));
  }
  assert.throws(() => validateConfig({ ...env, R2_PUBLIC_BASE_URL: 'javascript:alert(1)' }));
  assert.throws(() => validateConfig({ ...env, R2_BUCKET: '--unsafe' }));
});

test('R2: obsługuje pusty bucket', async () => {
  const result = await inventory(config, page({ IsTruncated: false }), now);
  assert.equal(result.objectCount, 0);
  assert.equal(result.totalBytes, 0);
  assert.deepEqual(result.objects, []);
  assert.equal(result.generatedAt, now().toISOString());
});

test('R2: paginacja, sortowanie i bezpieczne kodowanie publicznych adresów', async () => {
  const calls = [];
  const run = async (command, args) => {
    calls.push({ command, args });
    if (calls.length === 1) return { stdout: JSON.stringify({
      EncodingType: 'url', Contents: [object('Seishiro.jpg', 200), object('folder%2F', 0)],
      IsTruncated: true, NextContinuationToken: 'next-token',
    }) };
    return { stdout: JSON.stringify({ EncodingType: 'url', IsTruncated: false,
      Contents: [object('Exart.jpg', 100), object('folder%2Fza%C5%BC%C3%B3%C5%82%C4%87%20%231%3F%25.jpg', 300)],
    }) };
  };
  const result = await inventory(config, run, now);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].command, 'aws');
  assert.equal(calls[0].args[1], 'list-objects-v2');
  assert.ok(calls[0].args.includes('--no-paginate'));
  assert.ok(!calls[0].args.includes('--continuation-token'));
  assert.equal(calls[1].args.at(-1), 'next-token');
  assert.equal(result.objectCount, 3);
  assert.equal(result.totalBytes, 600);
  assert.deepEqual(result.objects.map(o => o.key), ['Exart.jpg', 'Seishiro.jpg', 'folder/zażółć #1?%.jpg']);
  assert.equal(result.objects[2].url, 'https://public.example/images/folder/za%C5%BC%C3%B3%C5%82%C4%87%20%231%3F%25.jpg');
  assert.ok(!JSON.stringify(result).includes(env.AWS_SECRET_ACCESS_KEY));
  assert.ok(!JSON.stringify(result).includes(config.endpoint));
});

test('R2: przerwana lub zapętlona paginacja nie daje pozornie pełnej listy', async () => {
  await assert.rejects(inventory(config, page({ IsTruncated: true })), /paginacja/);
  await assert.rejects(inventory(config, page({ IsTruncated: true, NextContinuationToken: 'same' })), /paginacja/);
});

test('R2: błędy AWS i niepoprawny JSON nie wyciekają do komunikatów', async () => {
  for (const run of [async () => { throw new Error('test-secret-key signed request'); },
    async () => ({ stdout: 'test-secret-key malformed JSON' })]) {
    await assert.rejects(inventory(config, run), error => {
      assert.match(error.message, /Nie udało się odczytać R2/);
      assert.ok(!error.message.includes('test-secret-key'));
      return true;
    });
  }
});

test('R2: odrzuca błędne metadane i nazwy normalizowane przez przeglądarkę', async () => {
  for (const value of [null, [], { Contents: {} }, { IsTruncated: 'false' },
    { Contents: [object('bad', -1)] }, { Contents: [object('bad', '123')] },
    { Contents: [{ ...object('bad'), LastModified: 'not-a-date' }] },
    { EncodingType: 'url', Contents: [object('%XX')] },
    { Contents: [object('../escape.jpg')] }, { Contents: [object('folder/./escape.jpg')] }]) {
    await assert.rejects(inventory(config, page(value)));
  }
});

test('R2: CLI bez konfiguracji kończy się błędem zanim spróbuje połączenia', () => {
  const result = spawnSync(process.execPath, ['tools/r2-inventory.mjs', '/tmp/unused-r2-output.json'], {
    env: { ...process.env, AWS_ACCESS_KEY_ID: '', AWS_SECRET_ACCESS_KEY: '' }, encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Brak konfiguracji: AWS_ACCESS_KEY_ID/);
});

test('R2: workflow jest ręczny lub wywołany plikiem-żądaniem, ma minimalne uprawnienia i publikuje tylko manifest', () => {
  const workflow = readFileSync(new URL('../.github/workflows/r2-inventory.yml', import.meta.url), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  // Jedyny trigger push dotyczy pliku-żądania; żaden PR ani harmonogram nie dostaje sekretów.
  assert.match(workflow, /push:\n\s+paths:\n\s+- '\.github\/r2-inventory-request'/);
  assert.doesNotMatch(workflow, /^\s*pull_request(?:_target)?:/m);
  assert.doesNotMatch(workflow, /^\s*schedule:/m);
  assert.match(workflow, /contents: read/);
  assert.doesNotMatch(workflow, /: write/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /if-no-files-found: error/);
  assert.match(workflow, /retention-days: 7/);
  assert.match(workflow, /secrets\.R2_ACCESS_KEY_ID/);
  assert.match(workflow, /secrets\.R2_SECRET_ACCESS_KEY/);
  assert.match(workflow, /vars\.R2_ENDPOINT/);
  assert.match(workflow, /::notice title=R2 inventory::/);
});
