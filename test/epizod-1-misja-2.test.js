/**
 * Misja 2 epizodu 1 „Black Tri-Stars”: dostawa z 2026-10-22 (dostawa_1_2.txt).
 *
 * Testy pilnują czterech rzeczy:
 * - tekst misji jest dosłownym fragmentem archiwum epizodu i sceny 1-2,
 * - dane jednostek i pilotów trafiają do bazy bez zmiany wartości,
 * - opis Loum nie zmienia skutecznego odbicia Revila w nieudaną akcję,
 * - nowe strony nie dostają ilustracji ani profilu zbiorczego, dopóki właściciel ich nie dostarczy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const delivery = fs.readFileSync('dostawy/srw-oe/dostawa_1_2.txt', 'utf8').replace(/\r\n/g, '\n');
const script = fs.readFileSync('episodes/srw-oe/ep001.md', 'utf8');
const scena = bySlug.get('srw-oe-ep1-black-tri-stars');

test('dostawa jest zarchiwizowana w całości, a misja trafia do skryptu epizodu', () => {
  assert.equal(fs.statSync('dostawy/srw-oe/dostawa_1_2.txt').size, 39070, 'archiwum dostawy');
  assert.match(delivery, /^## Black Tri-Stars$/m);
  assert.match(delivery, /### Odcinek 1 — Black Tri-Stars \(`DL101_20`\)/);
  assert.match(delivery, /#### Piloci i postacie w misji oraz skrypcie sceny/);
  assert.ok(delivery.includes('\\*pociągnięcie nosem\\*... Zmarzłam...'), 'poprawiona kwestia Himari');
  assert.ok(delivery.includes('Aha... \\*pociąganie nosem\\*... \\*siąkanie\\*...'), 'korekta językowa Himari');
  assert.ok(delivery.includes('przelatywał nad wodami w pobliżu Japonii'), 'poprawiona kwestia Suola');
  assert.ok(delivery.includes('za zniszczenie tego okrętu'), 'poprawiona kwestia Masha');
  assert.ok(delivery.includes('White Base nie leci przypadkiem do Jaburo'), 'poprawiona kwestia Kaia');
  assert.ok(!/chlip|pociąg nosem|przepływali|za zatopienie|nie płynie/.test(delivery), 'stare brzmienie usunięte z dostawy');
  assert.ok(script.includes('## Black Tri-Stars'), 'misja 2 w skrypcie epizodu 1');
  assert.ok(!script.includes('UCZESTNICY'), 'dane misji nie trafiają do archiwum skryptu');
});

test('scena 1-2 jest dosłownym fragmentem skryptu i ma własny numer', () => {
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep1');
  assert.equal(scena.numer_sceny, '1-2');
  assert.equal(scena.tytul, 'Black Tri-Stars');
  assert.match(scena.body, /## Treść sceny/);
  assert.match(scena.body, /## Analiza/);
  assert.deepEqual(sprawdzWiernoscSceny(scena, script), []);
  const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1')
    .sort((a, b) => String(a.numer_sceny).localeCompare(String(b.numer_sceny)));
  assert.deepEqual(sceny.map((s) => s.numer_sceny), ['1-1', '1-2', '1-3', '1-4', '1-5']);
});

test('obsada i sprzęt misji 2 są spięte z epizodem i sceną', () => {
  const postacie = ['amuro-ray', 'kai-shiden', 'hayato-kobayashi', 'bright-noa', 'sayla-mass',
    'mirai-yashima', 'fraw-bow', 'oscar-dublin', 'marker', 'gaia', 'ortega', 'mash', 'mquve',
    'zolnierz-zeonu'];
  const mechy = ['rx-78-2-gundam', 'guncannon', 'guntank', 'g-fighter', 'white-base',
    'dom', 'dopp', 'turret', 'zaku-ii-bazooka', 'zaku-ii-karabin-maszynowy'];
  const pojecia = ['black-tri-stars', 'operacja-odessa', 'jet-stream-attack'];
  for (const p of postacie) {
    assert.ok(bySlug.has(p), `brak strony postaci ${p}`);
    assert.ok(bySlug.get('srw-oe-ep1').postacie.includes(p), `epizod: ${p}`);
    assert.ok(scena.postacie.includes(p), `scena: ${p}`);
  }
  for (const m of mechy) {
    assert.ok(bySlug.has(m), `brak strony mecha ${m}`);
    assert.ok(bySlug.get('srw-oe-ep1').mechy.includes(m), `epizod: ${m}`);
    assert.ok(scena.mechy.includes(m), `scena: ${m}`);
  }
  for (const h of pojecia) {
    assert.ok(bySlug.has(h), `brak hasła ${h}`);
    assert.ok(scena.pojecia.includes(h), `scena: ${h}`);
  }
});

test('opis Loum rozróżnia założenie Federacji od skutecznego odbicia Revila', () => {
  const body = bySlug.get('loum').body;
  assert.match(body, /uznała akcję za nieudaną/);
  assert.match(body, /Skutecznie odbity Revil/);
  assert.doesNotMatch(body, /nieudana próba odbicia generała/);
});

test('pięć nowych jednostek ma uzbrojenie z dostawy i parametry pary (mech, gra)', () => {
  const jednostki = [['dom', 2], ['dopp', 2], ['g-fighter', 3], ['guncannon', 3], ['guntank', 2]];
  for (const [slug, count] of jednostki) {
    const mech = bySlug.get(slug);
    assert.equal(mech.typ, 'mech', slug);
    assert.deepEqual(mech.gry, ['srw-oe'], slug);
    assert.equal(mech.seria, 'mobile-suit-gundam-1979', slug);
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_2.txt', slug);
    assert.ok(delivery.includes(stats.profil), `${slug}: profil w dostawie`);
    const rows = mech.body.split('\n').filter((line) => /^\|\s+\d+\s+\|/.test(line));
    assert.equal(rows.length, count, `${slug}: liczba ataków`);
    for (const row of rows) {
      const cells = row.split('|').slice(1, -1).map((c) => c.trim());
      assert.equal(cells.length, 9, `${slug}: kolumny tabeli`);
      for (const cell of cells) assert.ok(stats.dane.includes(cell), `${slug}: dane w w_gre: ${cell}`);
      assert.ok(delivery.includes(cells[1]), `${slug}: broń z dostawy`);
    }
    assert.doesNotMatch(mech.body, /&lt;br&gt;/, slug);
  }
});

test('obsada jednostek misji 2 zachowuje kolejność pilotów i domyślną załogę', () => {
  assert.deepEqual(bySlug.get('dom').piloci, ['gaia', 'ortega', 'mash']);
  assert.deepEqual(bySlug.get('g-fighter').piloci, ['sayla-mass']);
  assert.deepEqual(bySlug.get('guncannon').piloci, ['kai-shiden']);
  assert.deepEqual(bySlug.get('guntank').piloci, ['hayato-kobayashi']);
  assert.deepEqual(bySlug.get('dopp').piloci, ['zolnierz-zeonu']);
  assert.deepEqual(bySlug.get('turret').piloci, [], 'wieżyczka jest niepilotowanym celem');
  assert.deepEqual(bySlug.get('zolnierz-zeonu').mechy,
    ['dom-zolnierz-zeonu', 'dopp', 'zaku-ii-bazooka', 'zaku-ii-karabin-maszynowy']);
  assert.deepEqual(bySlug.get('sayla-mass').mechy, ['g-fighter']);
});

test('profile pilotów misji 2: statystyki, komendy Ducha i umiejętności', () => {
  const statystyki = {
    'kai-shiden': [50, 113, 78, 132, 65],
    'hayato-kobayashi': [50, 109, 90, 131, 58],
    gaia: [50, 117, 77, 132, 69],
    ortega: [50, 115, 84, 129, 64],
    mash: [50, 114, 67, 134, 77],
    mquve: [50, 110, 76, 126, 62],
  };
  for (const [slug, [sp, atk, obr, cel, unik]] of Object.entries(statystyki)) {
    const body = bySlug.get(slug).body;
    const iOpis = body.indexOf('## Opis');
    const iIlustracje = body.indexOf('## Ilustracje');
    const iParametry = body.indexOf('## Parametry');
    assert.ok(iOpis < iIlustracje && iIlustracje < iParametry,
      `${slug}: kolejność opis → ilustracje → parametry`);
    assert.match(body, /\{\{skrypt gra=srw-oe\n\n## Opis[\s\S]*?\n\}\}\n\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: opis i ilustracje w osobnych boksach`);
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Parametry/, `${slug}: parametry w boksie menu`);
    for (const [nazwa, wartosc] of [['SP', sp], ['Atak', atk], ['Obrona', obr], ['Celność', cel], ['Unik', unik]]) {
      assert.match(body, new RegExp(`\\| ${nazwa} \\| ${wartosc} \\|`), `${slug}: ${nazwa}`);
    }
    assert.match(body, /### Umiejętności pilota/, `${slug}: umiejętności`);
  }
  assert.match(bySlug.get('kai-shiden').body, /\| \*\*Niezł\.\*\* \|/, 'Kai: komenda Ducha');
  assert.match(bySlug.get('hayato-kobayashi').body, /\| \*\*Hart\*\* \|/, 'Hayato: komenda Ducha');
});

test('wieżyczka uniwersalna i Żołnierz Zeonu mają własne strony z danymi dostawy', () => {
  const turret = bySlug.get('turret');
  assert.equal(turret.typ, 'mech');
  assert.equal(turret.seria, undefined, 'wieżyczka bez wpisu w słowniku serii');
  assert.deepEqual(turret.gry, ['srw-oe']);
  const tstats = JSON.parse(turret.w_gre['srw-oe']);
  assert.equal(tstats.dostawa, 'dostawy/srw-oe/dostawa_1_2.txt');
  assert.ok(delivery.includes(tstats.profil), 'profil wieżyczki w dostawie');
  assert.match(turret.body, /\*\*Obiekt stały \(bez poziomu\):\*\*/);
  const trows = turret.body.split('\n').filter((line) => /^\|\s+\d+\s+\|/.test(line));
  assert.equal(trows.length, 1, 'jedno działanie wieżyczki');
  assert.match(trows[0], /\|\s+0 \| Ostrzał \|\s+900 \|\s+3–8\s+\|\s+\+40 \|\s+5 \|/);

  const zolnierz = bySlug.get('zolnierz-zeonu');
  assert.equal(zolnierz.typ, 'postac');
  assert.equal(zolnierz.rola, 'pilot');
  assert.equal(zolnierz.seria, undefined, 'brak wpisu w słowniku postaci');
  assert.deepEqual(zolnierz.gry, ['srw-oe']);
  for (const [nazwa, wartosc] of [['SP', 10], ['Atak', 103], ['Obrona', 67], ['Celność', 129], ['Unik', 59]]) {
    assert.match(zolnierz.body, new RegExp(`\\| ${nazwa} \\| ${wartosc} \\|`), `Żołnierz: ${nazwa}`);
  }
  assert.match(zolnierz.body, /\| 1 \| \*\*Szeregowy\*\* \| 1 \|/, 'Żołnierz: umiejętność');
  assert.match(zolnierz.body, /\[\[turret\|Turret\]\]/, 'Żołnierz: odsyłacz do obsługiwanej wieżyczki');
  assert.match(zolnierz.body, /wieżyczki nie są pilotowanymi maszynami/,
    'Żołnierz: obsługa wieżyczki nie jest relacją pilota');
});

