/**
 * Ósma misja epizodu 1: „Śledztwo pod przykrywką” (`dostawa_1_8.txt`, `DL101_80`).
 *
 * Scena odsłania rolę systemu Shinohara HOS w serii szalejących Laborów,
 * łączy potajemne dochodzenie Asumy w serwerowni w Hachioji z wizytą Connect
 * po kopię wzorcową oraz ze starciem z ośmioma uzbrojonymi Laborami JSDF
 * (HAL-X10/Green i Helldiver), a kończy się rządową „aktualizacją” HOS-a,
 * delegacją całego Drugiego Plutonu SV2 w kosmos i puentą Shige o atrapie
 * ekranu startowego.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = wczytajStrony(ROOT);
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const deliveryBytes = fs.readFileSync(path.join(ROOT, 'dostawy/srw-oe/dostawa_1_8.txt'));
const delivery = deliveryBytes.toString('utf8').replace(/\r\n/g, '\n');
const script = fs.readFileSync(path.join(ROOT, 'episodes/srw-oe/ep001.md'), 'utf8');
const scena = bySlug.get('srw-oe-ep1-sledztwo-pod-przykrywka');
const epizod = bySlug.get('srw-oe-ep1');

globalThis.SRW_DATA = await zbudujDane({ root: ROOT });
const { renderScena } = await import('../src/srw/render-scene.js');

test('dostawa 1-8 jest zachowana bajt w bajt, a cały jej skrypt kończy epizod', () => {
  assert.equal(deliveryBytes.length, 35276);
  assert.equal(createHash('md5').update(deliveryBytes).digest('hex'),
    '3c2e8b8e7e1741123e23623b17927727');
  assert.equal(createHash('sha256').update(deliveryBytes).digest('hex'),
    'efb4f47dbb95210d9b98631a96c65084a18dcaba99a8d24a30c7da8397605b83');
  assert.equal(fs.existsSync(path.join(ROOT, 'google_drive')), false, 'katalog roboczy z Drive usunięty');
  assert.match(delivery, /^## Śledztwo pod przykrywką$/m);
  assert.match(delivery, /^### Odcinek 1 — Śledztwo pod przykrywką \(`DL101_80`\)$/m);
  assert.match(delivery, /HAL-X10\/Green.*×4 rekordy źródłowe Entry ID/);
  assert.match(delivery, /Helldiver.*×4 rekordy źródłowe Entry ID/);

  const expected = delivery.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
  assert.ok(script.trimEnd().endsWith(expected), 'pełna misja 1-8 na końcu epizodu');
  assert.equal(script.split('## Śledztwo pod przykrywką').length - 1, 1, 'bez duplikatu sceny');
  assert.ok(!script.includes('UCZESTNICY'));
  assert.ok(!script.includes('DL101_80'));
});

test('scena 1-8 jest dosłowna i domyka kolejność ośmiu misji epizodu 1', () => {
  assert.ok(scena, 'strona sceny 1-8 istnieje');
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep1');
  assert.equal(scena.numer_sceny, '1-8');
  assert.equal(scena.tytul, 'Śledztwo pod przykrywką');
  assert.deepEqual(sprawdzWiernoscSceny(scena, script), []);
  assert.equal((scena.body.match(/:::skrypt/g) ?? []).length, 12, '12 bloków skryptu');

  for (const fragment of [
    '### SV2, Drugi Pluton / Hangar Laborów',
    '### Następnego dnia...',
    '### Shinohara Heavy Industries / Hachioji',
    '### Shinohara Heavy Industries / Serwerownia',
    '### Alarm w zakładzie',
    '### Ulice miasta',
    '### SV2 dołącza do walki',
    '#### Dialogi bojowe — warunkowe i sytuacyjne',
    '**Shinohara:** Przeklinam paaana!',
  ]) {
    assert.ok(scena.body.includes(fragment), fragment);
  }
  assert.equal((scena.body.match(/^### SV2 \/ Biuro$/gm) ?? []).length, 2,
    'oba wystąpienia nagłówka SV2 / Biuro w skrypcie');

  const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1')
    .sort((a, b) => String(a.numer_sceny).localeCompare(String(b.numer_sceny), undefined, { numeric: true }));
  assert.deepEqual(sceny.map((s) => s.numer_sceny),
    ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8']);
});

test('dwanaście etapów analizy mapuje kolejno oba wystąpienia SV2 / Biuro w widoku sceny', () => {
  const blokAnalizy = scena.body.split('## Analiza')[1].split('\n## ')[0];
  const analiza = [...blokAnalizy.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(analiza, [
    'Fala incydentów w kraju',
    'Przemoczony Ingram nr 2',
    'Trop w systemie operacyjnym',
    'HOS i celowe zaprogramowanie',
    'Wizyta Connect po kopię wzorcową',
    'Odkrycie kopii wzorcowej',
    'Alarm i ostra amunicja',
    'Szyfr dziadka i program w oryginale',
    'Wspólne zatrzymanie Laborów',
    'Walka pod ostrzałem',
    'Zakończenie starcia',
    'Delegacja do Connect i atrapa Shige',
  ]);
  assert.equal(scena.sekcje_analizy.length, 12);

  const html = renderScena('srw-oe-ep1-sledztwo-pod-przykrywka');
  assert.match(html, /data-cel="tresc-sv2-biuro"/, 'kotwica analizy do pierwszej sekcji SV2 / Biuro');
  assert.match(html, /data-cel="tresc-sv2-biuro-2"/, 'kotwica analizy do drugiej sekcji SV2 / Biuro');
  assert.match(html, /id="tresc-sv2-biuro"/, 'pierwsza sekcja SV2 / Biuro w treści');
  assert.match(html, /id="tresc-sv2-biuro-2"/, 'druga sekcja SV2 / Biuro w treści');
  assert.match(html, /Nawiązania do oryginalnych odcinków/);
});

test('nowe postacie i Shinohara Heavy Industries mają czyste profile bez spoilerów i wycieków technicznych', () => {
  const nagumo = bySlug.get('shinobu-nagumo');
  assert.ok(nagumo);
  assert.equal(nagumo.rola, 'dowodztwo');
  assert.equal(nagumo.seria, 'mobile-police-patlabor');
  assert.equal(nagumo.mechy, undefined);
  assert.match(nagumo.body, /Pythonów/);
  assert.match(nagumo.body, /Pierwszym Plutonem/);

  const shiba = bySlug.get('shigeo-shiba');
  assert.ok(shiba);
  assert.equal(shiba.rola, 'wsparcie');
  assert.equal(shiba.seria, 'mobile-police-patlabor');
  assert.equal(shiba.mechy, undefined);
  assert.match(shiba.body, /atrapę ekranu startowego/);
  assert.match(shiba.body, /Shige/);

  const shi = bySlug.get('shinohara-heavy-industries');
  assert.ok(shi);
  assert.equal(shi.typ, 'pojecie');
  assert.match(shi.body, /Hachioji/);
  assert.match(shi.body, /MIT/);

  assert.deepEqual(bySlug.get('helldiver').piloci, ['control-ai', 'zolnierz-jsdf']);
  assert.deepEqual(bySlug.get('control-ai').mechy, ['brocken', 'helldiver']);

  for (const slug of ['shinobu-nagumo', 'shigeo-shiba']) {
    assert.ok(scena.postacie.includes(slug), `scena postacie: ${slug}`);
    assert.ok(epizod.postacie.includes(slug), `epizod postacie: ${slug}`);
  }
  assert.ok(scena.pojecia.includes('shinohara-heavy-industries'));
  assert.ok(epizod.pojecia.includes('shinohara-heavy-industries'));

  // Zakaz spoilerów z dalszej fabuły Patlabor: The Movie i surowych identyfikatorów silnika.
  const zakazane = /Eiichi|Hoba|samobój|tajfun|częstotliwoś|rezonans|AV-X0|Type-0|Arka\b|DL101_80|Entry ID|eventP00|charalist00/i;
  for (const slug of [
    'srw-oe-ep1-sledztwo-pod-przykrywka',
    'shinobu-nagumo',
    'shigeo-shiba',
    'shinohara-heavy-industries',
    'shinohara-hos',
    'patlabor-the-movie',
    'srw-oe-ep1',
  ]) {
    assert.doesNotMatch(bySlug.get(slug).body, zakazane, `${slug}: bez spoilerów i wycieków silnika`);
  }
});
