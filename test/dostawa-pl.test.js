import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony, wczytajSkrypty } from '../tools/content-loader.mjs';
import { wytnijBlokSkryptu } from '../src/srw/registry.js';
import { renderMarkdown } from '../src/srw/markdown.js';
const pages = wczytajStrony();
const bySlug = new Map(pages.map(p => [p.slug, p]));
const delivery = fs.readFileSync('dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md', 'utf8');

test('polska dostawa zastępuje stary skrypt i menu, bez zmiany historycznych slugów', () => {
  assert.equal(fs.existsSync('dostawy/srw-oe/exart-piloci-i-uzbrojenie.md'), false);
  const script = wczytajSkrypty().get('episodes/srw-oe/ep000.md');
  assert.match(script, /Minęły dekady, odkąd Federacja Ziemska/);
  assert.match(script, /Prześlij dane do działu analiz/);
  assert.doesNotMatch(script, /Connect Station|Welcome back|I'm/);
  // Epizod 0 ma dziś dwie sceny: scena 0-1 obejmuje początek skryptu, a scena 0-2 resztę.
  const scena01 = wytnijBlokSkryptu(bySlug.get('prolog-i-trening-w-connect').body);
  assert.ok(script.trim().startsWith(scena01), 'scena 0-1 jest dosłownym początkiem skryptu');
  assert.ok(!scena01.includes('## Interludium'), 'scena 0-1 kończy się przed interludium');
  for (const slug of ['srw-oe-ep0', 'prolog-i-trening-w-connect', 'exart', 'seishiro', 'himari-yaegaki', 'earth-federation']) assert.ok(bySlug.has(slug));
  assert.equal(bySlug.get('earth-federation').tytul, 'Federacja Ziemska');
});

test('dziesięć jednostek z nowej dostawy zachowuje wszystkie ataki i ich dane w parze mech–gra', () => {
  const machines = [
    ['exart', 5], ['cybuster', 7], ['cybird', 3], ['brocken', 1], ['white-base', 4],
    ['rx-78-2-gundam', 4], ['zaku-ii-karabin-maszynowy', 2], ['zaku-ii-bazooka', 2], ['zaku-ii-char', 4],
    ['real-pg-gundam', 4],
  ];
  for (const [slug, count] of machines) {
    const mech = bySlug.get(slug);
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(stats.dostawa, 'dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md');
    const rows = mech.body.split('\n').filter(line => /^\| \d+ \|/.test(line));
    assert.equal(rows.length, count, slug);
    for (const row of rows) {
      const cells = row.split('|').slice(1,-1).map(c => c.trim());
      assert.equal(cells.length, 9, `${slug}: kolumny tabeli`);
      for (const cell of cells) assert.ok(stats.dane.includes(cell), `${slug}: dane w w_gre: ${cell}`);
      assert.ok(delivery.includes(cells[1]), `${slug}: broń z dostawy`);
    }
    const html = renderMarkdown(mech.body).html;
    assert.equal((html.match(/<table>/g) ?? []).length, 1, slug);
    assert.equal((html.match(/<tr>/g) ?? []).length, count+1, slug);
    assert.doesNotMatch(mech.body, /&lt;br&gt;|base Lv|Learn-level|Prevail/);
  }
});

test('Real PG Gundam jest częścią nowej dostawy i zachowuje ilustracje', () => {
  const mech = bySlug.get('real-pg-gundam');
  const stats = JSON.parse(mech.w_gre['srw-oe']);
  assert.equal(stats.dostawa, 'dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md');
  assert.equal(stats.profil, 'Real PG Gundam (Gundam (Keroro))');
  assert.equal(mech.seria, 'sgt-frog');
  assert.match(delivery, /### Real PG Gundam \(Gundam \(Keroro\)\)/);
  const rows = mech.body.split('\n').filter(line => /^\| \d+ \|/.test(line));
  assert.equal(rows.length, 4);
  assert.deepEqual(mech.piloci, []);
  assert.equal((mech.body.match(/!\[/g) ?? []).length, 2, 'ilustracje pozostają');
});

test('nowa dostawa: White Base i Gundam mają pełne parametry załogi i uzbrojenia', () => {
  const machines = [['white-base', 4], ['rx-78-2-gundam', 4]];
  for (const [slug, count] of machines) {
    const mech = bySlug.get(slug);
    assert.equal(mech.typ, 'mech');
    assert.equal(mech.seria, 'mobile-suit-gundam-1979');
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(stats.dostawa, 'dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md');
    const rows = mech.body.split('\n').filter(line => /^\| \d+ \|/.test(line));
    assert.equal(rows.length, count, slug);
    for (const row of rows) {
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      assert.equal(cells.length, 9, `${slug}: kolumny tabeli`);
      for (const cell of cells) assert.ok(stats.dane.includes(cell), `${slug}: dane w w_gre: ${cell}`);
    }
    assert.doesNotMatch(mech.body, /&lt;br&gt;/, slug);
    assert.match(mech.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria`);
  }
  assert.deepEqual(bySlug.get('white-base').piloci, ['bright-noa', 'mirai-yashima']);
  assert.doesNotMatch(bySlug.get('white-base').body, /Domyślny pilot|Przypisany profil|Podpilot:/);
  assert.doesNotMatch(JSON.parse(bySlug.get('white-base').w_gre['srw-oe']).dane, /Zauf\.|Domyślny pilot|Przypisany profil/);
  assert.match(bySlug.get('mirai-yashima').body, /\*\*Zauf\.\*\*/);
  assert.deepEqual(bySlug.get('rx-78-2-gundam').piloci, ['amuro-ray']);
  assert.deepEqual(bySlug.get('bright-noa').mechy, ['white-base']);
  assert.deepEqual(bySlug.get('mirai-yashima').mechy, ['white-base']);
});

test('Precyzja Seishira jest na jego stronie, a nie w parametrach Exarta', () => {
  assert.match(bySlug.get('seishiro').body, /\| 2 \| \*\*Precyzja\*\* \| 3 \| Kryt\/Kryt Obraż\.\+15% \|/);
  assert.doesNotMatch(bySlug.get('exart').body, /Precyzja|Domyślny pilot|Przypisany profil/);
  assert.doesNotMatch(JSON.parse(bySlug.get('exart').w_gre['srw-oe']).dane, /Precyzja|Domyślny pilot|Przypisany profil/);
});

test('parametry mechów nie powtarzają domyślnej załogi — piloci zostają w danych ogólnych', () => {
  const obsada = {
    exart: ['seishiro', 'himari-yaegaki'],
    brocken: ['control-ai'],
    'rx-78-2-gundam': ['amuro-ray'],
    'white-base': ['bright-noa', 'mirai-yashima'],
    'zaku-ii-karabin-maszynowy': ['slender', 'zolnierz-zeonu'],
    'zaku-ii-bazooka': ['crown', 'zolnierz-zeonu'],
    'zaku-ii-char': ['char-aznable'],
    cybuster: ['masaki-andoh'],
    cybird: ['masaki-andoh'],
    'real-pg-gundam': [],
  };
  for (const [slug, piloci] of Object.entries(obsada)) {
    const mech = bySlug.get(slug);
    assert.deepEqual(mech.piloci, piloci, `${slug}: piloci w danych ogólnych`);
    assert.doesNotMatch(mech.body, /Domyślny pilot|Przypisany profil|Miejsce \d/, `${slug}: bez sekcji załogi w treści`);
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.doesNotMatch(stats.dane, /Domyślny pilot|Przypisany profil|Miejsce \d/, `${slug}: bez sekcji załogi w danych`);
  }
});

test('profile pilotów z nowej dostawy: statystyki, komendy Ducha i umiejętności', () => {
  const statystyki = {
    seishiro: [50, 120, 59, 137, 75],
    'control-ai': [10, 102, 66, 122, 61],
    'masaki-andoh': [60, 140, 55, 128, 72],
    'amuro-ray': [60, 114, 70, 137, 74],
    'bright-noa': [50, 110, 87, 126, 63],
    'char-aznable': [50, 112, 77, 136, 80],
    slender: [50, 106, 71, 124, 63],
    crown: [50, 112, 67, 126, 59],
    'sayla-mass': [50, 106, 63, 134, 86],
  };
  for (const [slug, [sp, atk, obr, cel, unik]] of Object.entries(statystyki)) {
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Parametry/, `${slug}: parametry`);
    const wartosci = [['SP', sp], ['Atak', atk], ['Obrona', obr], ['Celność', cel], ['Unik', unik]];
    for (const [nazwa, wartosc] of wartosci) {
      assert.match(body, new RegExp(`\\| ${nazwa} \\| ${wartosc} \\|`), `${slug}: ${nazwa}`);
    }
  }
  // Mirai jest podpilotem: ma pulę SP i komendę, ale nie statystyki bojowe.
  const mirai = bySlug.get('mirai-yashima').body;
  assert.match(mirai, /\*\*Pula SP:\*\* 50/);
  assert.match(mirai, /\*\*Zauf\.\*\* \| 1 \| 20 \|/);
  assert.doesNotMatch(mirai, /\| Atak \|/);
  // Char nie ma komend Ducha, a Seishiro ma komendę Skupienie.
  assert.doesNotMatch(bySlug.get('char-aznable').body, /Komendy Ducha/);
  assert.match(bySlug.get('seishiro').body, /\*\*Skupienie\*\* \| 1 \| 15 \|/);
  // Surowe etykiety misji nie trafiają na strony.
  for (const page of pages) {
    assert.doesNotMatch(page.body, /DL100|Entry ID|eventP00/, `${page.slug}: bez etykiet misji`);
  }
});

test('trzy Zaku II: odrębne strony z danymi dostawy, galeriami i obsadą misji', () => {
  const warianty = [
    ['zaku-ii-karabin-maszynowy', 2, ['Karabin maszynowy Zaku', 'Heat Hawk'], ['slender', 'zolnierz-zeonu']],
    ['zaku-ii-bazooka', 2, ['Bazooka Zaku', 'Heat Hawk'], ['crown', 'zolnierz-zeonu']],
    ['zaku-ii-char', 4, ['Karabin maszynowy Zaku', 'Bazooka Zaku', 'Heat Hawk', 'Szarża barkiem'], ['char-aznable']],
  ];
  for (const [slug, count, bronie, piloci] of warianty) {
    const mech = bySlug.get(slug);
    assert.equal(mech.typ, 'mech', slug);
    assert.equal(mech.seria, 'mobile-suit-gundam-1979', slug);
    assert.deepEqual(mech.piloci, piloci, `${slug}: piloci`);
    assert.equal(mech.pochodzenie, 'menu', `${slug}: dane z dostawy`);
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(stats.dostawa, 'dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md');
    assert.match(stats.profil, /^Zaku II/);
    const rows = mech.body.split('\n').filter(line => /^\| \d+ \|/.test(line));
    assert.equal(rows.length, count, slug);
    for (const row of rows) {
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      assert.equal(cells.length, 9, `${slug}: kolumny tabeli`);
      for (const cell of cells) assert.ok(stats.dane.includes(cell), `${slug}: dane w w_gre: ${cell}`);
    }
    assert.deepEqual(rows.map(r => r.split('|')[2].trim()), bronie, `${slug}: uzbrojenie`);
    assert.doesNotMatch(mech.body, /&lt;br&gt;/, slug);
    assert.equal((mech.body.match(/!\[/g) ?? []).length, 2, `${slug}: dwie ilustracje`);
    assert.match(mech.body, /\{\{menu gra=srw-oe\n\n## Parametry/, `${slug}: parametry`);
    assert.match(mech.body, /\{\{zrodlo gra=wspolne/, `${slug}: rodowód zewnętrzny`);
    assert.match(mech.body, /## Pozostałe jednostki Zaku II/, `${slug}: sekcja z pozostałymi jednostkami`);
  }
  // Żołnierz Zeonu wraca do bazy z dostawą misji 2 (ADR 0025, adnotacja 2026-10-22).
  assert.ok(bySlug.has('zolnierz-zeonu'), 'Żołnierz Zeonu ma własną stronę');
  assert.deepEqual(bySlug.get('zolnierz-zeonu').mechy,
    ['dom-zolnierz-zeonu', 'dopp', 'zaku-ii-bazooka', 'zaku-ii-karabin-maszynowy']);
  assert.deepEqual(bySlug.get('turret').piloci, [], 'Turret nie jest pilotowanym mechem');
  for (const slug of ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka']) {
    assert.ok(bySlug.get(slug).piloci.includes('zolnierz-zeonu'), `${slug}: domyślna załoga`);
  }
  assert.deepEqual(bySlug.get('char-aznable').mechy, ['zaku-ii-char']);
  const scena = bySlug.get('srw-oe-ep0-na-ratunek-white-base');
  for (const slug of ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka', 'zaku-ii-char']) {
    assert.ok(scena.mechy.includes(slug), `scena 0-2: ${slug} w obsadzie`);
    assert.ok(bySlug.get('srw-oe-ep0').mechy.includes(slug), `epizod 0: ${slug} w obsadzie`);
  }
  // Obsada misji rozstrzyga, kto siedzi w której maszynie (ADR 0024).
  assert.deepEqual(bySlug.get('slender').mechy, ['zaku-ii-karabin-maszynowy']);
  assert.deepEqual(bySlug.get('crown').mechy, ['zaku-ii-bazooka']);
  assert.match(bySlug.get('slender').body, /leci \[\[zaku-ii-karabin-maszynowy\|Zaku II z karabinem maszynowym\]\]/);
  assert.match(bySlug.get('crown').body, /leci \[\[zaku-ii-bazooka\|Zaku II z bazooką\]\]/);
  assert.match(bySlug.get('zaku-ii-karabin-maszynowy').body, /prowadzi \[\[slender\|Slender\]\]/);
  assert.match(bySlug.get('zaku-ii-bazooka').body, /prowadzi \[\[crown\|Crown\]\]/);
  // Dane misji nie trafiają na strony jako surowe etykiety dostawy.
  for (const slug of ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka', 'zaku-ii-char', 'slender', 'crown']) {
    assert.doesNotMatch(bySlug.get(slug).body, /DL100|Entry character|mission Entry|eventP00/, `${slug}: bez surowych danych misji`);
  }
  // Strona generyczna „Zaku II” nie istnieje (ADR 0029): każda wersja linkuje dwie pozostałe.
  assert.equal(bySlug.has('zaku-ii'), false, 'brak strony generycznej Zaku II');
  const wersje = ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka', 'zaku-ii-char'];
  for (const slug of wersje) {
    for (const cel of wersje.filter((x) => x !== slug)) {
      assert.match(bySlug.get(slug).body, new RegExp('\\[\\[' + cel + '\\|'), `${slug}: odsyłacz do ${cel}`);
    }
  }
});

test('profile załogi i transformacje są powiązane, ale nie udają sceny fabularnej', () => {
  assert.deepEqual(bySlug.get('exart').piloci, ['seishiro', 'himari-yaegaki']);
  assert.deepEqual(bySlug.get('masaki-andoh').mechy, ['cybuster', 'cybird']);
  assert.deepEqual(bySlug.get('control-ai').mechy, ['brocken']);
  assert.equal(bySlug.get('control-ai').seria, undefined, 'Control AI nie ma wpisu w słowniku postaci');
  assert.deepEqual(bySlug.get('real-pg-gundam').piloci, []);
  assert.match(bySlug.get('cybuster').body, /\[\[cybird\|Cybird\]\]/);
  assert.match(bySlug.get('cybird').body, /\[\[cybuster\|Cybuster\]\]/);
  // Obsada szkolenia podstawowego (DL100_01): Exart kontra trzy Brockeny Control AI.
  assert.deepEqual(bySlug.get('prolog-i-trening-w-connect').postacie, ['seishiro', 'himari-yaegaki', 'control-ai']);
  assert.deepEqual(bySlug.get('prolog-i-trening-w-connect').mechy, ['exart', 'brocken']);
  assert.ok(bySlug.get('srw-oe-ep0').postacie.includes('control-ai'), 'epizod 0: Control AI w obsadzie');
  assert.deepEqual(bySlug.get('srw-oe-ep0').mechy, ['exart', 'brocken', 'rx-78-2-gundam', 'zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka', 'zaku-ii-char', 'white-base']);
  assert.match(bySlug.get('brocken').body, /szkoleniu podstawowym/);
  assert.match(bySlug.get('control-ai').body, /trzy Brockeny/);
  for (const slug of ['brocken', 'control-ai', 'prolog-i-trening-w-connect', 'srw-oe-ep0']) {
    assert.doesNotMatch(bySlug.get(slug).body, /DL100|Entry ID|eventP00/, `${slug}: bez surowych danych misji`);
  }
  assert.doesNotMatch(bySlug.get('himari-yaegaki').body, /Profil załogi|Miejsce 2|brak macierzystego przypisania/);
  assert.ok(bySlug.has('invaderzy'));
  assert.ok(!bySlug.has('keroro'), 'nazwa wariantu nie przypisuje domyślnego pilota');
});

test('aktualny materiał nie ujawnia poprzednich spoilerów i nie twierdzi, że Himari wysłała dane', () => {
  const connect = bySlug.get('connect-force').body;
  assert.doesNotMatch(connect, /Vasage|Mucus|Warp Gate|rozumie jej myśli/);
  assert.doesNotMatch(bySlug.get('himari-yaegaki').body, /wsiada do Exert razem|wysyła dane do zespołu/);
});

test('opisy encji mówią o świecie, nie o rekordach gry (ADR 0018)', () => {
  const zakazane = /\bw grze\b|\bprofilu?\b|\bobsad[a-ząćęłńóśźż]*\b|\broster\b|\bwłasną stroną\b|standardow/i;
  const typy = ['postac', 'mech', 'pojecie', 'seria'];
  // Sekcja „Opis” kończy się dopiero na kolejnym nagłówku `##` albo na zamknięciu bloku poziomu.
  // Wcześniejszy wzorzec kończył dopasowanie na pierwszej pustej linii, więc badał pusty tekst
  // i przepuszczał naruszenia poza pierwszym akapitem (audyt PR #12).
  let zbadane = 0;
  for (const page of pages.filter(p => typy.includes(p.typ))) {
    const opis = page.body.match(/^## Opis\n([\s\S]*?)(?=^## |^\}\})/m);
    if (!opis) continue;
    const tekst = opis[1].trim();
    if (!tekst) continue;
    zbadane += 1;
    assert.ok(tekst.includes('\n\n') || tekst.length > 80, `${page.slug}: sekcja Opis wczytana w całości`);
    assert.doesNotMatch(tekst, zakazane, `${page.slug}: opis zbliża się do technicznego języka gry`);
  }
  assert.ok(zbadane >= 130, `test ma badać pełne opisy wszystkich encji, a sprawdził ${zbadane}`);
  assert.ok(bySlug.has('zolnierz-zeonu'));
  for (const slug of ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka', 'zaku-ii-char']) {
    for (const pilot of bySlug.get(slug).piloci) {
      assert.ok(bySlug.has(pilot), `${slug}: odsyłacz do pilota ${pilot}`);
    }
  }
});

test('ilustracje właściciela: 101 plików przy 77 encjach, w tym postacie bez dostawy tekstowej', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  assert.equal(manifest.weryfikacjaZdalna, false, 'nie deklarujemy obejrzenia ilustracji');
  assert.equal(Object.keys(manifest.encje).length, 77);
  assert.equal(Object.values(manifest.encje).flat().length, 101);
  // Pole „uwaga” ma opisywać bieżący stan, a nie liczby sprzed kolejnych dostaw.
  const wszystkie = Object.values(manifest.encje).flat();
  const portrety = wszystkie.filter((f) => f.startsWith('characters/')).length;
  const jednostki = wszystkie.filter((f) => !f.includes('/')).length;
  assert.match(manifest.uwaga, new RegExp(`${portrety} portret[a-ząćęłńóśźż]* w characters/`), 'liczba portretów w uwadze');
  assert.match(manifest.uwaga, new RegExp(`${jednostki} plik[a-ząćęłńóśźż]* jednostek`), 'liczba plików jednostek w uwadze');
  // Dostawa ilustracji jednostek misji 2 (2026-10-22): sześć maszyn, dziewięć plików.
  assert.deepEqual(manifest.encje.dom, ['Dom.png', 'Dom 2.png']);
  assert.deepEqual(manifest.encje.dopp, ['Dopp.png']);
  assert.deepEqual(manifest.encje['g-fighter'], ['G-Fighter.png']);
  assert.deepEqual(manifest.encje.guncannon, ['Guncannon.png', 'Guncannon 2.png']);
  assert.deepEqual(manifest.encje.guntank, ['Guntank.png', 'Guntank 2.png']);
  assert.deepEqual(manifest.encje.turret, ['Turret.png']);
  // Druga dostawa zwykłego Doma (2026-10-22): dwa pliki dla odrębnego profilu z misji 3.
  assert.deepEqual(manifest.encje['dom-zolnierz-zeonu'], ['Dom Generic.png', 'Dom Generic 2.png']);
  // Portrety obsady misji 2 (2026-10-22): sześć postaci, sześć plików w characters/.
  assert.deepEqual(manifest.encje.gaia, ['characters/Gaia.png']);
  assert.deepEqual(manifest.encje['hayato-kobayashi'], ['characters/Hayato Kobayashi.png']);
  assert.deepEqual(manifest.encje['kai-shiden'], ['characters/Kai Shiden.png']);
  assert.deepEqual(manifest.encje.mquve, ["characters/M'Quve.png"]);
  assert.deepEqual(manifest.encje.mash, ['characters/Mash.png']);
  assert.deepEqual(manifest.encje.ortega, ['characters/Ortega.png']);
  // Portret generała Revila z dostawy uzupełniającej (2026-10-22).
  assert.deepEqual(manifest.encje['general-revil'], ['characters/Revil.png']);
  // Dostawa ilustracji misji 4 (2026-10-23): dwa obrazy Raijin-Oha i siedem portretów obsady.
  assert.deepEqual(manifest.encje['raijin-oh'], ['Raijin-Oh.png', 'Raijin-Oh 2.png']);
  for (const [slug, plik] of Object.entries({
    'jin-hyuga': 'Jin Hyuga', 'asuka-tsukishiro': 'Asuka Tsukishiro', 'koji-hoshiyama': 'Koji Hoshiyama',
    'maria-shiratori': 'Maria Shiratori', 'tsutomu-kojima': 'Tsutomu Kojima',
    'kirara-haruno': 'Kirara Haruno', 'yoko-kuriki': 'Yoko Kuriki',
  })) {
    assert.deepEqual(manifest.encje[slug], [`characters/${plik}.png`], slug);
  }
  // Ilustracje misji 1-5 (2026-10-24): siedem jednostek i dziesięć postaci, 23 pliki.
  const misja5 = {
    'gundam-ez8': ['Gundam Ez8.png', 'Gundam Ez8 1.png'],
    'gundam-ground-type': ['Ground Gundam.png', 'Ground Gundam 2.png'],
    'gundam-ground-type-glowa-gm': ['Grd Gundam GM.png', 'Grd Gundam GM 2.png'],
    'hover-truck': ['Hover Track.png'],
    'kampfer-bazooka': ['Kampfer.png', 'Kampfer 2.png'],
    'kampfer-high-mobility': ['Kampfer Sturm Faust.png', 'Kampfer Sturm Faust 2.png'],
    'zaku-ii-kai': ['Zaku II Kai.png', 'Zaku II Kai 2.png'],
    'christina-mackenzie': ['characters/Christina Mackenzie.png'],
    'shiro-amada': ['characters/Shiro Amada.png'],
    'terry-sanders-jr': ['characters/Terry Sanders Jr..png'],
    'karen-joshua': ['characters/Karen Joshua.png'],
    'michel-ninorich': ['characters/Michel Ninorich.png'],
    'eledore-massis': ['characters/Eledore Massis.png'],
    'hardy-steiner': ['characters/Hardy Steiner.png'],
    'mikhail-kaminsky': ['characters/Mikhail Kaminsky.png'],
    'gabriel-ramirez-garcia': ['characters/Gabriel Ramirez Garcia.png'],
    'andy-strauss': ['characters/Andy Strauss.png'],
  };
  for (const [slug, files] of Object.entries(misja5)) {
    assert.deepEqual(manifest.encje[slug], files, slug);
  }
  assert.deepEqual(manifest.nieprzypisane, []);
  const adres = file => `${manifest.baseUrl}/${file.split('/').map(encodeURIComponent).join('/')}`;
  for (const [slug, files] of Object.entries(manifest.encje)) {
    const body = bySlug.get(slug).body;
    const { html, problemy } = renderMarkdown(body, { wymagajPoziomu: true });
    assert.deepEqual(problemy, []);
    assert.equal((html.match(/<img /g) ?? []).length, files.length, slug);
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria z zakresem gry (ADR 0020)`);
    for (const file of files) {
      assert.ok(html.includes(`src="${adres(file)}"`), `${slug}: podgląd ${file}`);
    }
    // Powiększenie obsługuje podgląd pełnoekranowy; osobny odnośnik pod obrazem jest zbędny.
    assert.doesNotMatch(html, /<a [^>]*href="[^"]*r2\.dev/, `${slug}: brak odnośnika „Otwórz plik”`);
    assert.doesNotMatch(body, /\[Otwórz plik /, `${slug}: brak odnośnika w treści`);
    assert.doesNotMatch(body, /data:image/);
    assert.doesNotMatch(html, /src="[^"]* /);
    assert.match(html, /loading="lazy"/);
    if (bySlug.get(slug).typ === 'postac') {
      assert.ok(files.every(file => file.startsWith('characters/')), `${slug}: zdjęcie bohatera w characters/`);
    }
  }
  const stare = JSON.stringify(manifest.encje);
  for (const file of ['Seishiro.jpg', 'Himari.png', 'Masaki.png', 'Kuro.png', 'Shiro.png']) {
    assert.ok(!stare.includes(`"${file}"`), `stary plik ${file} nie jest już przypisany`);
  }
});


test('ilustracja jest dostawą: Kuro i Shiro mają opisy, źródła i powiązania bez dopisywania fabuły', () => {
  for (const slug of ['kuro', 'shiro']) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac');
    assert.deepEqual(page.gry, ['srw-oe']);
    assert.deepEqual(page.mechy, ['cybuster']);
    assert.equal(page.seria, 'super-robot-wars-original');
    assert.equal(page.pochodzenie, 'zrodlo');
    assert.match(page.body, /## Opis/);
    assert.match(page.body, /\{\{zrodlo/);
    assert.match(page.body, /sprawdzono 2026-10-19/);
    assert.match(page.body, /\[\[masaki-andoh\|/);
    assert.match(page.body, /\[\[cybuster\|/);
    assert.match(page.body, /\{\{wiedza/);
    for (const url of page.zrodla) assert.ok(page.body.includes(url));
    const memory = page.body.match(/\{\{wiedza[^\n]*\n([\s\S]*?)\n\}\}/)[1];
    assert.doesNotMatch(memory, /https?:|\]\(/);
    for (const scene of ['srw-oe-ep0','prolog-i-trening-w-connect']) {
      assert.ok(!bySlug.get(scene).postacie.includes(slug));
    }
    assert.ok(!bySlug.get('cybuster').piloci.includes(slug), 'źródło nie zmienia załogi z menu');
    assert.match(bySlug.get('masaki-andoh').body, new RegExp('\\[\\['+slug+'\\|'));
  }
});


test('obsada Exarta i granica fabuły: Himari jako podpilot, bez przyszłych ról', () => {
  assert.deepEqual(bySlug.get('exart').piloci, ['seishiro', 'himari-yaegaki']);
  for (const page of pages) {
    assert.doesNotMatch(page.body, /(?:Miejsce|miejsce) 2[^\n]*Himari|Himari[^\n]*drugie miejsce|dwa miejsca załogi|kiedy Himari zajmie/);
  }
  const stats = JSON.parse(bySlug.get('exart').w_gre['srw-oe']);
  assert.doesNotMatch(stats.dane, /Miejsce 2|Przypisany profil: Himari|brak macierzystego przypisania/);
  assert.doesNotMatch(fs.readFileSync('content/co-nowego.md','utf8'), /dwa miejsca załogi|drugie miejsce Exarta/);
  // Nowa dostawa nie zawiera już przyszłej roli Himari; surowe etykiety zostają w archiwum.
  assert.doesNotMatch(delivery, /Miejsce 2: Himari Yaegaki/);
  assert.match(delivery, /DL100_01/);
  assert.match(bySlug.get('himari-yaegaki').body, /zdalnie steruje/);
});

test('maszyny wsparcia White Base mają rodowód z pierwowzoru (ADR 0008)', () => {
  const rodowody = {
    guncannon: 'https://www.mahq.net/rx-77-2/',
    guntank: 'https://www.mahq.net/rx-75-4/',
  };
  for (const [slug, adres] of Object.entries(rodowody)) {
    const page = bySlug.get(slug);
    const blok = page.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
    assert.ok(blok, `${slug}: blok tła z pierwowzoru`);
    assert.match(blok[1], /pierwowzorze/, `${slug}: tło oddzielone od wydarzeń gry`);
    assert.match(blok[1], /system Core Block/, `${slug}: wspólny rodowód maszyn Operacji V`);
    assert.match(blok[1], /sprawdzono 2026-10-24\)/, `${slug}: data sprawdzenia źródła`);
    assert.ok(page.zrodla.includes(adres), `${slug}: adres w frontmatterze`);
    assert.ok(blok[1].includes(adres), `${slug}: adres przy informacji`);
  }
});
