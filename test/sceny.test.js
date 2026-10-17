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
const SKRYPT = fs.readFileSync(path.join(ROOT, 'episodes/demo/ep001.md'), 'utf8');

const scena = (body, extra = {}) => ({
  typ: 'scena', slug: 'x-ep001-s1-1', tytul: 'X', epizod: 'demo-ep001', numer_sceny: '1-1',
  body, plik: 'content/sceny/x.md', ...extra,
});
const body = (tekst) => `## Treść sceny\n\n:::skrypt\n${tekst}\n:::\n\n## Analiza\n\nCoś.\n`;

test('scena wierna skryptowi nie generuje problemów', () => {
  const fragment = 'NARRACJA: Trzy nieba zachodzą na siebie bez ostrzeżenia.\n\nAMURO: To nie jest nasze niebo.';
  assert.deepEqual(sprawdzWiernoscSceny(scena(body(fragment)), `x\n\n${fragment}\n\ny`), []);
});

test('przeredagowana scena zatrzymuje wierność', () => {
  const problemy = sprawdzWiernoscSceny(scena(body('AMURO: To nie jest nasze niebo, sprawdźcie.')), SKRYPT);
  assert.equal(problemy.length, 1);
  assert.match(problemy[0], /nie jest dosłownym fragmentem/);
});

test('różnica w odstępach między wierszami nie jest błędem', () => {
  const zWierszami = 'AMURO:   To nie jest\nnasze niebo.';
  assert.deepEqual(sprawdzWiernoscSceny(scena(body(zWierszami)), 'AMURO: To nie jest nasze niebo.'), []);
});

test('brak bloku skryptu i brak skryptu epizodu są zgłaszane', () => {
  assert.match(sprawdzWiernoscSceny(scena('## Treść sceny\n\nbez bloku\n'), SKRYPT)[0], /brak bloku :::skrypt/);
  assert.match(sprawdzWiernoscSceny(scena(body('x')), null)[0], /brak skryptu epizodu/);
});

test('wytnijBlokSkryptu bierze pierwszy blok', () => {
  assert.equal(wytnijBlokSkryptu(':::skrypt\nA\nB\n:::\n\n:::\nC\n:::\n'), 'A\nB');
});

test('sceny sortują się numerycznie, nie leksykograficznie', () => {
  const numery = ['1-10', '2', '1-2', '2-2-1', '1', '2-1'];
  const posortowane = sortujSceny(numery.map((n) => ({ numer_sceny: n }))).map((s) => s.numer_sceny);
  assert.deepEqual(posortowane, ['1', '1-2', '1-10', '2', '2-1', '2-2-1']);
});

test('walidacja schematu sceny: epizod i numer_sceny są wymagane', () => {
  const bySlug = new Map([['demo-ep001', { typ: 'epizod', slug: 'demo-ep001' }]]);
  assert.deepEqual(walidujStrone(scena(body('x'), { numer_sceny: undefined }), { bySlug }).filter((p) => /numer_sceny/.test(p)).length, 1);
  const bezEpizodu = walidujStrone(scena(body('x'), { epizod: undefined }), { bySlug });
  assert.ok(bezEpizodu.some((p) => /wymaga pola "epizod"/.test(p)));
  const zlyEpizod = walidujStrone(scena(body('x'), { epizod: 'nie-ma' }), { bySlug });
  assert.ok(zlyEpizod.some((p) => /"epizod" → "nie-ma" nie istnieje/.test(p)));
});

test('sceny z bazy demonstracyjnej są wierne skryptowi i mają poprawny schemat', () => {
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
