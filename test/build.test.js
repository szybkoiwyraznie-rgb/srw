/**
 * Test artefaktu: build musi wyprodukować działający, samowystarczalny plik
 * z wstrzykniętymi danymi i treścią skryptu epizodu.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbuduj } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'srw-build-')), 'index.html');

let html = '';
test('build kończy się sukcesem', async () => {
  await zbuduj({ out });
  html = fs.readFileSync(out, 'utf8');
  assert.ok(html.length > 10_000, 'artefakt podejrzanie mały');
});

test('artefakt ma dane i dokładnie jeden blok skryptu', () => {
  assert.match(html, /globalThis\.SRW_DATA = \{/);
  assert.equal((html.match(/<\/script>/g) ?? []).length, 1, 'dane nie mogą zamykać bloku skryptu');
});

test('artefakt zawiera treść bazy i surowy skrypt epizodu', () => {
  assert.match(html, /SRW Database/);
  assert.match(html, /Super Robot Wars OE/);
  assert.match(html, /Pochodzi z Japonii/, 'treść strony ma być w artefakcie');
  assert.match(html, /Stacja Connect/, 'surowy skrypt epizodu ma być widoczny w witrynie');
});

test('artefakt jest samowystarczalny (bez zewnętrznych zasobów)', () => {
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(html), 'styl jest wstrzykiwany, nie linkowany');
  assert.ok(!/<script[^>]+src=/.test(html), 'skrypt jest wstrzykiwany, nie linkowany');
  assert.match(html, /<style>/);
});

test('artefakt nie jest indeksowany przez wyszukiwarki', () => {
  assert.match(html, /content="noindex, nofollow"/);
});

test('artefakt zawiera okno podglądu ilustracji', () => {
  assert.match(html, /<dialog class="podglad" id="podglad" aria-label="Podgląd ilustracji">/);
  assert.match(html, /class="ilustracja-otworz" data-pelny-ekran/);
  assert.match(html, /data-obraz/);
});
