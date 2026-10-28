/**
 * Sceny (ADR 0008): wierność treści względem skryptu, kolejność, schemat.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { wczytajStrony } from '../tools/content-loader.mjs';
import {
  zbudujRejestr, walidujStrone, sprawdzWiernoscSceny, sortujSceny, wytnijBlokSkryptu,
} from '../src/srw/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKRYPT = fs.readFileSync(path.join(ROOT, 'episodes/srw-oe/ep000.md'), 'utf8');
const FRAGMENT = '**Himari:** Seishiro, can you hear me?';

const scena = (body, extra = {}) => ({
  typ: 'scena', slug: 'x-ep001-s1-1', tytul: 'X', epizod: 'srw-oe-ep0', numer_sceny: '0-1',
  streszczenie: 'Krótkie streszczenie sceny.',
  body, plik: 'content/sceny/x.md', ...extra,
});
const body = (tekst) => `## Treść sceny\n\n:::skrypt\n${tekst}\n:::\n\n## Analiza\n\nCoś.\n`;

test('scena wierna skryptowi nie generuje problemów', () => {
  assert.deepEqual(sprawdzWiernoscSceny(scena(body(FRAGMENT)), `x\n\n${FRAGMENT}\n\ny`), []);
});

test('przeredagowana scena zatrzymuje wierność', () => {
  const problemy = sprawdzWiernoscSceny(scena(body('**Himari:** Seishiro, can you hear?')), SKRYPT);
  assert.equal(problemy.length, 1);
  assert.match(problemy[0], /nie jest dosłownym fragmentem/);
});

test('różnica w odstępach między wierszami nie jest błędem', () => {
  const zWierszami = '**Himari:**   Seishiro,\ncan you hear me?';
  assert.deepEqual(sprawdzWiernoscSceny(scena(body(zWierszami)), '**Himari:** Seishiro, can you hear me?'), []);
});

test('brak bloku skryptu i brak skryptu epizodu są zgłaszane', () => {
  assert.match(sprawdzWiernoscSceny(scena('## Treść sceny\n\nbez bloku\n'), SKRYPT)[0], /brak bloku :::skrypt/);
  assert.match(sprawdzWiernoscSceny(scena(body('x')), null)[0], /brak skryptu epizodu/);
});

test('wytnijBlokSkryptu bierze pierwszy blok', () => {
  assert.equal(wytnijBlokSkryptu(':::skrypt\nA\nB\n:::\n\n:::\nC\n:::\n'), 'A\nB');
});

test('sceny sortują się numerycznie, nie leksykograficznie (numer to dowolny tekst)', () => {
  const numery = ['1-10', '2', '1-2', '2-2-1', '1', '2-1', 'Prolog'];
  const posortowane = sortujSceny(numery.map((n) => ({ numer_sceny: n }))).map((s) => s.numer_sceny);
  assert.deepEqual(posortowane, ['1', '1-2', '1-10', '2', '2-1', '2-2-1', 'Prolog']);
});

test('walidacja schematu sceny: epizod, numer_sceny i streszczenie są wymagane, a gry i serie zakazane', () => {
  const bySlug = new Map([['srw-oe-ep0', { typ: 'epizod', slug: 'srw-oe-ep0' }]]);
  assert.equal(walidujStrone(scena(body('x'), { numer_sceny: '  ' }), { bySlug }).filter((p) => /numer_sceny/.test(p)).length, 1);
  const bezEpizodu = walidujStrone(scena(body('x'), { epizod: undefined }), { bySlug });
  assert.ok(bezEpizodu.some((p) => /wymaga pola "epizod"/.test(p)));
  const zlyEpizod = walidujStrone(scena(body('x'), { epizod: 'nie-ma' }), { bySlug });
  assert.ok(zlyEpizod.some((p) => /"epizod" → "nie-ma" nie istnieje/.test(p)));
  const bezStreszczenia = walidujStrone(scena(body('x'), { streszczenie: '   ' }), { bySlug });
  assert.ok(bezStreszczenia.some((p) => /wymaga niepustego pola "streszczenie"/.test(p)));
  const zGra = walidujStrone(scena(body('x'), { gry: ['srw-oe'] }), { bySlug });
  assert.ok(zGra.some((p) => /usuń pole "gry"/.test(p)));
  const zSeriami = walidujStrone(scena(body('x'), { serie: ['mobile-police-patlabor'] }), { bySlug });
  assert.ok(zSeriami.some((p) => /usuń pole "serie"/.test(p)));
});

test('sceny z bazy są wierne skryptowi i mają poprawny schemat', () => {
  const strony = wczytajStrony({ root: ROOT }).filter((s) => !s.problem);
  const { bySlug } = zbudujRejestr(strony);
  const sceny = strony.filter((s) => s.typ === 'scena');
  assert.ok(sceny.length > 0);
  for (const s of sceny) {
    const ep = bySlug.get(s.epizod);
    assert.equal(ep?.typ, 'epizod', `${s.slug}: brak epizodu`);
    assert.deepEqual(sprawdzWiernoscSceny(s, fs.readFileSync(path.join(ROOT, ep.skrypt), 'utf8')), [], s.slug);
    assert.deepEqual(walidujStrone(s, { bySlug }), [], s.slug);
  }
});
