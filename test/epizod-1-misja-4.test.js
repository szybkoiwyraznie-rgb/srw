/**
 * Misja 4 epizodu 1 „Trening Klasy Obrony”: dostawa z 2026-10-23 (dostawa_1_4.txt).
 *
 * Testy pilnują czterech rzeczy:
 * - dostawa jest zarchiwizowana bez zmian, a jej skrypt trafia do archiwum epizodu,
 * - scena 1-4 jest dosłownym fragmentem skryptu i domyka kolejność scen epizodu,
 * - nowe encje (Raijin-Oh, Klasa Obrony Ziemi, Akademia Hinobori i siedmioro uczniów)
 *   są spięte ze sceną i epizodem,
 * - parametry w `w_gre` i na stronach pochodzą z dostawy, a nie z pamięci modelu.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const delivery = fs.readFileSync('dostawy/srw-oe/dostawa_1_4.txt', 'utf8').replace(/\r\n/g, '\n');
const script = fs.readFileSync('episodes/srw-oe/ep001.md', 'utf8');
const scena = bySlug.get('srw-oe-ep1-trening-klasy-obrony');
const epizod = bySlug.get('srw-oe-ep1');
const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));

const postacie = ['jin-hyuga', 'asuka-tsukishiro', 'koji-hoshiyama', 'maria-shiratori',
  'tsutomu-kojima', 'kirara-haruno', 'yoko-kuriki'];
const mechy = ['raijin-oh'];
const pojecia = ['klasa-obrony-ziemi', 'akademia-hinobori', 'jaku-empire'];

test('dostawa 1-4 jest zarchiwizowana w całości, a skrypt misji trafia do epizodu', () => {
  assert.equal(fs.statSync('dostawy/srw-oe/dostawa_1_4.txt').size, 21554, 'archiwum dostawy');
  assert.match(delivery, /^## Trening Klasy Obrony$/m);
  assert.match(delivery, /^### Odcinek 1 — Trening Klasy Obrony \(`DL101_40`\)$/m);
  assert.match(delivery, /^## Raijin-Oh$/m);
  assert.match(delivery, /^#### Jin Hyuga$/m);
  assert.match(delivery, /^##### Postacie niebojowe, portretowe i systemowe \(`Dodatek A`\)$/m);
  assert.ok(script.includes('## Trening Klasy Obrony'));
  assert.ok(script.includes('**Maria:** To ćwiczenia z zaskoczenia.'));
  assert.ok(!script.includes('UCZESTNICY'), 'dane misji nie trafiają do archiwum skryptu');
  assert.ok(!script.includes('DL101_40'), 'techniczna etykieta misji nie trafia do skryptu');
});

test('scena 1-4 jest dosłownym fragmentem skryptu i domyka kolejność scen epizodu', () => {
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep1');
  assert.equal(scena.numer_sceny, '1-4');
  assert.equal(scena.tytul, 'Trening Klasy Obrony');
  assert.deepEqual(sprawdzWiernoscSceny(scena, script), []);

  const czesci = [...scena.body.matchAll(/^(#{3,4} .+)\n\n(?!:::)([\s\S]*?)(?=\n#{3,4} |\n:::|\n## |$)/gm)];
  assert.ok(czesci.length >= 6, 'scena ma wszystkie części skryptu');
  const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1')
    .sort((a, b) => String(a.numer_sceny).localeCompare(String(b.numer_sceny)));
  assert.deepEqual(sceny.map((s) => s.numer_sceny), ['1-1', '1-2', '1-3', '1-4']);
});

test('każda podsekcja analizy ma własną kotwicę w treści sceny', () => {
  // Podsekcje analizy to tylko blok „## Analiza” — nagłówki skryptu mają własne `###`.
  const blokAnalizy = scena.body.split('## Analiza')[1].split('\n## ')[0];
  const analiza = [...blokAnalizy.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  assert.equal(analiza.length, 6, 'sześć etapów treningu');
  const mapa = scena.sekcje_analizy ?? [];
  assert.equal(mapa.length, 6, 'mapa kotwic pokrywa wszystkie podsekcje');
  for (const wpis of mapa) {
    const [lewa, prawa] = String(wpis).split('→').map((s) => s.trim());
    assert.ok(analiza.includes(lewa), `analiza: ${lewa}`);
    assert.ok(scena.body.includes(prawa), `treść sceny: ${prawa}`);
  }
});

test('obsada i hasła misji 4 są spięte ze sceną i epizodem', () => {
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
  assert.ok(epizod.zrodla.includes('https://en.wikipedia.org/wiki/Matchless_Raijin-Oh'));
});

test('Raijin-Oh ma parametry pary (mech, gra) z dostawy i troje pilotów', () => {
  const mech = bySlug.get('raijin-oh');
  assert.equal(mech.typ, 'mech');
  assert.equal(mech.seria, 'matchless-raijin-oh');
  assert.deepEqual(mech.piloci, ['jin-hyuga', 'asuka-tsukishiro', 'koji-hoshiyama']);
  const stats = JSON.parse(mech.w_gre['srw-oe']);
  assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_4.txt');
  assert.equal(stats.profil, 'Raijin-Oh');
  assert.match(mech.body, /\| 0 \| Raijin Claw \| 2100 \| 1–7 \| \+0 \| 15 \|/);
  assert.match(mech.body, /\| 1 \| Raijin Boomerang \| 2500 \| 3–5 \| \+30 \| 0 \|/);
  assert.match(mech.body, /\| 2 \| Raijin Sword \| 3100 \| 1–2 \| \+35 \| 5 \|/);
  assert.match(mech.body, /\| 3 \| Raijin Flash \| 3600 \| 1–3 \| \+10 \| 20 \| 105 \|/);
  assert.match(mech.body, /\| 4 \| God Thunder Crash \| 5600 \| 1–1 \| \+20 \| 50 \| 115 \|/);
  assert.match(mech.body, /Odnowa EN/);
  assert.match(mech.body, /God Raijin-Oh/);
  assert.doesNotMatch(mech.body, /&lt;br&gt;|DL101_40|eventP00/);
});

test('piloci Raijin-Oh mają wartości z dostawy, a wspierający tylko pulę SP', () => {
  const profile = {
    'jin-hyuga': [50, 120, 77, 126, 63],
  };
  for (const [slug, wartosci] of Object.entries(profile)) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac', slug);
    assert.equal(page.rola, 'pilot', slug);
    assert.equal(page.seria, 'matchless-raijin-oh', slug);
    assert.deepEqual(page.mechy, ['raijin-oh'], slug);
    for (const [nazwa, wartosc] of [['SP', wartosci[0]], ['Atak', wartosci[1]], ['Obrona', wartosci[2]],
      ['Celność', wartosci[3]], ['Unik', wartosci[4]]]) {
      assert.match(page.body, new RegExp(`\\| ${nazwa} \\| ${wartosc} \\|`), `${slug}: ${nazwa}`);
    }
    assert.match(page.body, /\| 1 \| \*\*Skupienie\*\* \| 1 \| 15 \|/);
    assert.match(page.body, /\| 1 \| \*\*Potenc\. Atk\*\* \| 1 \|/);
  }
  for (const slug of ['asuka-tsukishiro', 'koji-hoshiyama']) {
    const page = bySlug.get(slug);
    assert.equal(page.rola, 'wsparcie', slug);
    assert.deepEqual(page.mechy, ['raijin-oh'], slug);
    assert.match(page.body, /Pula SP:\*\* 50/, slug);
  }
  assert.match(bySlug.get('asuka-tsukishiro').body, /\| 1 \| \*\*Pęd\*\* \| 1 \| 20 \|/);
  assert.match(bySlug.get('koji-hoshiyama').body, /\| 1 \| \*\*Zauf\.\*\* \| 1 \| 20 \|/);
});

test('postacie niebojowe z Dodatku A mają własne strony bez statystyk', () => {
  for (const slug of ['maria-shiratori', 'tsutomu-kojima', 'kirara-haruno', 'yoko-kuriki']) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac', slug);
    assert.equal(page.seria, 'matchless-raijin-oh', slug);
    assert.equal(page.mechy, undefined, `${slug}: Dodatek A nie przypisuje maszyn`);
    assert.doesNotMatch(page.body, /## Parametry/, `${slug}: brak statystyk w dostawie`);
  }
  assert.equal(bySlug.get('maria-shiratori').rola, 'dowodztwo');
  // Cookie to zdrobnienie Yoko Kuriki — potwierdza je źródło, nie skrypt.
  assert.match(bySlug.get('yoko-kuriki').body, /Cookie/);
  assert.match(bySlug.get('yoko-kuriki').body, /\[\[yoko-kuriki\|Cookie\]\]|Cookie/);
});

test('seria i hasła świata opisują świat, a źródło jest otwarte i cytowane', () => {
  const seria = bySlug.get('matchless-raijin-oh');
  assert.equal(seria.typ, 'seria');
  assert.equal(seria.rok, 1991);
  assert.equal(seria.odcinki, 51);
  const zrodlo = 'https://en.wikipedia.org/wiki/Matchless_Raijin-Oh';
  assert.ok(seria.zrodla.includes(zrodlo));
  assert.match(seria.body, /51-odcinkowy/);

  for (const slug of ['klasa-obrony-ziemi', 'akademia-hinobori']) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'pojecie', slug);
    assert.ok(page.zrodla.includes(zrodlo), `${slug}: źródło w frontmatterze`);
    assert.ok(page.body.includes(zrodlo), `${slug}: adres przy informacji`);
  }
  assert.equal(bySlug.get('klasa-obrony-ziemi').kategoria, 'organizacja');
  assert.equal(bySlug.get('akademia-hinobori').kategoria, 'miejsce');
});

test('nowe strony nie dostają ilustracji, których właściciel nie dostarczył', () => {
  for (const slug of [...postacie, ...mechy, 'matchless-raijin-oh', 'klasa-obrony-ziemi',
    'akademia-hinobori', 'srw-oe-ep1-trening-klasy-obrony']) {
    assert.equal(manifest.encje[slug], undefined, `${slug}: brak wpisu w manifeście`);
    assert.doesNotMatch(bySlug.get(slug).body, /r2\.dev/, `${slug}: brak ilustracji`);
    assert.doesNotMatch(bySlug.get(slug).body, /^## Ilustracje$/m, `${slug}: brak galerii`);
  }
});

test('strony misji 4 nie ujawniają surowych etykiet dostawy', () => {
  for (const page of [scena, epizod, bySlug.get('raijin-oh'), bySlug.get('jin-hyuga'),
    bySlug.get('klasa-obrony-ziemi'), bySlug.get('akademia-hinobori')]) {
    assert.doesNotMatch(page.body, /DL101_40|Entry ID|eventP00|charalist00/, page.slug);
  }
});
