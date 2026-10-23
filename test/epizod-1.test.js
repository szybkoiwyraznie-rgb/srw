/**
 * Epizod 1 „Szalejący prototyp Labora”: dostawa z 2026-10-21 (dostawa_1_1.txt).
 *
 * Testy pilnują trzech rzeczy:
 * - materiał z dostawy trafia do bazy bez zmiany wartości (mechy, piloci, obsada),
 * - scena jest dosłownym fragmentem skryptu epizodu,
 * - nowe wpisy nie dostają ilustracji, dopóki właściciel ich nie dostarczy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const delivery = fs.readFileSync('dostawy/srw-oe/dostawa_1_1.txt', 'utf8');
const script = fs.readFileSync('episodes/srw-oe/ep001.md', 'utf8');

const noweMechy = ['hal-x10', 'hal-x10-green', 'helldiver', 'ingram-nr-1', 'ingram-nr-2', 'medea'];
const nowePostacie = [
  'noa-izumi', 'isao-ota', 'kanuka-clancy', 'asuma-shinohara', 'kiichi-goto',
  'mikiyasu-shinshi', 'hiromi-yamazaki', 'zolnierz-jsdf', 'shinohara-hos',
];
const nowePojecia = ['labor', 'sv2', 'sily-samoobrony-japonii', 'poligon-fuji'];

// Nazwa pliku bazowego ilustracji w R2 (drugi plik tej samej maszyny to „<nazwa> 2.png”).
const BY_SLUG = {
  'hal-x10': 'HAL-X10.png',
  'hal-x10-green': 'HAL-X10 Green.png',
  'ingram-nr-1': 'Ingram nr 1.png',
  'ingram-nr-2': 'Ingram nr 2.png',
};

// Portrety w characters/ — nazwa pliku równa się tytułowi postaci.
const PORTRETY = {
  'asuma-shinohara': 'Asuma Shinohara.png',
  'hiromi-yamazaki': 'Hiromi Yamazaki.png',
  'isao-ota': 'Isao Ota.png',
  'kanuka-clancy': 'Kanuka Clancy.png',
  'kiichi-goto': 'Kiichi Goto.png',
  'mikiyasu-shinshi': 'Mikiyasu Shinshi.png',
  'noa-izumi': 'Noa Izumi.png',
};

test('epizod 1 istnieje, a skrypt jest archiwum rozegrania', () => {
  const ep = bySlug.get('srw-oe-ep1');
  assert.equal(ep.typ, 'epizod');
  assert.equal(ep.numer, 1);
  assert.equal(ep.gra, 'srw-oe');
  assert.equal(ep.skrypt, 'episodes/srw-oe/ep001.md');
  assert.match(script, /^# Super Robot Wars OE — Epizod 1/);
  assert.match(script, /## Ep\. 1: Szalejący prototyp Labora/);
  assert.match(script, /\*\*Himari:\*\* Cooo\?! To chyba jakaś pomyłka\?/);
  assert.ok(!script.includes('MISJA'), 'skrypt kończy się przed danymi misji');

  const scena = bySlug.get('srw-oe-ep1-szalejacy-prototyp-labora');
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep1');
  assert.equal(scena.numer_sceny, '1-1');
  assert.match(scena.body, /## Treść sceny/);
  assert.match(scena.body, /## Analiza/);
  assert.match(scena.body, /:::skrypt\n/);
  assert.match(scena.body, /### Stacja Connect \/ Okolice Ziemi/);
});

test('epizod 1 ma scenę 1-1, a skrypt jest w niej podzielony na części', () => {
  const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1');
  assert.equal(sceny.length, 4, 'epizod 1 ma dziś cztery sceny: 1-1, 1-2, 1-3 i 1-4');
  const scena = sceny.find((s) => s.slug === 'srw-oe-ep1-szalejacy-prototyp-labora');
  assert.ok(scena, 'scena 1-1 istnieje');
  assert.equal(scena.numer_sceny, '1-1');
  assert.equal(scena.tytul, 'Szalejący prototyp Labora');
  assert.match(scena.body, /## Treść sceny/);
  assert.match(scena.body, /## Analiza/);

  // Każda część ma własny nagłówek i własny blok skryptu — nagłówki zostają widoczne na stronie.
  const czesci = [...scena.body.matchAll(/^(#{3,4} .+)\n\n:::skrypt\n([\s\S]*?)\n:::/gm)]
    .map((m) => ({ naglowek: m[1], tekst: m[2] }));
  assert.equal(czesci.length, 8);
  assert.deepEqual(czesci.map((c) => c.naglowek), [
    '### Stacja Connect / Okolice Ziemi',
    '### Patlabor',
    '### Siły Samoobrony, poligon Fuji',
    '### SV2 dołącza do ćwiczeń',
    '### Ostra amunicja',
    '#### Dialogi bojowe — warunkowe i sytuacyjne',
    '### Po ćwiczeniach',
    '### Następstwa',
  ]);

  // Części sklejone w kolejności dają cały skrypt poza nagłówkiem pliku i kreską zamykającą.
  const odtworzone = czesci.map((c) => `${c.naglowek}\n\n${c.tekst}`).join('\n\n');
  // Scena 1-1 obejmuje pierwszą misję; tekst drugiej misji zaczyna się pod osobnym nagłówkiem.
  const oczekiwane = script
    .replace(/^# Super Robot Wars OE — Epizod 1\n\n---\n\n## Ep\. 1: Szalejący prototyp Labora\n\n/, '')
    .split('\n\n---\n\n## Black Tri-Stars')[0]
    .replace(/\n\n---\n?$/, '');
  assert.equal(odtworzone, oczekiwane);
  for (const czesc of czesci) assert.ok(script.includes(czesc.tekst), czesc.naglowek);
  assert.equal(pages.filter((p) => p.typ === 'scena').length, 6, 'dwie sceny epizodu 0 i cztery epizodu 1');
});

test('obsada epizodu i sceny obejmuje wszystkie postacie i jednostki z misji', () => {
  const postacie = ['seishiro', 'himari-yaegaki', 'suol', ...nowePostacie];
  const mechy = ['exart', 'ingram-nr-1', 'ingram-nr-2', 'medea', 'hal-x10', 'hal-x10-green', 'helldiver'];
  const ep = bySlug.get('srw-oe-ep1');
  for (const p of postacie) assert.ok(ep.postacie.includes(p), `epizod: ${p}`);
  for (const m of mechy) assert.ok(ep.mechy.includes(m), `epizod: ${m}`);
  for (const h of nowePojecia) assert.ok(ep.pojecia.includes(h), `epizod: ${h}`);

  const scena = bySlug.get('srw-oe-ep1-szalejacy-prototyp-labora');
  for (const p of postacie) assert.ok(scena.postacie.includes(p), `scena: ${p}`);
  for (const m of mechy) assert.ok(scena.mechy.includes(m), `scena: ${m}`);
  for (const h of nowePojecia) assert.ok(scena.pojecia.includes(h), `scena: ${h}`);
});

test('sześć nowych jednostek ma pełne uzbrojenie z dostawy i własne parametry pary (mech, gra)', () => {
  const jednostki = [
    ['hal-x10', 3],
    ['hal-x10-green', 3],
    ['helldiver', 2],
    ['ingram-nr-1', 3],
    ['ingram-nr-2', 3],
    ['medea', 1],
  ];
  for (const [slug, count] of jednostki) {
    const mech = bySlug.get(slug);
    assert.equal(mech.typ, 'mech', slug);
    assert.deepEqual(mech.gry, ['srw-oe'], slug);
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_1.txt', slug);
    assert.ok(delivery.includes(stats.profil), `${slug}: profil w dostawie`);
    const rows = mech.body.split('\n').filter((line) => /^\| \d+ \|/.test(line));
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

test('jednostki mają pilotów zgodnych z obsadą misji i serię z dostawy', () => {
  const obsada = {
    'hal-x10': ['shinohara-hos'],
    'hal-x10-green': ['shinohara-hos'],
    helldiver: ['zolnierz-jsdf'],
    'ingram-nr-1': ['noa-izumi'],
    'ingram-nr-2': ['isao-ota'],
    medea: ['zolnierz-jsdf'],
  };
  for (const [slug, piloci] of Object.entries(obsada)) {
    assert.deepEqual(bySlug.get(slug).piloci, piloci, slug);
  }
  assert.equal(bySlug.get('hal-x10').seria, 'patlabor-the-movie');
  assert.equal(bySlug.get('hal-x10-green').seria, 'mobile-police-patlabor');
  assert.equal(bySlug.get('ingram-nr-1').seria, 'mobile-police-patlabor');
  assert.equal(bySlug.get('helldiver').seria, 'mobile-police-patlabor');
  assert.equal(bySlug.get('medea').seria, undefined, 'Medea bez ustalonej serii');
  assert.ok(bySlug.has('patlabor-the-movie'));
  assert.equal(bySlug.get('patlabor-the-movie').rodzaj, 'film');
});

test('profile pilotów z epizodu 1: statystyki, komendy Ducha i umiejętności', () => {
  const statystyki = {
    'noa-izumi': [50, 116, 66, 134, 76],
    'isao-ota': [50, 120, 72, 139, 61],
    'kanuka-clancy': [50, 112, 64, 146, 72],
    'zolnierz-jsdf': [10, 107, 61, 122, 61],
    'shinohara-hos': [10, 102, 65, 122, 65],
  };
  for (const [slug, [sp, atk, obr, cel, unik]] of Object.entries(statystyki)) {
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Parametry/, `${slug}: parametry`);
    for (const [nazwa, wartosc] of [['SP', sp], ['Atak', atk], ['Obrona', obr], ['Celność', cel], ['Unik', unik]]) {
      assert.match(body, new RegExp(`\\| ${nazwa} \\| ${wartosc} \\|`), `${slug}: ${nazwa}`);
    }
  }
  // Podpilot Himari ma pulę SP i komendę Zauf., ale nie statystyki bojowe.
  const himari = bySlug.get('himari-yaegaki').body;
  assert.match(himari, /\*\*Pula SP:\*\* 60/);
  assert.match(himari, /\*\*Zauf\.\*\* \| 1 \| 20 \|/);
  assert.doesNotMatch(himari, /\| Atak \|/);
  // Duchy i umiejętności rozpoznawalne na stronach.
  assert.match(bySlug.get('noa-izumi').body, /\*\*Hart\*\* \| 1 \| 20 \|/);
  assert.match(bySlug.get('isao-ota').body, /\*\*Niezł\.\*\* \| 1 \| 15 \|/);
  assert.match(bySlug.get('kanuka-clancy').body, /\*\*Wiatr\*\* \| 1 \| 20 \|/);
  assert.match(bySlug.get('shinohara-hos').body, /\*\*Rój\*\* \| 1 \|/);
  assert.doesNotMatch(bySlug.get('zolnierz-jsdf').body, /Komendy Ducha/);
});

test('relacje postaci i załogi są spójne w obie strony', () => {
  assert.deepEqual(bySlug.get('noa-izumi').mechy, ['ingram-nr-1']);
  assert.deepEqual(bySlug.get('isao-ota').mechy, ['ingram-nr-2']);
  assert.deepEqual(bySlug.get('zolnierz-jsdf').mechy, ['medea', 'helldiver']);
  assert.deepEqual(bySlug.get('shinohara-hos').mechy, ['hal-x10', 'hal-x10-green']);
  assert.deepEqual(bySlug.get('exart').piloci, ['seishiro', 'himari-yaegaki']);
  assert.deepEqual(bySlug.get('himari-yaegaki').mechy, ['exart']);
  assert.match(bySlug.get('ingram-nr-1').body, /\[\[noa-izumi\|Noę Izumi\]\]/);
  assert.match(bySlug.get('hal-x10').body, /\[\[shinohara-hos\|HOS\]\]/);
  assert.match(bySlug.get('exart').body, /podpilot/);
});

test('nowe hasła i seria opisują świat epizodu 1', () => {
  for (const slug of nowePojecia) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'pojecie', slug);
    assert.ok(page.kategoria, slug);
    assert.match(page.body, /## Opis/, slug);
  }
  assert.match(bySlug.get('labor').body, /Policja Metropolitalna Tokio/);
  assert.match(bySlug.get('sv2').body, /Drugi Pluton/);
  assert.match(bySlug.get('sily-samoobrony-japonii').body, /neutralności/);
  assert.match(bySlug.get('poligon-fuji').body, /HAL-X10/);
  assert.match(bySlug.get('patlabor-the-movie').body, /HAL-X10/);
});

test('epizod 1 nie ujawnia surowych etykiet misji, a jednostki mają dostarczone ilustracje', () => {
  const nowe = [...noweMechy, ...nowePostacie, ...nowePojecia, 'patlabor-the-movie',
    'srw-oe-ep1', ...pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1').map((p) => p.slug)];
  for (const slug of nowe) {
    assert.doesNotMatch(bySlug.get(slug).body, /DL101|Entry ID|Entry character|eventP00/, `${slug}: bez surowych danych misji`);
  }

  // Cztery jednostki dostały po dwie ilustracje; pozostałe nowe strony nadal ich nie mają.
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  for (const slug of ['hal-x10', 'hal-x10-green', 'ingram-nr-1', 'ingram-nr-2']) {
    const files = manifest.encje[slug];
    const baza = BY_SLUG[slug].replace(/\.png$/, '');
    assert.deepEqual(files, [`${baza}.png`, `${baza} 2.png`], slug);
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria z zakresem gry`);
    assert.equal((body.match(/!\[/g) ?? []).length, 2, `${slug}: dwie ilustracje`);
    for (const file of files) {
      assert.ok(body.includes(`${manifest.baseUrl}/${encodeURIComponent(file)}`), `${slug}: ${file}`);
    }
  }
  // Siedem postaci z obsady dostało po jednym portrecie w characters/.
  for (const [slug, plik] of Object.entries(PORTRETY)) {
    assert.deepEqual(manifest.encje[slug], [`characters/${plik}`], slug);
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria z zakresem gry`);
    assert.equal((body.match(/!\[/g) ?? []).length, 1, `${slug}: jeden portret`);
    assert.ok(body.includes(`${manifest.baseUrl}/characters/${encodeURIComponent(plik)}`), `${slug}: portret`);
    assert.match(body, /\]\([^)]*characters\/[^)]*\.png\)/, `${slug}: portret w characters/`);
  }

  // Postacie bez profilu ze zdjęciem, hasła, seria, epizod i scena nadal nie mają ilustracji.
  for (const slug of ['zolnierz-jsdf', 'shinohara-hos', ...nowePojecia, 'patlabor-the-movie', 'srw-oe-ep1', 'srw-oe-ep1-szalejacy-prototyp-labora']) {
    assert.doesNotMatch(bySlug.get(slug).body, /!\[/, `${slug}: bez ilustracji`);
  }
});

test('dziennik i opis PR opisują epizod 1 bez zdradzania dalszej fabuły', () => {
  const dziennik = fs.readFileSync('content/co-nowego.md', 'utf8');
  assert.match(dziennik, /Epizod 1/);
  assert.match(dziennik, /\[\[srw-oe-ep1\|/);
});
