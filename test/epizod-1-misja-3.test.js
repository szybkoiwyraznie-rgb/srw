/**
 * Misja 3 epizodu 1 „Powstrzymaj pocisk termojądrowy”: dostawa z 2026-10-22.
 *
 * Testy pilnują archiwum, wierności sceny, nowych encji oraz rozdzielenia
 * zwykłego Doma od konfiguracji Black Tri-Stars.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const delivery = fs.readFileSync('dostawy/srw-oe/dostawa_1_3.txt', 'utf8').replace(/\r\n/g, '\n');
const script = fs.readFileSync('episodes/srw-oe/ep001.md', 'utf8');
const scena = bySlug.get('srw-oe-ep1-powstrzymaj-pocisk-termojadrowy');
const epizod = bySlug.get('srw-oe-ep1');

test('dostawa 1-3 jest zarchiwizowana w całości, a sama scena trafia do skryptu epizodu', () => {
  assert.equal(fs.statSync('dostawy/srw-oe/dostawa_1_3.txt').size, 30053, 'archiwum dostawy');
  assert.match(delivery, /^## Powstrzymaj pocisk termojądrowy$/m);
  assert.match(delivery, /### Odcinek 1 — Powstrzymaj pocisk termojądrowy \(`DL101_30`\)/);
  assert.match(delivery, /^## H-Bomb Missile$/m);
  assert.match(delivery, /^#### Oficer Federacji$/m);
  assert.match(delivery, /^#### Oficer Zeonu$/m);
  assert.ok(script.includes('## Powstrzymaj pocisk termojądrowy'));
  assert.ok(script.includes('**M\'Quve:** Odpalić pocisk!'));
  assert.ok(!script.includes('UCZESTNICY'), 'dane misji nie trafiają do archiwum skryptu');
  assert.ok(!script.includes('DL101_30'), 'techniczna etykieta misji nie trafia do skryptu');
});

test('scena 1-3 jest dosłownym fragmentem skryptu i domyka kolejność scen epizodu 1', () => {
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep1');
  assert.equal(scena.numer_sceny, '1-3');
  assert.equal(scena.tytul, 'Powstrzymaj pocisk termojądrowy');
  assert.deepEqual(sprawdzWiernoscSceny(scena, script), []);
  const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1')
    .sort((a, b) => String(a.numer_sceny).localeCompare(String(b.numer_sceny)));
  assert.deepEqual(sceny.map((s) => s.numer_sceny), ['1-1', '1-2', '1-3']);
});

test('obsada, jednostki i pojęcia misji 3 są spięte ze sceną i epizodem', () => {
  const postacie = ['general-revil', 'oficer-federacji', 'mquve', 'oficer-zeonu', 'bright-noa',
    'amuro-ray', 'kai-shiden', 'hayato-kobayashi', 'sayla-mass', 'mirai-yashima', 'fraw-bow',
    'oscar-dublin', 'marker', 'zolnierz-zeonu'];
  const mechy = ['g-fighter', 'guncannon', 'rx-78-2-gundam', 'guntank', 'white-base',
    'dom-zolnierz-zeonu', 'dopp', 'h-bomb-missile', 'zaku-ii-bazooka',
    'zaku-ii-karabin-maszynowy'];
  const pojecia = ['operacja-odessa', 'traktat-antarktyczny', 'black-tri-stars', 'zeon',
    'earth-federation', 'mobile-suit'];
  for (const slug of postacie) {
    assert.ok(bySlug.has(slug), `brak postaci ${slug}`);
    assert.ok(scena.postacie.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.postacie.includes(slug), `epizod: ${slug}`);
  }
  for (const slug of mechy) {
    assert.ok(bySlug.has(slug), `brak jednostki ${slug}`);
    assert.ok(scena.mechy.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.mechy.includes(slug), `epizod: ${slug}`);
  }
  for (const slug of pojecia) {
    assert.ok(bySlug.has(slug), `brak pojęcia ${slug}`);
    assert.ok(scena.pojecia.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.pojecia.includes(slug), `epizod: ${slug}`);
  }
});

test('zwykły Dom jest odrębną jednostką od Domów Black Tri-Stars', () => {
  const zwykly = bySlug.get('dom-zolnierz-zeonu');
  const triStars = bySlug.get('dom');
  assert.equal(zwykly.typ, 'mech');
  assert.equal(zwykly.seria, 'mobile-suit-gundam-1979');
  assert.deepEqual(zwykly.piloci, ['zolnierz-zeonu']);
  assert.deepEqual(triStars.piloci, ['gaia', 'ortega', 'mash']);
  const stats = JSON.parse(zwykly.w_gre['srw-oe']);
  assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_3.txt');
  assert.equal(stats.profil, 'Dom');
  assert.match(zwykly.body, /\| 0 \| Heat Saber \| 1500 \| 1–2 \| \+50 \| 5 \|/);
  assert.match(zwykly.body, /\| 1 \| Wielka bazooka \| 1800 \| 1–4 \| \+10 \| 10 \|/);
  assert.match(triStars.body, /\|\s+0 \| Heat Saber\s+\|\s+1900 \|\s+1–2\s+\|\s+\+60 \|/);
  assert.deepEqual(bySlug.get('zolnierz-zeonu').mechy,
    ['dom-zolnierz-zeonu', 'dopp', 'zaku-ii-bazooka', 'zaku-ii-karabin-maszynowy']);
});

test('H-Bomb Missile jest niepilotowanym celem z parametrami dostawy', () => {
  const missile = bySlug.get('h-bomb-missile');
  assert.equal(missile.typ, 'mech');
  assert.equal(missile.seria, undefined);
  assert.deepEqual(missile.piloci, []);
  const stats = JSON.parse(missile.w_gre['srw-oe']);
  assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_3.txt');
  assert.equal(stats.profil, 'H-Bomb Missile');
  assert.match(missile.body, /\| 0 \| Bez uzbrojenia \| 0 \| 0–0 \| \+0 \| 0 \|/);
  assert.match(missile.body, /bez własnego uzbrojenia/);
  assert.match(missile.body, /\[\[traktat-antarktyczny\|Traktat Antarktyczny\]\]/);
});

test('nowe profile dowódcze zachowują wartości z dostawy', () => {
  const profile = {
    'oficer-federacji': [10, 102, 70, 124, 54],
    'oficer-zeonu': [10, 102, 73, 126, 56],
  };
  for (const [slug, [sp, atak, obrona, celnosc, unik]] of Object.entries(profile)) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac', slug);
    assert.equal(page.seria, undefined, `${slug}: brak serii w dostawie`);
    for (const [nazwa, wartosc] of [['SP', sp], ['Atak', atak], ['Obrona', obrona],
      ['Celność', celnosc], ['Unik', unik]]) {
      assert.match(page.body, new RegExp(`\\| ${nazwa} \\| ${wartosc} \\|`), `${slug}: ${nazwa}`);
    }
    assert.match(page.body, /\| 1 \| \*\*Potencjał\*\* \| 1 \|/);
  }
  assert.equal(bySlug.get('general-revil').seria, 'mobile-suit-gundam-1979');
  assert.equal(bySlug.get('general-revil').rola, 'dowodztwo');
  assert.match(bySlug.get('general-revil').body, /niebezpieczny precedens/);
});

test('odcinek 25 i Traktat Antarktyczny mają sprawdzone źródła, bez surowych etykiet w treści', () => {
  const official = 'https://en.gundam-official.com/series/mobile-suit-gundam/story/b6lswvospmwoql06afuhetwp';
  const treaty = 'https://gundam.fandom.com/wiki/Antarctic_Treaty';
  assert.ok(scena.zrodla.includes(official));
  assert.ok(scena.zrodla.includes(treaty));
  assert.ok(epizod.zrodla.includes(official));
  assert.ok(epizod.zrodla.includes(treaty));
  assert.ok(bySlug.get('traktat-antarktyczny').zrodla.includes(treaty));
  assert.match(scena.body, /dwudziestego piątego odcinka/);
  assert.match(epizod.body, /odc\. 25 „The Fierce Battle for Odessa”/);
  for (const page of [scena, epizod, bySlug.get('general-revil'), bySlug.get('oficer-federacji'),
    bySlug.get('oficer-zeonu'), bySlug.get('dom-zolnierz-zeonu'), bySlug.get('h-bomb-missile')]) {
    assert.doesNotMatch(page.body, /DL101_30|Entry ID|eventP00/, page.slug);
  }
});

test('Revil i Dom (Żołnierz Zeonu) mają dostarczone ilustracje, pozostałe nowe strony bez pustych galerii', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const revil = bySlug.get('general-revil');
  assert.deepEqual(manifest.encje['general-revil'], ['characters/Revil.png']);
  assert.match(revil.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/);
  assert.match(revil.body, /https:\/\/pub-f065608b5a964f3fb44480d8c9df01de\.r2\.dev\/characters\/Revil\.png/);
  assert.equal((revil.body.match(/^!\[/gm) ?? []).length, 1, 'Revil: jeden portret');

  // Druga dostawa 2026-10-22: dwa obrazy zwykłego Doma (nazwy plików od właściciela).
  const dom = bySlug.get('dom-zolnierz-zeonu');
  assert.deepEqual(manifest.encje['dom-zolnierz-zeonu'], ['Dom Generic.png', 'Dom Generic 2.png']);
  assert.match(dom.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/);
  assert.equal((dom.body.match(/^!\[/gm) ?? []).length, 2, 'Dom: dwie ilustracje');
  assert.ok(dom.body.includes('https://pub-f065608b5a964f3fb44480d8c9df01de.r2.dev/Dom%20Generic.png'));
  assert.ok(dom.body.includes('https://pub-f065608b5a964f3fb44480d8c9df01de.r2.dev/Dom%20Generic%202.png'));

  for (const slug of ['oficer-federacji', 'oficer-zeonu',
    'h-bomb-missile', 'traktat-antarktyczny']) {
    assert.equal(manifest.encje[slug], undefined, `${slug}: brak pliku w manifeście`);
    assert.doesNotMatch(bySlug.get(slug).body, /^## Ilustracje$/m, `${slug}: brak galerii`);
  }
});
