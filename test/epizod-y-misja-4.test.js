/**
 * Misja 1-4 SRW Y („Drzwi stają otworem”) i mapowanie `seria_w_grze` (ADR 0046).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony, wczytajSkrypty } from '../tools/content-loader.mjs';
import { zbudujRejestr, sprawdzWiernoscSceny, serieStrony } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strony = wczytajStrony({ root: ROOT }).filter((s) => !s.problem);
const bySlug = zbudujRejestr(strony).bySlug;
const skrypt = wczytajSkrypty({ root: ROOT }).get('episodes/srw-y/ep001.md');
const SCENA_SLUG = 'srw-y-ep1-misja-4-drzwi-staja-otworem';

test('Misja 1-4: surowa dostawa istnieje i skrypt sceny jest wierny ep001.md', () => {
  const dostawa = fs.readFileSync(path.join(ROOT, 'dostawy/srw-y/Y_dostawa_1_4.txt'), 'utf8');
  assert.ok(Buffer.byteLength(dostawa) > 100000);
  const scena = bySlug.get(SCENA_SLUG);
  assert.ok(scena, 'scena 1-4 istnieje');
  assert.equal(scena.numer_sceny, '1-4');
  assert.equal(scena.tytul, 'Drzwi stają otworem');
  assert.equal(scena.epizod, 'srw-y-ep1');
  assert.deepEqual(sprawdzWiernoscSceny(scena, skrypt), []);
  assert.equal(scena.sekcje_analizy.length, 7);
});

test('Misja 1-4: wszystkie nowe encje (seria, mechy, postacie, pojęcia) są w bazie', () => {
  const oczekiwane = [
    'mobile-fighter-g-gundam',
    'burning-gundam', 'rising-gundam',
    'domon-kasshu', 'rain-mikamura', 'novey-dickens', 'mina-narive', 'ru-negsis', 'ade-stradio',
    'gundam-fight', 'swiete-imperium-britannii', 'aeug', 'krol-kier', 'wyznanie-stulecia', 'sojusz-shuffle',
    'nowa-liga-narodow', '31-samodzielny-korpus', 'wszechgwiezdne-imperium-ra-val', 'yz-next',
  ];
  for (const slug of oczekiwane) {
    assert.ok(bySlug.has(slug), `brak encji: ${slug}`);
  }
  const devil = bySlug.get('devil-gundam-incident');
  assert.deepEqual(devil.gry, ['srw-oe', 'srw-y'], 'incydent Devil/Dark Gundam łączy obie gry (ADR 0020)');
});

test('Misja 1-4: Lumenus Yellow Version jest osobnym mechem z pilotem Zaawansowana SI, a Lumenus zachowuje profil z 1-1', () => {
  const lumenus = bySlug.get('lumenus');
  assert.deepEqual(lumenus.piloci, ['cross-tsukinowa']);
  assert.equal(JSON.parse(lumenus.w_gre['srw-y']).dostawa, 'dostawy/srw-y/Y_dostawa_1_1C.txt');

  const yellow = bySlug.get('lumenus-yellow-version');
  assert.equal(yellow?.typ, 'mech');
  assert.equal(yellow.tytul, 'Lumenus Yellow Version');
  assert.deepEqual(yellow.piloci, ['zaawansowana-si']);
  assert.equal(JSON.parse(yellow.w_gre['srw-y']).dostawa, 'dostawy/srw-y/Y_dostawa_1_4.txt');
  assert.ok(yellow.body.includes('[[lumenus|'));
  assert.ok(lumenus.body.includes('[[lumenus-yellow-version|'));

  const aAdvent = bySlug.get('a-advent');
  assert.ok(aAdvent.piloci.includes('novey-dickens'));
  assert.ok(aAdvent.piloci.includes('mina-narive'));
});

test('ADR 0046: seria_w_grze przypisuje Heero Yuya i Wing Gundama Zero do właściwych serii w OE i Y', async () => {
  for (const slug of ['heero-yuy', 'wing-gundam-zero']) {
    const s = bySlug.get(slug);
    assert.deepEqual(s.gry, ['srw-oe', 'srw-y'], `${slug}: gry`);
    assert.equal(s.seria_w_grze?.['srw-oe'], 'mobile-suit-gundam-wing', `${slug}: OE`);
    assert.equal(s.seria_w_grze?.['srw-y'], 'mobile-suit-gundam-wing-endless-waltz', `${slug}: Y`);
    assert.deepEqual(serieStrony(s), ['mobile-suit-gundam-wing', 'mobile-suit-gundam-wing-endless-waltz']);
  }

  globalThis.SRW_DATA = await zbudujDane({ root: ROOT });
  const { renderEncja } = await import('../src/srw/render-entity.js');
  const htmlHeero = renderEncja('heero-yuy');
  assert.match(htmlHeero, /<dt>Serie<\/dt>/);
  assert.match(htmlHeero, /Mobile Suit Gundam Wing<\/a> \(Super Robot Wars OE\)/);
  assert.match(htmlHeero, /Mobile Suit Gundam Wing: Endless Waltz<\/a> \(Super Robot Wars Y\)/);

  const htmlEw = renderEncja('mobile-suit-gundam-wing-endless-waltz');
  assert.match(htmlEw, /href="#\/postac\/heero-yuy"/);
  assert.match(htmlEw, /href="#\/mech\/wing-gundam-zero"/);
});

test('Misja 1-4: dostawa ilustracji (2026-11-23) przypisuje cztery pliki jednostek i portrety (w tym osobne OE/Y dla Heero Yuya)', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'media/ilustracje.json'), 'utf8'));
  const oczekiwane = {
    'burning-gundam': ['Burning Gundam.png'],
    'rising-gundam': ['Rising Gundam.png'],
    'lumenus': ['Lumenus.png'],
    'lumenus-yellow-version': ['Lumenus Yellow Version.png'],
    'wing-gundam-zero': ['Wing Zero.png', 'Wing Zero 2.png', 'Wing Gundam Zero.png'],
    'ade-stradio': ['characters/Ade Stradio.png'],
    'domon-kasshu': ['characters/Domon Kasshu.png'],
    'heero-yuy': ['characters/Heero Yuy OE.png', 'characters/Heero Yuy.png'],
    'mina-narive': ['characters/Mina Narive.png'],
    'novey-dickens': ['characters/Novey Dickens.png'],
    'rain-mikamura': ['characters/Rain Mikamura.png'],
  };
  for (const [slug, pliki] of Object.entries(oczekiwane)) {
    assert.deepEqual(manifest.encje[slug], pliki, `${slug}: manifest`);
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-y\n\n## Ilustracje/, `${slug}: galeria srw-y`);
    for (const plik of pliki) {
      const encoded = plik.split('/').map(encodeURIComponent).join('/');
      assert.ok(body.includes(`${manifest.baseUrl}/${encoded}`), `${slug}: brak URL dla ${plik}`);
    }
  }
  assert.match(bySlug.get('heero-yuy').body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, 'heero-yuy: galeria srw-oe');
});
