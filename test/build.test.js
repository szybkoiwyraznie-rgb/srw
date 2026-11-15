/**
 * Test artefaktu (ADR 0001 + ADR 0041): domyślny build daje powłokę z indeksem
 * i drzewo ciał stron, a tryb jednoplikowy (`--single`) — samowystarczalny plik
 * do otwarcia z dysku.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbuduj } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const katalog = fs.mkdtempSync(path.join(os.tmpdir(), 'srw-build-'));
const out = path.join(katalog, 'index.html');
const outSingle = path.join(katalog, 'single.html');

let powloka = '';
let jednoplik = '';

test('build kończy się sukcesem', async () => {
  await zbuduj({ out });
  powloka = fs.readFileSync(out, 'utf8');
  assert.ok(powloka.length > 10_000, 'artefakt podejrzanie mały');
});

test('powłoka niesie indeks, a nie ciała stron', () => {
  assert.match(powloka, /globalThis\.SRW_TRYB = 'pliki'/);
  assert.match(powloka, /globalThis\.SRW_B64 = "/, 'indeks jest spakowany w powłoce');
  assert.doesNotMatch(powloka, /globalThis\.SRW_DATA = \{/, 'tryb plików nie wstrzykuje całości');
  assert.ok(!powloka.includes('Pochodzi z Japonii'), 'treść strony jedzie w data/, nie w powłoce');
});

test('powłoka ma dokładnie jeden blok skryptu', () => {
  assert.equal((powloka.match(/<\/script>/g) ?? []).length, 1, 'dane nie mogą zamykać bloku skryptu');
});

test('data/ ma ciało każdej strony i osobny indeks tekstowy', () => {
  const katalogDanych = path.join(katalog, 'data');
  const pliki = fs.readdirSync(katalogDanych);
  const strony = pliki.filter((p) => p.endsWith('.json') && !['teksty.json', 'co-nowego.json'].includes(p));
  assert.ok(strony.length > 300, `ciała stron: ${strony.length}`);
  for (const plik of strony) {
    const cialo = JSON.parse(fs.readFileSync(path.join(katalogDanych, plik), 'utf8'));
    assert.ok(Object.keys(cialo).length > 0, `${plik}: puste ciało`);
    for (const pole of Object.keys(cialo)) {
      assert.ok(['html', 'boksy', 'sekcje'].includes(pole), `${plik}: nieoczekiwane pole ${pole}`);
    }
  }
  const teksty = JSON.parse(fs.readFileSync(path.join(katalogDanych, 'teksty.json'), 'utf8'));
  assert.ok(Object.keys(teksty).length >= strony.length, 'teksty do wyszukiwarki są osobnym plikiem');
  const dziennik = JSON.parse(fs.readFileSync(path.join(katalogDanych, 'co-nowego.json'), 'utf8'));
  assert.ok(Array.isArray(dziennik) && dziennik.length > 0, 'dziennik jest osobnym plikiem');
});

test('powłoka jest wielokrotnie mniejsza od trybu jednoplikowego', async () => {
  await zbuduj({ out: outSingle, single: true });
  jednoplik = fs.readFileSync(outSingle, 'utf8');
  assert.match(jednoplik, /globalThis\.SRW_DATA = \{/);
  assert.match(jednoplik, /Pochodzi z Japonii/, 'tryb jednoplikowy ma treść w środku');
  assert.ok(powloka.length < jednoplik.length / 4,
    `powłoka ${(powloka.length / 1024).toFixed(0)} kB vs jednoplik ${(jednoplik.length / 1024).toFixed(0)} kB`);
});

test('tryb jednoplikowy nie tworzy katalogu data/', async () => {
  const inny = fs.mkdtempSync(path.join(os.tmpdir(), 'srw-single-'));
  const plik = path.join(inny, 'index.html');
  await zbuduj({ out: plik, single: true });
  assert.ok(fs.existsSync(plik));
  assert.ok(!fs.existsSync(path.join(inny, 'data')), 'katalog powstaje tylko w trybie plików');
});

test('artefakt nie jest indeksowany przez wyszukiwarki', () => {
  assert.match(powloka, /content="noindex, nofollow"/);
});

test('artefakt zawiera okno podglądu ilustracji', () => {
  assert.match(powloka, /<dialog class="podglad" id="podglad" aria-label="Podgląd ilustracji">/);
  assert.match(powloka, /class="ilustracja-otworz" data-pelny-ekran/);
  assert.match(powloka, /data-obraz/);
});

test('treść strony z galerią niesie zakres gry (dane w pliku ciała)', () => {
  const katalogDanych = path.join(katalog, 'data');
  const wszystkie = fs.readdirSync(katalogDanych)
    .filter((p) => p.endsWith('.json') && !['teksty.json', 'co-nowego.json'].includes(p))
    .map((p) => fs.readFileSync(path.join(katalogDanych, p), 'utf8'));
  assert.ok(wszystkie.some((t) => t.includes('data-gra=\\"srw-oe\\"')), 'fragmenty i galerie niosą zakres gry');
  assert.ok(wszystkie.some((t) => t.includes('data-gra-nazwa=\\"Super Robot Wars OE\\"')));
});

test('artefakt jest samowystarczalny (bez zewnętrznych zasobów)', () => {
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(powloka), 'styl jest wstrzykiwany, nie linkowany');
  assert.ok(!/<script[^>]+src=/.test(powloka), 'skrypt jest wstrzykiwany, nie linkowany');
  assert.match(powloka, /<style>/);
});
