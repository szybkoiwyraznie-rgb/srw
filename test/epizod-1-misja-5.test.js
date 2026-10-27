/**
 * Misja 5 epizodu 1 „Start Alexa”: dostawa z 2026-10-23 (dostawa_1_5.txt).
 *
 * Regresje pilnują archiwum, dosłownej sceny 1-5, powiązań, rozdzielenia
 * konfiguracji jednostek, profili pilotów oraz różnic wobec odcinka 1 Gundam 0080.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const deliveryBytes = fs.readFileSync('dostawy/srw-oe/dostawa_1_5.txt');
const delivery = deliveryBytes.toString('utf8').replace(/\r\n/g, '\n');
const script = fs.readFileSync('episodes/srw-oe/ep001.md', 'utf8');
const scena = bySlug.get('srw-oe-ep1-start-alexa');
const epizod = bySlug.get('srw-oe-ep1');
const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));

const postacie = ['christina-mackenzie', 'shiro-amada', 'terry-sanders-jr', 'karen-joshua',
  'michel-ninorich', 'eledore-massis', 'zolnierz-federacji', 'hardy-steiner',
  'mikhail-kaminsky', 'gabriel-ramirez-garcia', 'andy-strauss'];
const mechy = ['rx-78nt-1-gundam-alex', 'gundam-ez8', 'gundam-ground-type',
  'gundam-ground-type-glowa-gm', 'hover-truck', 'kampfer-bazooka',
  'kampfer-high-mobility', 'zaku-ii-kai'];
const pojecia = ['08-pluton-ms', 'pluton-cyclops', 'side-6', 'libot'];
const serie = ['mobile-suit-gundam-08th-ms-team', 'mobile-suit-gundam-0080'];

test('dostawa 1-5 jest zachowana bajt w bajt, a jej scena trafia do epizodu bez danych technicznych', () => {
  assert.equal(deliveryBytes.length, 32609);
  assert.equal(createHash('sha256').update(deliveryBytes).digest('hex'),
    '2604cf00f5e1861edd4192e5c8619ba5bdb48f5588ef44f5bff999ae96586796');
  assert.match(delivery, /^## Start Alexa$/m);
  assert.match(delivery, /^### Odcinek 1 — Start Alexa \(`DL101_50`\)$/m);
  assert.match(delivery, /^## Gundam Ez8$/m);
  assert.match(delivery, /^#### Christina Mackenzie$/m);
  const expected = delivery.split('---\nSKRYPT\n---\n\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
  const przedMisja6 = script.split('\n\n---\n\n## Ratuj transportowiec Medea')[0];
  assert.ok(przedMisja6.trimEnd().endsWith(expected), 'cała misja, z wariantami, bezpośrednio przed misją 1-6');
  assert.ok(!script.includes('UCZESTNICY'));
  assert.ok(!script.includes('DL101_50'));
});

test('scena 1-5 jest dosłowna i poprzedza misję 1-6 w kolejności epizodu', () => {
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep1');
  assert.equal(scena.numer_sceny, '1-5');
  assert.equal(scena.tytul, 'Start Alexa');
  assert.deepEqual(sprawdzWiernoscSceny(scena, script), []);
  for (const fragment of ['#### Dialogi warunkowe — obwód obronny',
    '#### Dialogi bojowe — sytuacyjne — powrót Karen', '### Fragment alternatywny 1',
    '### Fragment alternatywny 2', '**Żołnierz Federacji:** Wahadłowiec startuje!']) {
    assert.ok(scena.body.includes(fragment), fragment);
  }
  const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1')
    .sort((a, b) => String(a.numer_sceny).localeCompare(String(b.numer_sceny)));
  assert.deepEqual(sceny.map((s) => s.numer_sceny), ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8']);
});

test('dziewięć etapów analizy ma dokładnie dziewięć kotwic, także przy powtórzonej nazwie miejsca', () => {
  const blokAnalizy = scena.body.split('## Analiza')[1].split('\n## ')[0];
  const analiza = [...blokAnalizy.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  const mapa = scena.sekcje_analizy ?? [];
  assert.equal(analiza.length, 9);
  assert.equal(mapa.length, 9);
  assert.equal(mapa.filter((wpis) => wpis.endsWith('Baza Federacji / Centrum kontroli startów')).length, 2);
  for (const wpis of mapa) {
    const [lewa, prawa] = String(wpis).split('→').map((s) => s.trim());
    assert.ok(analiza.includes(lewa), `analiza: ${lewa}`);
    assert.ok(scena.body.includes(prawa), `treść: ${prawa}`);
  }
});

test('obsada, jednostki, serie i hasła misji 5 są spięte ze sceną oraz epizodem', () => {
  for (const slug of [...postacie, 'oficer-federacji']) {
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
  for (const slug of serie) assert.equal(bySlug.get(slug).typ, 'seria');
  for (const slug of ['earth-federation', 'zeon', 'operacja-odessa', 'minovsky-particles',
    'newtype', 'jaburo', 'black-tri-stars']) {
    assert.ok(scena.pojecia.includes(slug), `kontekst sceny: ${slug}`);
    assert.ok(epizod.pojecia.includes(slug), `kontekst epizodu: ${slug}`);
  }
});

test('siedem jednostek katalogowych zachowuje kompletne profile i wiersze uzbrojenia', () => {
  const profile = {
    'gundam-ez8': ['Gundam Ez8', 'mobile-suit-gundam-08th-ms-team', ['shiro-amada'], 4],
    'gundam-ground-type': ['Gundam Ground Type', 'mobile-suit-gundam-08th-ms-team',
      ['karen-joshua', 'terry-sanders-jr'], 4],
    'gundam-ground-type-glowa-gm': ['Gundam Ground Type/głowa GM',
      'mobile-suit-gundam-08th-ms-team', ['karen-joshua'], 4],
    'hover-truck': ['Hover Truck', 'mobile-suit-gundam-08th-ms-team',
      ['michel-ninorich', 'eledore-massis'], 4],
    'kampfer-bazooka': ['Kampfer/Bazooka', 'mobile-suit-gundam-0080', ['andy-strauss'], 4],
    'kampfer-high-mobility': ['Kampfer/High Mobility', 'mobile-suit-gundam-0080',
      ['mikhail-kaminsky'], 4],
    'zaku-ii-kai': ['Zaku II Kai', 'mobile-suit-gundam-0080',
      ['gabriel-ramirez-garcia', 'hardy-steiner'], 3],
  };
  for (const [slug, [profil, seria, piloci, liczba]] of Object.entries(profile)) {
    const mech = bySlug.get(slug);
    assert.equal(mech.typ, 'mech', slug);
    assert.equal(mech.seria, seria, slug);
    assert.deepEqual(mech.piloci, piloci, slug);
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_5.txt', slug);
    assert.equal(stats.profil, profil, slug);
    const rows = mech.body.split('\n').filter((line) => /^\|\s*\d+\s*\|/.test(line));
    assert.equal(rows.length, liczba, `${slug}: liczba broni i działań`);
    for (const row of rows) {
      const cells = row.split('|').slice(1, -1).map((cell) => cell.trim());
      assert.equal(cells.length, 9, `${slug}: kolumny`);
      for (const cell of cells) {
        assert.ok(stats.dane.includes(cell), `${slug}: wartość w w_gre: ${cell}`);
        assert.ok(delivery.includes(cell), `${slug}: wartość w źródle: ${cell}`);
      }
    }
  }
  assert.match(bySlug.get('gundam-ez8').body, /Atak szturmowy\s*\|\s*4600\s*\|\s*1–3/);
  assert.match(bySlug.get('hover-truck').body, /Naprawa\s*\|\s*0\s*\|\s*1–2[\s\S]*HP\+2000/);
});

test('Ground Type, Kampfer i Zaku II pozostają konkretnymi konfiguracjami z wzajemnymi odsyłaczami', () => {
  const ground = bySlug.get('gundam-ground-type');
  const gm = bySlug.get('gundam-ground-type-glowa-gm');
  assert.match(ground.body, /Wyrzutnia rakiet/);
  assert.doesNotMatch(ground.body, /Działo 180 mm/);
  assert.match(gm.body, /Działo 180 mm\s*\|\s*4000\s*\|\s*3–7/);
  assert.match(gm.body, /Piersiowe działko Vulcan\s*\|\s*1900/);
  assert.ok(ground.body.includes('[[gundam-ground-type-glowa-gm|'));
  assert.ok(gm.body.includes('[[gundam-ground-type|'));

  const bazooka = bySlug.get('kampfer-bazooka');
  const mobility = bySlug.get('kampfer-high-mobility');
  assert.match(bazooka.body, /Wielka bazooka\s*\|\s*2700\s*\|\s*3–6/);
  assert.doesNotMatch(bazooka.body, /Sturm Faust/);
  assert.match(mobility.body, /Sturm Faust\s*\|\s*2300\s*\|\s*1–3/);
  assert.doesNotMatch(mobility.body, /Wielka bazooka/);
  assert.ok(bazooka.body.includes('[[kampfer-high-mobility|'));
  assert.ok(mobility.body.includes('[[kampfer-bazooka|'));

  for (const slug of ['zaku-ii-char', 'zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka']) {
    assert.ok(bySlug.get(slug).body.includes('[[zaku-ii-kai|'), `${slug}: odsyłacz do Kai`);
    assert.ok(bySlug.get('zaku-ii-kai').body.includes(`[[${slug}|`), `Kai: odsyłacz do ${slug}`);
  }
});

test('Alex ma informacje z misji, ale nie dostaje statystyk ani uzbrojenia nieobecnego w źródle', () => {
  const alex = bySlug.get('rx-78nt-1-gundam-alex');
  assert.equal(alex.typ, 'mech');
  assert.equal(alex.seria, 'mobile-suit-gundam-0080');
  assert.deepEqual(alex.piloci, ['christina-mackenzie']);
  const stats = JSON.parse(alex.w_gre['srw-oe']);
  assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_5.txt');
  assert.equal(stats.profil, 'RX-78NT-1 Alex (informacje z misji)');
  assert.match(stats.dane, /panoramiczny ekran i magnetyczną powłokę/);
  assert.doesNotMatch(alex.body, /^## Parametry$/m);
  assert.doesNotMatch(alex.body, /^\|\s*\d+\s*\|/m);
  assert.match(alex.body, /pozostaje w kontenerze transportowym/);
  assert.deepEqual(bySlug.get('christina-mackenzie').mechy, ['rx-78nt-1-gundam-alex']);
});

test('piloci i załoga zachowują statystyki, komendy Ducha oraz umiejętności z profili', () => {
  const profile = {
    'christina-mackenzie': [50, 112, 73, 134, 70],
    'shiro-amada': [50, 120, 71, 135, 63],
    'terry-sanders-jr': [50, 117, 77, 129, 64],
    'karen-joshua': [50, 114, 67, 134, 72],
    'michel-ninorich': [50, 106, 71, 127, 77],
    'zolnierz-federacji': [10, 103, 58, 123, 57],
    'oficer-federacji': [10, 102, 70, 124, 54],
    'hardy-steiner': [50, 118, 76, 136, 68],
    'mikhail-kaminsky': [50, 120, 79, 131, 69],
    'gabriel-ramirez-garcia': [50, 117, 76, 130, 65],
    'andy-strauss': [50, 119, 73, 129, 68],
  };
  for (const [slug, wartosci] of Object.entries(profile)) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac', slug);
    for (const [nazwa, wartosc] of [['SP', wartosci[0]], ['Atak', wartosci[1]],
      ['Obrona', wartosci[2]], ['Celność', wartosci[3]], ['Unik', wartosci[4]]]) {
      assert.match(page.body, new RegExp(`\\| (?:\\*\\*)?${nazwa}(?:\\*\\*)?\\s*\\|\\s*${wartosc} \\|`),
        `${slug}: ${nazwa}`);
    }
  }
  const duchy = {
    'christina-mackenzie': 'Skupienie', 'shiro-amada': 'Mur', 'terry-sanders-jr': 'Niezł.',
    'karen-joshua': 'Skupienie', 'michel-ninorich': 'Zauf.', 'eledore-massis': 'Wiatr',
  };
  for (const [slug, duch] of Object.entries(duchy)) {
    assert.match(bySlug.get(slug).body, new RegExp(`\\*\\*${duch.replace('.', '\\.')}\\*\\*`), slug);
  }
  assert.match(bySlug.get('shiro-amada').body, /Potenc\. Atk/);
  assert.match(bySlug.get('shiro-amada').body, /Dow\. Obr\/Cel/);
  assert.match(bySlug.get('terry-sanders-jr').body, /Potenc\. Obr/);
  assert.match(bySlug.get('karen-joshua').body, /Potenc\. Kryt/);
  assert.match(bySlug.get('michel-ninorich').body, /Potenc\. Unik/);
  for (const slug of ['christina-mackenzie', 'zolnierz-federacji', 'oficer-federacji',
    'hardy-steiner', 'mikhail-kaminsky', 'gabriel-ramirez-garcia', 'andy-strauss']) {
    assert.match(bySlug.get(slug).body, /\*\*Potencjał\*\*/, slug);
  }
});