test('jednostki i obsada misji 2 mają galerie z dostaw ilustracji, pozostałe strony bez grafik', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const jednostki = {
    dom: ['Dom.png', 'Dom 2.png'],
    dopp: ['Dopp.png'],
    'g-fighter': ['G-Fighter.png'],
    guncannon: ['Guncannon.png', 'Guncannon 2.png'],
    guntank: ['Guntank.png', 'Guntank 2.png'],
    turret: ['Turret.png'],
  };
  const adres = (file) => `${manifest.baseUrl}/${file.split('/').map(encodeURIComponent).join('/')}`;
  for (const [slug, pliki] of Object.entries(jednostki)) {
    assert.deepEqual(manifest.encje[slug], pliki, `${slug}: wpis w manifeście`);
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria z zakresem gry`);
    assert.equal((body.match(/^!\[/gm) ?? []).length, pliki.length, `${slug}: liczba obrazów`);
    for (const plik of pliki) assert.ok(body.includes(adres(plik)), `${slug}: ${plik}`);
  }
  const portrety = {
    gaia: ['characters/Gaia.png'],
    'hayato-kobayashi': ['characters/Hayato Kobayashi.png'],
    'kai-shiden': ['characters/Kai Shiden.png'],
    mquve: ["characters/M'Quve.png"],
    mash: ['characters/Mash.png'],
    ortega: ['characters/Ortega.png'],
  };
  for (const [slug, pliki] of Object.entries(portrety)) {
    assert.deepEqual(manifest.encje[slug], pliki, `${slug}: wpis w manifeście`);
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria z zakresem gry`);
    assert.equal((body.match(/^!\[/gm) ?? []).length, 1, `${slug}: jeden portret`);
    assert.ok(body.includes(adres(pliki[0])), `${slug}: ${pliki[0]}`);
    assert.ok(pliki[0].startsWith('characters/'), `${slug}: portret w characters/`);
  }
  const bezGrafik = ['zolnierz-zeonu', 'black-tri-stars', 'jet-stream-attack', 'operacja-odessa'];
  for (const slug of bezGrafik) {
    const strona = bySlug.get(slug);
    assert.doesNotMatch(strona.body, /r2\.dev/, `${slug}: brak ilustracji`);
    assert.doesNotMatch(strona.body, /^## Ilustracje$/m, `${slug}: brak galerii`);
  }
});
