/**
 * Przyrost SRW Y 1.1C: archiwum, graf encji i pięć scen pierwszego epizodu.
 *
 * Test nie zastępuje testów ogólnych bazy: pilnuje konkretnie, żeby kolejny
 * etap dostawy nie zgubił surowego skryptu, zakresu gry ani relacji z menu.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajSkrypty, wczytajStrony } from '../tools/content-loader.mjs';
import { zbudujRejestr, sprawdzWiernoscSceny } from '../src/srw/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIWUM = path.join(ROOT, 'dostawy/srw-y/Y_dostawa_1_1C.txt');
const strony = wczytajStrony({ root: ROOT }).filter((s) => !s.problem);
const bySlug = zbudujRejestr(strony).bySlug;
const epizod = bySlug.get('srw-y-ep1');
const skrypt = wczytajSkrypty({ root: ROOT }).get('episodes/srw-y/ep001.md');

const POSTACIE = [
  'agent', 'annina-servania', 'baku-yamagishi', 'echika-y-franburnett',
  'forte-tsukinowa', 'gauma', 'zaawansowana-si', 'cross-tsukinowa',
  'mobile-doll', 'takuma-nagare', 'chang-wufei', 'yomogi-asanaka', 'zero',
  'aytie', 'cookie', 'wren',
];
const MECHY = [
  'altron-gundam', 'amx-003-gaza-c', 'a-advent', 'lunedrache',
  'lancelot-albion-zero', 'lumenus', 'taurus', 'zamza-zah',
];
const SERIE = [
  'mobile-suit-gundam-wing-endless-waltz', 'mobile-suit-z-gundam',
  'mobile-suit-gundam-seed-destiny', 'getter-robo-arc', 'ssss-dynazenon',
  'code-geass-lelouch-of-the-re-surrection',
];
const POJECIA = [
  'wojna-rewolucyjna', 'nowa-federacja-ziemska', 'val-x', 'logos',
  'czarni-rycerze', 'ninja', 'statek-emigracyjny', 'nira-kana-i',
  'pamiec-stg', 'teoria-y', 'miasto-yagami', 'mechaniczne-marionetki',
];
const SCENY = [
  ['srw-y-ep1-parada-cesarza-leloucha', '1-1'],
  ['srw-y-ep1-atak-na-miasto-yagami', '1-2'],
  ['srw-y-ep1-start-a-adventu', '1-3'],
  ['srw-y-ep1-ninja-w-cieniu', '1-4'],
  ['srw-y-ep1-rdzen-nira-kana-i', '1-5'],
];

for (const slug of ['srw-y', 'srw-y-ep1', ...POSTACIE, ...MECHY, ...SERIE, ...POJECIA, ...SCENY.map(([s]) => s)]) {
  test(`SRW Y: istnieje strona ${slug}`, () => {
    assert.ok(bySlug.has(slug), slug);
  });
}

test('SRW Y: archiwum dostawy jest niepuste i obejmuje surowy dialog oraz menu', () => {
  const raw = fs.readFileSync(ARCHIWUM, 'utf8');
  assert.ok(Buffer.byteLength(raw) > 90000);
  assert.match(raw, /### Parada cesarza Leloucha/);
  assert.match(raw, /### A\. Advent - rdzeń Systemu Nira-Kana-I/);
  assert.match(raw, /#### Domyślne mechy i jednostki w misji/);
  assert.match(raw, /#### Serie reprezentowane w misji/);
});

test('SRW Y: epizod wskazuje grę, skrypt i komplet dostarczonych relacji', () => {
  assert.equal(epizod.gra, 'srw-y');
  assert.equal(epizod.numer, 1);
  assert.equal(epizod.skrypt, 'episodes/srw-y/ep001.md');
  assert.deepEqual(epizod.postacie, POSTACIE);
  assert.deepEqual(epizod.mechy, MECHY);
  for (const slug of [...SERIE, ...POJECIA]) assert.ok(epizod.serie?.includes(slug) || epizod.pojecia?.includes(slug), slug);
  assert.doesNotMatch(skrypt, /UCZESTNICY/);
  assert.match(skrypt, /\*\*Cross Tsukinowa:\*\* \*\(Starszy brat cię obroni/);
});

test('SRW Y: pięć scen jest uporządkowanych i zachowuje dosłowne fragmenty skryptu', () => {
  const sceny = SCENY.map(([slug]) => bySlug.get(slug));
  assert.deepEqual(sceny.map((s) => s.numer_sceny), SCENY.map(([, numer]) => numer));
  for (const scena of sceny) {
    assert.deepEqual(sprawdzWiernoscSceny(scena, skrypt), [], scena.slug);
    assert.match(scena.body, /:::skrypt\n/);
    assert.match(scena.body, /## Analiza/);
    assert.equal(scena.epizod, 'srw-y-ep1');
  }
  assert.doesNotMatch(sceny.at(-1).body, /UCZESTNICY|Misja 1 —/);
});

test('SRW Y: wszystkie profile mechów zachowują dane menu pod zakresem srw-y', () => {
  for (const slug of MECHY) {
    const mech = bySlug.get(slug);
    assert.deepEqual(mech.gry, ['srw-y'], slug);
    const wpis = mech.w_gre?.['srw-y'];
    assert.equal(typeof wpis, 'string', `${slug}: w_gre.srw-y`);
    const dane = JSON.parse(wpis);
    assert.equal(dane.dostawa, 'dostawy/srw-y/Y_dostawa_1_1C.txt', slug);
    assert.equal(dane.profil, mech.tytul, slug);
    assert.match(mech.body, /\{\{menu gra=srw-y/, slug);
  }
});

test('SRW Y: relacje encji prowadzą do epizodu, scen i serii', () => {
  for (const slug of [...POSTACIE, ...MECHY]) {
    const strona = bySlug.get(slug);
    assert.ok(strona.gry.includes('srw-y'), `${slug}: gra`);
    assert.ok(strona.body.includes('gra=srw-y'), `${slug}: zakres bloków`);
  }
  for (const slug of SERIE) {
    const seria = bySlug.get(slug);
    assert.ok(seria.gry.includes('srw-y'), `${slug}: gra`);
    assert.match(seria.body, /\[\[[a-z0-9-]+\]\]/, `${slug}: encje serii`);
  }
  for (const [slug] of SCENY) {
    const scena = bySlug.get(slug);
    assert.ok(scena.postacie.length > 0, `${slug}: postacie`);
    assert.ok(Array.isArray(scena.pojecia), `${slug}: pojęcia`);
  }
});