test('Eledore jest podpilotem Hover Trucka, a relacje załogi nie są przypadkowo odwrócone', () => {
  const eledore = bySlug.get('eledore-massis');
  assert.equal(eledore.rola, 'wsparcie');
  assert.deepEqual(eledore.mechy, ['hover-truck']);
  assert.match(eledore.body, /Pula SP:\*\* 50 \*\(podpilot korzysta/);
  assert.doesNotMatch(eledore.body, /\| (?:\*\*)?Atak(?:\*\*)?\s*\|/);
  assert.deepEqual(bySlug.get('michel-ninorich').mechy, ['hover-truck']);
  assert.equal(bySlug.get('michel-ninorich').rola, 'pilot');
  assert.deepEqual(bySlug.get('hover-truck').piloci, ['michel-ninorich', 'eledore-massis']);
  assert.match(scena.body, /W anime Eledore prowadzi wóz, a Michel pełni rolę nawigatora i celowniczego/);
});

test('Oficer zachowuje obie role, a Żołnierz Federacji ma własny profil bez przypisanej maszyny', () => {
  const oficer = bySlug.get('oficer-federacji');
  assert.match(oficer.body, /ultimatum \[\[mquve\|M'Quve'a\]\]/);
  assert.match(oficer.body, /koordynuje przygotowania transportu \[\[rx-78nt-1-gundam-alex\|Alexa\]\]/);
  assert.match(oficer.body, /odsyła pilotkę do wahadłowca/);
  const zolnierz = bySlug.get('zolnierz-federacji');
  assert.equal(zolnierz.rola, 'wsparcie');
  assert.deepEqual(zolnierz.mechy, []);
  assert.equal(zolnierz.seria, undefined);
  assert.match(zolnierz.body, /ogłasza start wahadłowca/);
});

test('serie i nawiązania wskazują odcinek 1 oraz różnice gry, bez późniejszych wydarzeń i surowych etykiet', () => {
  const s08 = bySlug.get('mobile-suit-gundam-08th-ms-team');
  const s80 = bySlug.get('mobile-suit-gundam-0080');
  assert.equal(s08.rok, 1996);
  assert.equal(s08.odcinki, 12);
  assert.equal(s08.rodzaj, 'ova');
  assert.equal(s80.rok, 1989);
  assert.equal(s80.odcinki, 6);
  assert.equal(s80.rodzaj, 'ova');
  const mahq = 'https://www.mahq.net/gundam0080ep1/';
  assert.ok(scena.zrodla.includes(mahq));
  assert.ok(epizod.zrodla.includes(mahq));
  assert.ok(s80.zrodla.includes('https://gundam.fandom.com/wiki/Mobile_Suit_Gundam_0080:_War_in_the_Pocket'));
  assert.ok(s08.zrodla.includes('https://en.wikipedia.org/wiki/Mobile_Suit_Gundam:_The_08th_MS_Team'));
  assert.match(scena.body, /pierwszego odcinka/);
  assert.match(scena.body, /obszarze arktycznym/);
  assert.match(scena.body, /GM-y Cold Districts Type/);
  assert.match(scena.body, /W oryginale Andy ginie/);
  assert.match(epizod.body, /odc\. 1 „How Many Miles to the Battlefield\?”/);
  for (const slug of ['srw-oe-ep1-start-alexa', ...postacie, ...mechy, ...pojecia, ...serie]) {
    const body = bySlug.get(slug).body;
    assert.doesNotMatch(body, /DL101_50|Entry ID|eventP00|srwoe_|Dodatek A/, slug);
    assert.doesNotMatch(body, /Bernard|Bernie|Alfred|\bAina\b|Operacja Rubicon|Operation Rubicon|Killing/, slug);
  }
});

test('galerie mają wyłącznie strony objęte dostawą ilustracji misji 1-5', () => {
  const ilustrowanePostacie = postacie.filter((slug) => slug !== 'zolnierz-federacji');
  const ilustrowaneMechy = mechy.filter((slug) => slug !== 'rx-78nt-1-gundam-alex');
  assert.equal(ilustrowanePostacie.length, 10);
  assert.equal(ilustrowaneMechy.length, 7);
  for (const slug of [...ilustrowanePostacie, ...ilustrowaneMechy]) {
    const files = manifest.encje[slug];
    assert.ok(Array.isArray(files) && files.length > 0, `${slug}: manifest`);
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: zakres galerii`);
    assert.equal((body.match(/^### Ilustracja \d+$/gm) ?? []).length, files.length, `${slug}: liczba obrazów`);
  }
  assert.deepEqual(manifest.encje['terry-sanders-jr'], ['characters/Terry Sanders Jr..png']);
  for (const slug of ['srw-oe-ep1-start-alexa', 'zolnierz-federacji',
    'rx-78nt-1-gundam-alex', ...pojecia, ...serie]) {
    assert.equal(manifest.encje[slug], undefined, `${slug}: manifest`);
    assert.doesNotMatch(bySlug.get(slug).body, /^## Ilustracje$/m, `${slug}: galeria`);
    assert.doesNotMatch(bySlug.get(slug).body, /r2\.dev/, `${slug}: obraz`);
  }
});

test('dziennik zmian dokumentuje piątą misję i jej ilustracje', () => {
  const changelog = fs.readFileSync('content/co-nowego.md', 'utf8');
  const current = changelog.split('## 2026-10-23 18:57')[0];
  assert.match(current, /^# Co nowego\n\n## 2026-10-2[57] \d{2}:\d{2}/);
  assert.match(current, /## 2026-10-23 20:13/);
  assert.ok(current.includes('[[srw-oe-ep1-start-alexa|'));
  assert.ok(current.includes('[[mobile-suit-gundam-08th-ms-team|'));
  assert.ok(current.includes('[[mobile-suit-gundam-0080|'));
  assert.ok(current.includes('[[rx-78nt-1-gundam-alex|'));
  assert.match(current, /22 ilustracje/);
  assert.ok(current.includes('[[gundam-ez8|'));
  assert.ok(current.includes('[[christina-mackenzie|'));
  assert.ok(current.includes('[[terry-sanders-jr|'));
  // Brak ilustracji Alexa nie jest zapowiedzią: jednostka nie staje do walki w tej misji.
  assert.doesNotMatch(changelog, /nadal nie ma galerii|nie ma jeszcze ilustracji|wkrótce|w przyszłości/);
  assert.equal(manifest.encje['rx-78nt-1-gundam-alex'], undefined);
  assert.match(manifest.uwaga, /Alex nie ma wpisu w manifeście, bo w misji 1-5 nie staje do walki/);
});

test('obsada misji 1-5 ma tło z pierwowzorów w blokach zrodlo (ADR 0008, ADR 0013)', () => {
  const wiki08 = 'https://en.wikipedia.org/wiki/Mobile_Suit_Gundam:_The_08th_MS_Team';
  const mahq = 'https://www.mahq.net/gundam0080ep1/';
  const cyklop = 'https://gundam.fandom.com/wiki/Cyclops_Team';
  const chris = 'https://gundam.fandom.com/wiki/Christina_Mackenzie';
  const zrodlaPostaci = {
    'shiro-amada': [wiki08],
    'karen-joshua': [wiki08],
    'terry-sanders-jr': [wiki08],
    'michel-ninorich': [wiki08],
    'eledore-massis': [wiki08],
    'christina-mackenzie': [chris],
    'hardy-steiner': [cyklop, mahq],
    'mikhail-kaminsky': [cyklop, mahq],
    'gabriel-ramirez-garcia': [cyklop, mahq],
    'andy-strauss': [cyklop, mahq],
  };
  for (const [slug, adresy] of Object.entries(zrodlaPostaci)) {
    const page = bySlug.get(slug);
    const blok = page.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
    assert.ok(blok, `${slug}: blok tła z pierwowzoru`);
    assert.match(blok[1], /pierwowzorze/, `${slug}: tło oddzielone od wydarzeń gry`);
    assert.match(blok[1], /sprawdzono 2026-10-2\d\)/, `${slug}: data sprawdzenia źródła`);
    for (const adres of adresy) {
      assert.ok(page.zrodla.includes(adres), `${slug}: ${adres} w frontmatterze`);
      assert.ok(blok[1].includes(adres), `${slug}: ${adres} przy informacji`);
    }
    assert.ok(page.body.indexOf('{{skrypt') < page.body.indexOf('{{zrodlo'),
      `${slug}: wydarzenia misji przed tłem z pierwowzoru`);
  }
  // Tło nie może wyprzedzać fabuły ani mieszać się z opisem rozgrywki (ADR 0012, ADR 0018).
  assert.match(bySlug.get('terry-sanders-jr').body, /trzeciej wspólnej misji/);
  assert.match(bySlug.get('karen-joshua').body, /wdową po lekarzu\s*\n?\s*wojskowym/);
  assert.match(bySlug.get('christina-mackenzie').body, /shoe-fitter/);
  assert.match(bySlug.get('andy-strauss').body, /ginie w kokpicie/);
  assert.match(bySlug.get('eledore-massis').body, /za sterami wozu wsparcia/);
  assert.match(bySlug.get('michel-ninorich').body, /nawigację i obsługuje działko/);
});

test('jednostki misji 1-5 mają tło techniczne z pierwowzorów (ADR 0008, ADR 0013)', () => {
  const ez8 = 'https://www.mahq.net/rx-79gez-8/';
  const rx79 = 'https://www.mahq.net/rx-79g/';
  const hover = 'https://gundam.fandom.com/wiki/Hover_Truck';
  const kampfer = 'https://www.mahq.net/ms-18e/';
  const fz = 'https://www.mahq.net/ms-06fz/';
  const zrodlaMechow = {
    'gundam-ez8': [ez8],
    'gundam-ground-type': [rx79, ez8],
    'gundam-ground-type-glowa-gm': [rx79],
    'hover-truck': [hover],
    'kampfer-bazooka': [kampfer],
    'kampfer-high-mobility': [kampfer],
    'zaku-ii-kai': [fz],
  };
  for (const [slug, adresy] of Object.entries(zrodlaMechow)) {
    const page = bySlug.get(slug);
    const blok = page.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
    assert.ok(blok, `${slug}: blok tła z pierwowzoru`);
    assert.match(blok[1], /pierwowzorze/, `${slug}: tło oddzielone od danych gry`);
    assert.match(blok[1], /sprawdzono 2026-10-24\)/, `${slug}: data sprawdzenia źródła`);
    for (const adres of adresy) {
      assert.ok(page.zrodla.includes(adres), `${slug}: ${adres} w frontmatterze`);
      assert.ok(blok[1].includes(adres), `${slug}: ${adres} przy informacji`);
    }
    assert.ok(page.body.indexOf('{{menu') < page.body.indexOf('{{zrodlo'),
      `${slug}: dane z gry przed tłem z pierwowzoru`);
  }
  // Alex ma własny blok tła od misji 1-5, więc wszystkie osiem jednostek jest opisanych.
  assert.match(bySlug.get('rx-78nt-1-gundam-alex').body, /\{\{zrodlo gra=wspolne/);
  assert.match(bySlug.get('gundam-ez8').body, /extra zero-eight/);
  assert.match(bySlug.get('gundam-ground-type-glowa-gm').body, /głową RGM-79\[G\] GM Ground Type/);
  assert.match(bySlug.get('gundam-ground-type-glowa-gm').body, /przydomek „GM Head”/);
  assert.match(bySlug.get('hover-truck').body, /M353A4 Bloodhound/);
  assert.match(bySlug.get('zaku-ii-kai').body, /MS-06FZ/);
  assert.match(bySlug.get('kampfer-high-mobility').body, /159 ton/);
});
