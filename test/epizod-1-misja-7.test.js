/**
 * Misja 7 epizodu 1 „Szalejący Labor powraca”: dostawa z 2026-10-24
 * (dostawa_1_7.txt).
 *
 * Regresje pilnują niezmienionego archiwum, dosłownej sceny, obsady SV2 i Klasy
 * Obrony, nowych postaci oraz odrębnej strony transformacji God Raijin-Oh.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const deliveryBytes = fs.readFileSync('dostawy/srw-oe/dostawa_1_7.txt');
const delivery = deliveryBytes.toString('utf8').replace(/\r\n/g, '\n');
const script = fs.readFileSync('episodes/srw-oe/ep001.md', 'utf8');
const scena = bySlug.get('srw-oe-ep1-szalejacy-labor-powraca');
const epizod = bySlug.get('srw-oe-ep1');

const postacie = ['kanuka-clancy', 'noa-izumi', 'isao-ota', 'asuma-shinohara',
  'mikiyasu-shinshi', 'hiromi-yamazaki', 'kiichi-goto', 'seitaro-sakaki',
  'jin-hyuga', 'asuka-tsukishiro', 'koji-hoshiyama', 'maria-shiratori',
  'control-ai', 'badrinath-harchand', 'utsumi', 'kurosaki'];
const mechy = ['ingram-nr-1', 'ingram-nr-2', 'raijin-oh', 'brocken'];
const pojecia = ['sv2', 'labor', 'klasa-obrony-ziemi'];
const noweStrony = ['srw-oe-ep1-szalejacy-labor-powraca', 'god-raijin-oh',
  'badrinath-harchand', 'seitaro-sakaki', 'utsumi', 'kurosaki'];

function komorki(wiersz) {
  return wiersz.split('|').slice(1, -1).map((cell) => cell.trim());
}

test('dostawa 1-7 jest zachowana bajt w bajt, a cały jej skrypt poprzedza misję 1-8 w epizodzie', () => {
  assert.equal(deliveryBytes.length, 25199);
  assert.equal(createHash('md5').update(deliveryBytes).digest('hex'),
    '6e168febc1a7f755cce16229efff78c7');
  assert.equal(createHash('sha256').update(deliveryBytes).digest('hex'),
    'e24b287deb455b943d475274fd1863ed279f9d3f1840eeeeccd79f2ef5549424');
  assert.match(delivery, /^## Szalejący Labor powraca$/m);
  assert.match(delivery, /^### Odcinek 1 — Szalejący Labor powraca \(`DL101_70`\)$/m);
  assert.match(delivery, /^## God Raijin-Oh$/m);
  assert.match(delivery, /^#### Badrinath Harchand$/m);
  assert.match(delivery, /Brocken\/Melee.*×5 rekordów źródłowych Entry ID/);
  const expected = delivery.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
  assert.ok(script.includes(expected), 'pełna misja 1-7 w skrypcie epizodu');
  assert.ok(script.includes('**Bud:** No!\n\n## Śledztwo pod przykrywką'));
  assert.ok(!script.includes('UCZESTNICY'));
  assert.ok(!script.includes('DL101_70'));
});

test('scena 1-7 jest dosłowna i poprzedza misję 1-8 w epizodzie 1', () => {
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep1');
  assert.equal(scena.numer_sceny, '1-7');
  assert.equal(scena.tytul, 'Szalejący Labor powraca');
  assert.deepEqual(sprawdzWiernoscSceny(scena, script), []);
  assert.equal((scena.body.match(/:::skrypt/g) ?? []).length, 8);
  for (const fragment of ['### SV2, Drugi Pluton / Hangar', '### Zgłoszenie z 7. okręgu',
    '### Wielki plac budowy', '### Przybycie Raijin-Oh', '### Po bitwie',
    '### Wielki plac budowy / Okolica', '**Bud:** No!']) {
    assert.ok(scena.body.includes(fragment), fragment);
  }
  const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1')
    .sort((a, b) => String(a.numer_sceny).localeCompare(String(b.numer_sceny)));
  assert.deepEqual(sceny.map((s) => s.numer_sceny),
    ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8']);
});

test('osiem etapów analizy ma kotwice i zachowuje ograniczenia oraz nierozstrzygniętą przyczynę', () => {
  const blokAnalizy = scena.body.split('## Analiza')[1].split('\n## ')[0];
  const analiza = [...blokAnalizy.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(analiza, ['Koszt stałej gotowości', 'Kod 205', 'Granice działania',
    'Utrzymanie pozycji', 'Pomoc Raijin-Oh', 'Rywalizacja i ostrożność',
    'Nierozwiązana przyczyna', 'Ocena obserwatorów']);
  const mapa = scena.sekcje_analizy ?? [];
  assert.equal(mapa.length, 8);
  for (const wpis of mapa) {
    const [lewa, prawa] = String(wpis).split('→').map((s) => s.trim());
    assert.ok(analiza.includes(lewa), `analiza: ${lewa}`);
    assert.ok(scena.body.includes(prawa), `treść: ${prawa}`);
  }
  assert.match(scena.body, /ani Labory, ani kule nie mogą wyjść poza ten kwartał/);
  assert.match(scena.body, /Za tą serią szalejących Laborów musi stać jakaś przyczyna/);
  assert.match(scena.body, /coraz bardziej ufa swojej maszynie/);
  assert.match(scena.streszczenie, /pięć bezzałogowych Brockenów/);
  assert.match(scena.streszczenie, /przyczyna serii szalejących Laborów pozostaje nieznana/);
});

test('obsada, jednostki i hasła misji 7 są spięte ze sceną oraz epizodem', () => {
  for (const slug of postacie) {
    assert.ok(bySlug.has(slug), `brak postaci ${slug}`);
    assert.ok(scena.postacie.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.postacie.includes(slug), `epizod: ${slug}`);
  }
  for (const slug of mechy) {
    assert.ok(bySlug.has(slug), `brak mecha ${slug}`);
    assert.ok(scena.mechy.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.mechy.includes(slug), `epizod: ${slug}`);
  }
  for (const slug of pojecia) {
    assert.ok(bySlug.has(slug), `brak pojęcia ${slug}`);
    assert.ok(scena.pojecia.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.pojecia.includes(slug), `epizod: ${slug}`);
  }
  assert.ok(scena.zrodla.includes('https://en.wikipedia.org/wiki/List_of_Patlabor_characters'));
  assert.ok(epizod.zrodla.includes('https://en.wikipedia.org/wiki/List_of_Patlabor_characters'));
  assert.match(bySlug.get('control-ai').body, /steruje pięcioma \[\[brocken\|Brockenami\]\]/);
  assert.match(bySlug.get('sv2').body, /tylko SV2 może stawić czoła takim maszynom/);
});

test('powtórzone profile czterech jednostek zachowują komplet broni z nowej dostawy', () => {
  const profile = {
    brocken: ['dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md', 1],
    'ingram-nr-1': ['dostawy/srw-oe/dostawa_1_7.txt', 3],
    'ingram-nr-2': ['dostawy/srw-oe/dostawa_1_7.txt', 3],
    'raijin-oh': ['dostawy/srw-oe/dostawa_1_4.txt', 5],
  };
  for (const [slug, [zrodlo, liczba]] of Object.entries(profile)) {
    const mech = bySlug.get(slug);
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(stats.dostawa, zrodlo, `${slug}: źródło parametrów`);
    const rows = mech.body.split('\n').filter((line) => /^\|\s*\d+\s*\|/.test(line));
    assert.equal(rows.length, liczba, `${slug}: liczba broni`);
    for (const row of rows) {
      const cells = komorki(row);
      assert.equal(cells.length, 9, `${slug}: kolumny`);
      for (const cell of cells) {
        assert.ok(stats.dane.includes(cell), `${slug} w_gre: ${cell}`);
        for (const fragment of cell.split('; ')) {
          assert.ok(delivery.includes(fragment), `${slug} dostawa: ${fragment}`);
        }
      }
    }
  }
  assert.match(bySlug.get('ingram-nr-1').body, /Bez kontry 1t: Atk\/Cel\/Unik-20% Kryt\+8%/);
  assert.match(bySlug.get('ingram-nr-1').body, /Ogłuszenie.*\+Obraż\.500 Szansa 30%/);
  assert.match(bySlug.get('ingram-nr-2').body, /Ogłuszenie.*\+Obraż\.500 Szansa 30%/);
});

test('God Raijin-Oh ma odrębne parametry i załogę, ale nie jest osobną jednostką sceny', () => {
  const god = bySlug.get('god-raijin-oh');
  assert.equal(god.typ, 'mech');
  assert.equal(god.seria, 'matchless-raijin-oh');
  assert.deepEqual(god.piloci, ['jin-hyuga', 'asuka-tsukishiro', 'koji-hoshiyama', 'bakuryu-oh']);
  for (const slug of ['jin-hyuga', 'asuka-tsukishiro', 'koji-hoshiyama']) {
    assert.deepEqual(bySlug.get(slug).mechy, ['raijin-oh', 'god-raijin-oh'], slug);
  }
  // Bakuryu-Oh jest kopilotem wyłącznie formy God Raijin-Oh, nie pilotauje Raijin-Oha.
  assert.deepEqual(bySlug.get('bakuryu-oh').mechy, ['god-raijin-oh']);
  assert.match(god.body, /\[\[raijin-oh\|Raijin-Oh\]\]/);
  assert.match(bySlug.get('raijin-oh').body, /\[\[god-raijin-oh\|God Raijin-Oh\]\]/);
  assert.ok(!scena.mechy.includes('god-raijin-oh'), 'transformacja nie jest osobną jednostką sceny');
  assert.ok(!epizod.mechy.includes('god-raijin-oh'), 'skrypt nie przedstawia jej użycia');
  // Dostawa ilustracji z 2026-10-25: galeria God Raijin-Oha ma dwa własne pliki,
  // a portret kopilota Bakuryu-Oha należy do jego strony postaci (ADR 0017).
  const manifestIlustracji = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  assert.deepEqual(manifestIlustracji.encje['god-raijin-oh'], ['God Raijin-Oh.png', 'God Raijin-Oh 2.png']);
  assert.deepEqual(manifestIlustracji.encje['bakuryu-oh'], ['characters/Bakuryu-Oh.png']);
  assert.match(god.body, /^## Ilustracje$/m);
  for (const plik of manifestIlustracji.encje['god-raijin-oh']) {
    const adres = `${manifestIlustracji.baseUrl}/${plik.split('/').map(encodeURIComponent).join('/')}`;
    assert.ok(god.body.includes(adres), `adres ilustracji: ${plik}`);
  }

  const stats = JSON.parse(god.w_gre['srw-oe']);
  assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_7.txt');
  assert.equal(stats.profil, 'God Raijin-Oh');
  const rows = god.body.split('\n').filter((line) => /^\|\s*\d+\s*\|/.test(line));
  assert.equal(rows.length, 5);
  for (const row of rows) {
    const cells = komorki(row);
    assert.equal(cells.length, 9);
    for (const cell of cells) {
      assert.ok(stats.dane.includes(cell), `w_gre: ${cell}`);
      // Wielowierszowe efekty dostawy łączymy w tabeli średnikami; każdą część
      // nadal sprawdzamy dosłownie względem surowego źródła.
      for (const fragment of cell.split('; ')) {
        assert.ok(delivery.includes(fragment), `dostawa: ${fragment}`);
      }
    }
  }
  assert.deepEqual(rows.map((row) => komorki(row).slice(0, 7)), [
    ['0', 'God Raijin Boomerang', '2700', '2–5', '+35', '0', '—'],
    ['1', 'God Raijin Sword', '3000', '1–8', '+5', '30', '—'],
    ['2', 'God Hyper Flash', '3900', '1–3', '+15', '20', '105'],
    ['3', 'Final Fire', '5400', '3–6', '+10', '50', '120'],
    ['4', 'Hyper Thunder Crash', '6500', '1–2', '+25', '70', '140'],
  ]);
  for (const fragment of ['Odnowa HP', 'Odnowa EN', 'Blok tarczą']) {
    assert.ok(stats.dane.includes(fragment), fragment);
    assert.ok(delivery.includes(fragment), fragment);
  }
});

test('Jin dostaje Blok, a Noa i Ota — Policjanta z poziomu 3', () => {
  const profile = {
    'jin-hyuga': ['Blok', 'Obraż.-16% Sz. 12% *(1.08)*'],
    'noa-izumi': ['Policjant', 'Zadawane Obraż. x1.1 / Obr+4%'],
    'isao-ota': ['Policjant', 'Zadawane Obraż. x1.1 / Obr+4%'],
  };
  for (const [slug, [umiejetnosc, efekt]] of Object.entries(profile)) {
    const rows = bySlug.get(slug).body.split('\n')
      .filter((line) => /^\|\s*\d+\s*\|/.test(line));
    const row = rows.find((line) => line.includes(`**${umiejetnosc}**`));
    assert.ok(row, `${slug}: ${umiejetnosc}`);
    assert.deepEqual(komorki(row), ['2', `**${umiejetnosc}**`, '3', efekt], slug);
    assert.ok(delivery.includes(`**${umiejetnosc}**`), `${slug}: nazwa w dostawie`);
    assert.ok(delivery.includes(efekt), `${slug}: efekt w dostawie`);
  }
});

test('Bud ma wartości z dostawy bez spoilerów rekrutacji, a postacie z Dodatku A nie dostają statystyk', () => {
  const bud = bySlug.get('badrinath-harchand');
  assert.equal(bud.typ, 'postac');
  assert.equal(bud.rola, 'pilot');
  assert.equal(bud.seria, 'mobile-police-patlabor');
  assert.deepEqual(bud.mechy, []);
  for (const [nazwa, wartosc] of [['SP', 60], ['Atak', 111], ['Obrona', 70],
    ['Celność', 141], ['Unik', 79]]) {
    assert.match(bud.body, new RegExp(`\\| ${nazwa} \\| ${wartosc} \\|`), nazwa);
  }
  assert.match(bud.body, /\*\*Nazwa skrócona:\*\* Bud/);
  assert.doesNotMatch(bud.body, /Przekierowanie|\+100|\(Ally\)|silnik przełącza/i);
  assert.match(bud.body, /\| 1 \| \*\*Potencjał\*\* \| 1 \| Pozostałe HP 10%: Obr\/Cel\/Unik\/Kryt\+4% \|/);
  assert.match(bud.body, /coraz bardziej ufa swojemu \[\[ingram-nr-1\|Ingramowi\]\]/);

  const role = { 'seitaro-sakaki': 'wsparcie', utsumi: 'dowodztwo', kurosaki: 'wsparcie' };
  for (const [slug, rola] of Object.entries(role)) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac', slug);
    assert.equal(page.rola, rola, slug);
    assert.equal(page.seria, 'mobile-police-patlabor', slug);
    assert.equal(page.mechy, undefined, `${slug}: Dodatek A nie przypisuje maszyn`);
    assert.doesNotMatch(page.body, /## Parametry/, `${slug}: brak statystyk w dostawie`);
    assert.ok(page.zrodla.includes('https://en.wikipedia.org/wiki/List_of_Patlabor_characters'));
  }
});

test('nowe strony nie przenoszą surowych etykiet ani nie tworzą jednostek spoza dostawy', () => {
  for (const slug of noweStrony) {
    const page = bySlug.get(slug);
    assert.doesNotMatch(page.body, /DL101_70|Entry ID|eventP00|charalist00|srwoe_/, slug);
  }
  assert.equal(pages.some((page) => /griffon/i.test(page.slug)), false,
    'źródłowa wzmianka o późniejszej maszynie Buda nie tworzy nowej encji');
  for (const slug of ['badrinath-harchand', 'seitaro-sakaki', 'utsumi', 'kurosaki']) {
    assert.doesNotMatch(bySlug.get(slug).body, /Griffon|J9/, slug);
  }
});

test('epizod i wpis Co nowego opisują misję 7 oraz nowe dane', () => {
  assert.ok(epizod.body.includes('[[srw-oe-ep1-szalejacy-labor-powraca|Misja 7: Szalejący Labor powraca]]'));
  assert.match(epizod.body, /pięć bezzałogowych \[\[brocken\|Brockenów\]\]/);
  assert.match(epizod.body, /przyczyna serii szalejących Laborów pozostaje nieznana/);
  assert.match(epizod.body, /Wspólna obrona placu budowy/);
  const changelog = fs.readFileSync('content/co-nowego.md', 'utf8');
  const wpis = changelog.split(/^## /m).slice(1).find((entry) => entry.startsWith('2026-10-24 21:26'));
  assert.ok(wpis, 'wpis z 2026-10-24 21:26 o misji 7');
  assert.ok(wpis.includes('srw-oe-ep1-szalejacy-labor-powraca'));
  assert.ok(wpis.includes('god-raijin-oh'));
  assert.ok(wpis.includes('badrinath-harchand'));
  assert.ok(wpis.includes('**Blok**'));
  assert.ok(wpis.includes('**Policjant**'));
});
