import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony, wczytajSkrypty } from '../tools/content-loader.mjs';
import { wytnijBlokSkryptu, normalizujTekst } from '../src/srw/registry.js';
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
  assert.ok(normalizujTekst(script).startsWith(normalizujTekst(scena01)),
    'scena 0-1 jest dosłownym początkiem skryptu (po normalizacji białych znaków)');
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
    // Dostawa 3-4 podstawia pod te maszyny zbiorczego Pilota MS, więc lista rośnie.
    'zaku-ii-karabin-maszynowy': ['slender', 'acous', 'zolnierz-zeonu', 'pilot-ms'],
    'zaku-ii-bazooka': ['crown', 'zolnierz-zeonu', 'pilot-ms'],
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
    ['zaku-ii-karabin-maszynowy', 2, ['Karabin maszynowy Zaku', 'Heat Hawk'], ['slender', 'acous', 'zolnierz-zeonu', 'pilot-ms']],
    ['zaku-ii-bazooka', 2, ['Bazooka Zaku', 'Heat Hawk'], ['crown', 'zolnierz-zeonu', 'pilot-ms']],
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
  // Lista maszyn pilota zbiorowego rośnie z każdą dostawą; komplet pilnuje
  // test/seria-z-dostawy.test.js, tutaj liczą się maszyny z pierwszych misji.
  for (const mech of ['dom', 'dopp', 'zaku-ii-bazooka', 'zaku-ii-karabin-maszynowy']) {
    assert.ok(bySlug.get('zolnierz-zeonu').mechy.includes(mech), `Żołnierz Zeonu: ${mech}`);
  }
  assert.deepEqual(bySlug.get('turret').piloci, [], 'Turret nie jest pilotowanym mechem');
  for (const slug of ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka']) {
    assert.ok(bySlug.get(slug).piloci.includes('zolnierz-zeonu'), `${slug}: domyślna załoga`);
  }
  // Dostawa 2-7 dołożyła Charowi drugą maszynę (Gelgoog), więc lista rośnie o nią.
  assert.deepEqual(bySlug.get('char-aznable').mechy, ['zaku-ii-char', 'gelgoog-char']);
  const scena = bySlug.get('srw-oe-ep0-na-ratunek-white-base');
  for (const slug of ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka', 'zaku-ii-char']) {
    assert.ok(scena.mechy.includes(slug), `scena 0-2: ${slug} w obsadzie`);
    assert.ok(bySlug.get('srw-oe-ep0').mechy.includes(slug), `epizod 0: ${slug} w obsadzie`);
  }
  // Obsada misji rozstrzyga, kto siedzi w której maszynie (ADR 0024).
  // W misji 2-7 ta sama dwójka przesiada się do Rick Domów, więc listy mają po dwie pozycje.
  assert.deepEqual(bySlug.get('slender').mechy, ['zaku-ii-karabin-maszynowy', 'rick-dom']);
  assert.deepEqual(bySlug.get('crown').mechy, ['zaku-ii-bazooka', 'rick-dom']);
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
  // Komplet maszyn Control AI pilnuje test/seria-z-dostawy.test.js (dostawa 2-8 dołożyła Brocken/Cannon).
  for (const mech of ['brocken', 'helldiver', 'brocken-dzialko-automatyczne']) {
    assert.ok(bySlug.get('control-ai').mechy.includes(mech), `Control AI: ${mech}`);
  }
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
  // Nazwę gatunku Mucus Seishiro ujawnia dopiero w dostawa_2_1.txt (scena 2-1);
  // dalsze wątki (Vasage, Warp Gate, telepatia) nadal pozostają poza rozegranym materiałem.
  const connect = bySlug.get('connect-force').body;
  assert.doesNotMatch(connect, /Vasage|Warp Gate|rozumie jej myśli/);
  assert.doesNotMatch(bySlug.get('himari-yaegaki').body, /wsiada do Exert razem|wysyła dane do zespołu/);
});

test('opisy encji mówią o świecie, nie o rekordach gry (ADR 0018, 0020)', () => {
  // Zdanie, którego podmiotem jest gra („Gra przenosi go pod Jaburo”, „Do gry należą…”)
  // opisuje zawartość tytułu, nie świat — niezależnie od tego, czy stoi w boksie
  // opisowym, czy w {{zrodlo}}. Porównanie z pierwowzorem jest dozwolone, ale nie
  // kosztem opowiadania o rekordzie (decyzja właściciela, 2026-11-17).
  const zakazaneGra = /\bdo gry\b|\btej gr(?:y|ze)\b|\bopis gry\b|\bprofil gry\b|\bscenariusz gry\b|\bgra\s+(?:przenosi|odtwarza|układa|powtarza|używa|zapisuje|nazywa|podaje|czyni|zamienia|dodaje|traktuje|pokazuje|wprowadza|łączy|wybiera|każe|pozwala|zostawia|rezygnuje|pomija|przedstawia|rozstrzyga|obsadza|przypisuje|zmienia|zachowuje|daje|zatrzymuje)\b/i;
  const zakazane = /\bw grze\b|\bprofilu?\b|\bobsad[a-ząćęłńóśźż]*\b|\broster\b|\bwłasną stron|standardow/i;
  // Meta-komentarze o samej bazie są zabronione w każdej warstwie treści — także w boksach
  // {{zrodlo}} i {{wiedza}}, gdzie wcześniej umykały. Wpis opisuje świat gry, nie strony,
  // boksy ani pliki (decyzja właściciela, 2026-11-14).
  const zakazaneMeta = /\bbaz(?:a|y|ie|ę|ą)\s+(?:prowadzi|trzyma|gromadzi|zbiera)\b|\bw bazie\s+(?:reprezent\w*|obejmuj\w*|prowadzi|mamy|znajdziesz)|\b(?:osobn|własn)[a-ząćęłńóśźż]*\s+stron[a-ząćęłńóśźż]*|\bna tej stronie\b|\bmanife[sx]t\w*|\bboks[a-ząćęłńóśźż]*\b|\brekord[a-ząćęłńóśźż]*\s+(?:źródłow|gry|dostaw)|\bw\s+dostaw(?:ie|ach|y|ę)\b|wariant\s+danych\s+\d+/i;
  const typy = ['postac', 'mech', 'pojecie', 'seria'];
  // Boks opisowy to po ADR 0035 fragment bez tytułu (po plakietce gry). Badamy wszystkie
  // takie fragmenty strony — dawniej wzorzec wycinał tylko sekcję „## Opis”.
  let zbadane = 0;
  for (const page of pages.filter(p => typy.includes(p.typ))) {
    assert.doesNotMatch(String(page.tytul ?? ''), /wariant\s+danych/i,
      `${page.slug}: techniczny dopisek „wariant danych” z pliku dostawy w tytule strony (ADR 0018)`);
    // Boks opisowy gry to blok {{skrypt}}/{{menu}} — treść do pierwszego
    // nagłówka `##` (nagłówki wewnątrz makra to np. „Parametry”). Bloki
    // {{zrodlo}}/{{wiedza}} to opis neutralny ze źródeł i nie podlegają ADR 0018.
    const opisy = [...page.body.matchAll(/^\{\{(skrypt|menu)[^\n]*\n\n([\s\S]*?)^\}\}/gm)]
      .map((m) => m[2].split(/\n(?=## )/)[0])
      .filter((t) => !t.trimStart().startsWith('## '))
      .map((t) => t.trim())
      .filter(Boolean);
    const tekst = opisy.join('\n\n');
    const calaTresc = [...page.body.matchAll(/^\{\{(skrypt|menu|zrodlo|wiedza)[^\n]*\n\n([\s\S]*?)^\}\}/gm)]
      .map((m) => m[2])
      .join('\n\n');
    assert.doesNotMatch(calaTresc, zakazaneMeta, `${page.slug}: meta-komentarz o bazie w treści (ADR 0018)`);
    assert.doesNotMatch(calaTresc, zakazaneGra,
      `${page.slug}: zdanie opowiada o zawartości gry zamiast o świecie (ADR 0018)`);
    if (!tekst) continue;
    zbadane += 1;
    assert.ok(tekst.length > 40, `${page.slug}: sekcja Opis wczytana w całości`);
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

test('ilustracje właściciela: 313 plików przy 247 encjach, w tym postacie i mechy bez dostawy tekstowej', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  assert.equal(manifest.weryfikacjaZdalna, false, 'nie deklarujemy obejrzenia ilustracji');
  // Bieżący stan manifestu jest przypięty tylko tutaj. Testy poszczególnych dostaw sprawdzają
  // własne klucze i to, że manifest nie jest starszy od nich — kolejna dostawa zmienia ten jeden test.
  assert.equal(Object.keys(manifest.encje).length, 247);
  assert.equal(Object.values(manifest.encje).flat().length, 313);
  assert.equal(manifest.dostarczono, '2026-11-23', 'data ostatniej dostawy ilustracji');
  // Pole „uwaga” ma opisywać bieżący stan, a nie liczby sprzed kolejnych dostaw.
  const wszystkie = Object.values(manifest.encje).flat();
  assert.equal(new Set(wszystkie).size, wszystkie.length, 'plik należy do jednej encji');
  const portrety = wszystkie.filter((f) => f.startsWith('characters/')).length;
  const jednostki = wszystkie.filter((f) => !f.includes('/')).length;
  assert.equal(portrety + jednostki, wszystkie.length, 'plik leży w characters/ albo w korzeniu');
  assert.match(manifest.uwaga, new RegExp(`^Stan manifestu: ${portrety} portret[a-ząćęłńóśźż]* w characters/ i ${jednostki} plik[a-ząćęłńóśźż]* jednostek w korzeniu, razem ${wszystkie.length} obraz[a-ząćęłńóśźż]* przy ${Object.keys(manifest.encje).length} encjach\\.`),
    'uwaga zaczyna się od bieżących liczb');
  // Dostawa ilustracji jednostek misji 2 (2026-10-22): sześć maszyn, dziewięć plików.
  assert.deepEqual(manifest.encje.dom, ['Dom.png', 'Dom 2.png', 'Dom Generic.png', 'Dom Generic 2.png']);
  assert.deepEqual(manifest.encje.dopp, ['Dopp.png']);
  assert.deepEqual(manifest.encje['g-fighter'], ['G-Fighter.png']);
  assert.deepEqual(manifest.encje.guncannon, ['Guncannon.png', 'Guncannon 2.png']);
  assert.deepEqual(manifest.encje.guntank, ['Guntank.png', 'Guntank 2.png']);
  assert.deepEqual(manifest.encje.turret, ['Turret.png']);
  // Druga dostawa zwykłego Doma (2026-10-22): dwa pliki dla odrębnego profilu z misji 3.
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
  // Dostawa ilustracji misji 3-1 (2026-11-14): pięć plików jednostek i cztery portrety.
  assert.deepEqual(manifest.encje['gundam-exia'], ['Gundam Exia.png', 'Gundam Exia 2.png']);
  assert.deepEqual(manifest.encje['wing-gundam-zero'], ['Wing Zero.png', 'Wing Zero 2.png', 'Wing Gundam Zero.png']);
  assert.deepEqual(manifest.encje['wing-gundam-zero-nb'], ['Wing Zero NB.png']);
  for (const [slug, plik] of Object.entries({
    'garma-zabi': 'Garma Zabi', 'heero-yuy': 'Heero Yuy',
    'setsuna-f-seiei': 'Setsuna F. Seisei', uragan: 'Uragan',
  })) {
    assert.deepEqual(manifest.encje[slug], [`characters/${plik}.png`], slug);
  }
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
  // Dostawa ilustracji z 2026-10-25: sześć portretów Patlabora, dwa pliki God Raijin-Oha
  // oraz portret Bakuryu-Oha — w OE jest on sub-pilotem, więc ma własną stronę postaci (ADR 0017).
  const dostawa1025 = {
    'badrinath-harchand': ['characters/Badrinath Harchand.png'],
    'kurosaki': ['characters/Kurosaki.png'],
    'seitaro-sakaki': ['characters/Seitaro Sakaki.png'],
    'shigeo-shiba': ['characters/Shigeo Shiba.png'],
    'shinobu-nagumo': ['characters/Shinobu Nagumo.png'],
    'utsumi': ['characters/Utsumi.png'],
    'god-raijin-oh': ['God Raijin-Oh.png', 'God Raijin-Oh 2.png'],
    'bakuryu-oh': ['characters/Bakuryu-Oh.png'],
  };
  for (const [slug, files] of Object.entries(dostawa1025)) {
    assert.deepEqual(manifest.encje[slug], files, slug);
  }
  // Dostawa ilustracji jednostek epizodu 2 (2026-10-29): 26 plików czternastu jednostek
  // sceny „Groźba pod ziemią” — nazwy plików od właściciela, potwierdzone odczytem listy R2.
  const dostawa1029 = {
    'bolt-robo-standard': ['Bolt Robo Standard.png', 'Bolt Robo Standard 1.png'],
    'bolt-robo-melee': ['Bolt Robo Melee.png', 'Bolt Robo Melee 2.png'],
    'bolt-robo-long-range': ['Bolt Robo Long-Range.png', 'Bolt Robo Long-Range 2.png'],
    'go-saurer': ['Go-Saurer.png', 'Go-Saurer 2.png'],
    'king-go-saurer': ['King Go-Saurer.png', 'King Go-Saurer 2.png'],
    'shin-getter-1': ['Shin-Getter 1.png', 'Shin-Getter 1 2.png'],
    'shin-getter-2': ['Shin-Getter 2.png', 'Shin-Getter 2 2.png'],
    'shin-getter-3': ['Shin-Getter 3.png', 'Shin-Getter 3 2.png'],
    'mazinger-z': ['Mazinger Z.png', 'Mazinger Z 2.png'],
    'gurren-lagann': ['Gurren Lagann.png', 'Gurren Lagann 2.png'],
    'invader-ground': ['Invader Ground.png', 'Invader Ground 2.png'],
    'nekton-assault': ['Nekton Assault.png', 'Nekton Assault 2.png'],
    'mucus-gate-s-in': ['Mucus Gate S IN.png'],
    'mucus-gate-s-mc': ['Mucus Gate S MC.png'],
  };
  for (const [slug, files] of Object.entries(dostawa1029)) {
    assert.deepEqual(manifest.encje[slug], files, slug);
    const body = bySlug.get(slug).body;
    assert.equal((body.match(/^### Ilustracja \d+$/gm) ?? []).length, files.length,
      `${slug}: liczba podsekcji galerii`);
  }
  // Dostawa portretów postaci epizodu 2 (2026-10-29): 16 plików w characters/,
  // w tym Goro Ishida — nowa strona utworzona z ilustracji (ADR 0017).
  const portrety1029 = {
    'boota': ['characters/Boota.png'],
    'erika-kozu': ['characters/Erika Kozu.png'],
    'gai': ['characters/Gai.png'],
    'go': ['characters/Go.png'],
    'goro-ishida': ['characters/Goro Ishida.png'],
    'hiromi-tachibana': ['characters/Hiromi Tachibana.png'],
    'kamina': ['characters/Kamina.png'],
    'kei': ['characters/Kei.png'],
    'kenichi-minezaki': ['characters/Kenichi Minezaki.png'],
    'koji-kabuto': ['characters/Koji Kabuto.png'],
    'shinobu-asaoka': ['characters/Shinobu Asaoka.png'],
    'simon': ['characters/Simon.png'],
    'takako-kojima': ['characters/Takako Kojima.png'],
    'taro-shirogane': ['characters/Taro Shirogane.png'],
    'yoji-hiyama': ['characters/Yoji Hiyama.png'],
    'yoko': ['characters/Yoko.png'],
  };
  for (const [slug, files] of Object.entries(portrety1029)) {
    assert.deepEqual(manifest.encje[slug], files, slug);
    assert.ok(files[0].startsWith('characters/'), `${slug}: portret w characters/`);
    const body = bySlug.get(slug).body;
    assert.equal((body.match(/^### Ilustracja \d+$/gm) ?? []).length, 1, `${slug}: jeden portret`);
  }
  // Goro Ishida nie występuje w skrypcie gry — strona encji nie należy do scen ani załóg.
  const goro = bySlug.get('goro-ishida');
  assert.equal(goro.pochodzenie, 'zrodlo', 'opis z kwerendy (ADR 0017)');
  assert.deepEqual(goro.mechy ?? [], [], 'brak przypisania do załóg na podstawie ilustracji');
  assert.deepEqual(manifest.nieprzypisane, []);
  const adres = file => `${manifest.baseUrl}/${file.split('/').map(encodeURIComponent).join('/')}`;
  for (const [slug, files] of Object.entries(manifest.encje)) {
    const body = bySlug.get(slug).body;
    const { html, problemy } = renderMarkdown(body, { wymagajPoziomu: true });
    assert.deepEqual(problemy, []);
    assert.equal((html.match(/<img /g) ?? []).length, files.length, slug);
    // Galeria nosi etykietę gry, z której pochodzą pliki. Kolejność pola `gry` jest
    // przypadkowa i nie wyznacza etykiety, więc sprawdzamy przynależność etykiety do
    // listy gier strony, a nie jej miejsce na liście (ADR 0020, adnotacja 2026-11-14).
    const gryStrony = bySlug.get(slug).gry ?? [];
    const etykietyGalerii = [...body.matchAll(/\{\{(?:menu|skrypt) gra=([a-z0-9-]+)\n\n## Ilustracje/g)]
      .map((m) => m[1]);
    assert.ok(etykietyGalerii.length > 0, `${slug}: galeria z zakresem gry (ADR 0020)`);
    for (const etykieta of etykietyGalerii) {
      assert.ok(gryStrony.includes(etykieta),
        `${slug}: etykieta galerii „${etykieta}” spoza pola gry [${gryStrony.join(', ')}]`);
    }
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
  for (const slug of ['kuro', 'shiro-kot']) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac');
    assert.deepEqual(page.gry, ['srw-oe']);
    assert.deepEqual(page.mechy, ['cybuster']);
    assert.equal(page.seria, 'super-robot-wars-original');
    assert.equal(page.pochodzenie, 'zrodlo');
    assert.match(page.body, /\{\{[^\n]+\n\n(?!## )/, 'boks opisowy bez tytułu');
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


test('ilustracje 2-2 i 2-3: osiem dokładnych kluczy R2 przy czterech właściwych jednostkach', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const dostawa = {
    'brocken-dzialko-automatyczne': ['Brocken Działko.png', 'Brocken Działko 2.png'],
    'final-dancouga': ['Final Dancouga.png', 'Final Dancouga 2.png'],
    'griffon': ['Griffon.png', 'Griffon 2.png'],
    'nekton-creek': ['Nekton Creek.png', 'Nekton Creek 2.png'],
  };
  for (const [slug, files] of Object.entries(dostawa)) {
    assert.deepEqual(manifest.encje[slug], files);
    const body = bySlug.get(slug).body;
    assert.equal((body.match(/^## Ilustracje$/gm) ?? []).length, 1);
    assert.equal((body.match(/^### Ilustracja \d+$/gm) ?? []).length, 2);
    assert.ok(body.indexOf('## Ilustracje') < body.indexOf('## Parametry'));
    for (const file of files) assert.ok(body.includes(`${manifest.baseUrl}/${encodeURIComponent(file)}`));
  }
  assert.deepEqual(manifest.encje.brocken, ['Brocken.png', 'Brocken 2.png']);
  assert.equal(manifest.weryfikacjaZdalna, false);
  assert.ok(manifest.dostarczono >= '2026-11-02', 'manifest nie jest starszy od tej dostawy');
});


test('pięć portretów Cyber Beast Force ma dokładne klucze characters/ i własne galerie OE', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const crew = {
    'alan-igor': 'Alan Igor', 'masato-shikibu': 'Masato Shikibu',
    'ryo-shiba': 'Ryo Shiba', 'sara-yuki': 'Sara Yuki', 'shinobu-fujiwara': 'Shinobu Fujiwara',
  };
  for (const [slug, name] of Object.entries(crew)) {
    const file = `characters/${name}.png`;
    assert.deepEqual(manifest.encje[slug], [file]);
    const page = bySlug.get(slug);
    assert.equal(page.seria, 'super-beast-machine-god-dancouga');
    assert.deepEqual(page.mechy, ['final-dancouga']);
    assert.equal((page.body.match(/^## Ilustracje$/gm) ?? []).length, 1);
    assert.equal((page.body.match(/!\[/g) ?? []).length, 1);
    assert.ok(page.body.includes(`${manifest.baseUrl}/characters/${encodeURIComponent(name)}.png`));
    assert.match(page.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/);
    assert.ok(page.body.indexOf('## Ilustracje') < page.body.indexOf('## Parametry'));
  }
  assert.equal(manifest.weryfikacjaZdalna, false);
});


test('dostawa ilustracji SRW Y (2026-11-09): osiem jednostek i szesnaście portretów', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const jednostki = {
    'a-advent': ['A. Advent.png'],
    'amx-003-gaza-c': ['AMX-003 Gaza C.png'],
    'altron-gundam': ['Altron Gundam.png'],
    'lancelot-albion-zero': ['Lancelot Albion Zero.png'],
    'lumenus': ['Lumenus.png', 'Lumenus Yellow Version.png'],
    'taurus': ['Taurus.png'],
    'lunedrache': ['X-Lunedrache.png'],
    'zamza-zah': ['Zamza-Zah.png'],
  };
  for (const [slug, files] of Object.entries(jednostki)) {
    assert.deepEqual(manifest.encje[slug], files, slug);
    const body = bySlug.get(slug).body;
    assert.equal((body.match(/^## Ilustracje$/gm) ?? []).length, 1, `${slug}: galeria`);
    assert.equal((body.match(/^### Ilustracja \d+$/gm) ?? []).length, files.length, `${slug}: liczba podsekcji`);
    assert.ok(body.indexOf('## Ilustracje') < body.indexOf('## Parametry'), `${slug}: kolejność`);
    assert.match(body, /\{\{menu gra=srw-y\n\n## Ilustracje/, `${slug}: zakres gry`);
  }
  // X-Lunedrache to nazwa obecnej maszyny przywódcy Haze — plik należy do Lunedrache.
  assert.match(bySlug.get('lunedrache').body, /X \(Cross\)-Lunedrache/);
  const portrety = {
    'takuma-nagare': 'Takuma Nagare',
    'cross-tsukinowa': 'Tsukinowa Cross', 'wren': 'Wren', 'yomogi-asanaka': 'Yomogi',
    'zero': 'Zero', 'annina-servania': 'Annina Servania', 'aytie': 'Aytie',
    'baku-yamagishi': 'Baku Yamagishi', 'chang-wufei': 'Chang Wufei', 'cookie': 'Cookie',
    'echika-y-franburnett': 'Echika Y. Franburnett', 'forte-tsukinowa': 'Forte Tsukinowa',
    'gauma': 'Gauma',
  };
  for (const [slug, name] of Object.entries(portrety)) {
    assert.deepEqual(manifest.encje[slug], [`characters/${name}.png`], slug);
    const body = bySlug.get(slug).body;
    assert.equal((body.match(/^## Ilustracje$/gm) ?? []).length, 1, `${slug}: galeria`);
    assert.match(body, /\{\{menu gra=srw-y\n\n## Ilustracje/, `${slug}: zakres gry`);
    assert.ok(body.includes(`${manifest.baseUrl}/characters/${encodeURIComponent(name)}.png`),
      `${slug}: adres portretu`);
  }
  assert.ok(manifest.dostarczono >= '2026-11-09', 'manifest nie jest starszy od tej dostawy');
  assert.equal(manifest.weryfikacjaZdalna, false);
  assert.deepEqual(manifest.nieprzypisane, []);
});


test('manifest ilustracji i adresy R2 na stronach są wzajemnie kompletne', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const prefiks = `${manifest.baseUrl}/`;
  const kluczeWManifescie = new Map();
  for (const [slug, files] of Object.entries(manifest.encje)) {
    const strona = bySlug.get(slug);
    assert.ok(strona, `${slug}: encja z manifestu ma stronę`);
    for (const file of files) {
      kluczeWManifescie.set(file, slug);
      const encoded = file.split('/').map(encodeURIComponent).join('/');
      assert.ok(strona.body.includes(`${prefiks}${encoded}`),
        `${slug}: strona zawiera dokładny adres ${encoded}`);
    }
  }
  const wzorzec = new RegExp(`${prefiks.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}((?:\\([^)]*\\)|[^\\s)])+)`, 'g');
  const brakWManifescie = [];
  for (const strona of pages) {
    for (const m of strona.body.matchAll(wzorzec)) {
      const klucz = m[1].split('/').map(decodeURIComponent).join('/');
      const wlasciciel = kluczeWManifescie.get(klucz);
      if (!wlasciciel) brakWManifescie.push(`${strona.slug}: ${klucz}`);
      else assert.equal(wlasciciel, strona.slug, `${klucz}: przypisany do ${wlasciciel}, użyty na ${strona.slug}`);
    }
  }
  assert.deepEqual(brakWManifescie, [], 'każdy obraz R2 użyty w treści jest zapisany w media/ilustracje.json');
});


test('dostawa ilustracji misji 3-2 SRW OE (2026-11-15): dwie jednostki i dwa portrety w manifeście', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  assert.deepEqual(manifest.encje['invader-air'], ['Invader - latający.png']);
  assert.deepEqual(manifest.encje['metal-beast-muszla'], ['Metal Beast.png', 'Metal Beast 2.png']);
  assert.deepEqual(manifest.encje['gihren-zabi'], ['characters/Gihren Zabi.png']);
  assert.deepEqual(manifest.encje['kycilia-zabi'], ['characters/Kycilia Zabi.png']);
  assert.ok(manifest.dostarczono >= '2026-11-15', 'manifest nie jest starszy od tej dostawy');
});


test('dostawa ilustracji SRW OE 3-4 (2026-11-18): dwa pliki seryjnego Gelgooga', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  // Klucze zachowują pisownię właściciela („Geloog”), tytuł strony — nazwę z dostawy tekstowej.
  assert.deepEqual(manifest.encje.gelgoog, ['Geloog Standard.png', 'Geloog Standard 2.png']);
  assert.ok(manifest.dostarczono >= '2026-11-18', 'manifest nie jest starszy od tej dostawy');
  const strona = bySlug.get('gelgoog');
  assert.equal(strona?.typ, 'mech', 'gelgoog: strona mecha');
  // Seryjny Gelgoog z misji 3-4 to inna maszyna niż dowódczy Gelgoog Chara — własna galeria.
  assert.equal((strona.body.match(/^## Ilustracje$/gm) ?? []).length, 1, 'gelgoog: galeria');
  assert.equal((strona.body.match(/^### Ilustracja \d+$/gm) ?? []).length, 2, 'gelgoog: dwie podsekcje');
  assert.match(strona.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, 'gelgoog: zakres gry');
  for (const plik of ['Geloog Standard.png', 'Geloog Standard 2.png']) {
    assert.ok(strona.body.includes(`${manifest.baseUrl}/${encodeURIComponent(plik)}`), `gelgoog: adres ${plik}`);
  }
  const iIlustracje = strona.body.indexOf('## Ilustracje');
  assert.ok(iIlustracje < strona.body.indexOf('## Parametry'), 'gelgoog: Ilustracje przed Parametrami');
  assert.deepEqual(bySlug.get('gelgoog-char').piloci, ['char-aznable'], 'dowódcza odmiana zostaje przy Charze');
  assert.deepEqual(strona.piloci, ['pilot-ms'], 'seryjna odmiana ma bezimiennych pilotów');
});


test('dostawa ilustracji SRW Y 1-2A (2026-11-17): pięć jednostek (w tym Getter Kirik i Getter Khan) i dziewięć portretów', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const jednostki = {
    'getter-arc': 'Getter Arc.png',
    'getter-khan': 'Getter Khan.png',
    'getter-kirik': 'Getter Kirik.png',
    insector: 'Insector.png',
    'zordo-xx': 'Zordo XX.png',
  };
  for (const [slug, file] of Object.entries(jednostki)) {
    assert.deepEqual(manifest.encje[slug], [file], slug);
    const strona = bySlug.get(slug);
    assert.equal(strona?.typ, 'mech', `${slug}: strona mecha`);
    assert.equal(strona.seria, 'getter-robo-arc', `${slug}: seria`);
    assert.deepEqual(strona.gry, ['srw-y'], `${slug}: gra`);
    assert.equal((strona.body.match(/^## Ilustracje$/gm) ?? []).length, 1, `${slug}: galeria`);
    assert.equal((strona.body.match(/^### Ilustracja \d+$/gm) ?? []).length, 1, `${slug}: jedna podsekcja`);
    assert.match(strona.body, /\{\{menu gra=srw-y\n\n## Ilustracje/, `${slug}: zakres gry`);
    assert.ok(strona.body.includes(`${manifest.baseUrl}/${encodeURIComponent(file)}`), `${slug}: adres`);
    const iParam = strona.body.indexOf('## Parametry');
    if (iParam !== -1) {
      assert.ok(strona.body.indexOf('## Ilustracje') < iParam, `${slug}: Ilustracje przed Parametrami`);
    }
  }
  // Getter Kirik i Getter Khan mają własne strony z załogą, tłem i parametrami z dodatku 1-2A,
  // ale nie wchodzą do obsady fabularnej sceny 1-2A (ADR 0023 pkt 4).
  assert.deepEqual(bySlug.get('getter-kirik').piloci, ['show-kamui', 'takuma-nagare', 'baku-yamagishi']);
  assert.deepEqual(bySlug.get('getter-khan').piloci, ['baku-yamagishi', 'takuma-nagare', 'show-kamui']);
  for (const slug of ['getter-kirik', 'getter-khan']) {
    assert.ok(bySlug.get(slug).body.indexOf('## Ilustracje') < bySlug.get(slug).body.indexOf('## Parametry'),
      `${slug}: Ilustracje przed Parametrami`);
    assert.ok(bySlug.get('srw-y-ep1').mechy.includes(slug), `${slug}: pojawia się w późniejszej misji 1-3A`);
    assert.ok(!bySlug.get('srw-y-ep1-misja-2a-przebudzenie-niebianskiego-demona').mechy.includes(slug),
      `${slug}: poza obsadą sceny 1-2A`);
    assert.match(bySlug.get(slug).body, /\{\{zrodlo gra=wspolne[\s\S]*?sprawdzono 2026-11-17/, `${slug}: tło ze źródeł`);
  }

  const portrety = {
    'chise-asukagawa': 'Chise Asukagawa',
    'hayato-jin': 'Hayato Jin',
    igari: 'Igari',
    'koyomi-yamanaka': 'Koyomi Yamanaka',
    'matka-yomogiego': 'matka Yomogiego',
    mei: 'Mei',
    shikishima: 'Shikishima',
    'show-kamui': 'Show Kamui',
    'yume-minami': 'Yuma Minami',
  };
  for (const [slug, name] of Object.entries(portrety)) {
    assert.deepEqual(manifest.encje[slug], [`characters/${name}.png`], slug);
    const strona = bySlug.get(slug);
    assert.equal((strona.body.match(/^## Ilustracje$/gm) ?? []).length, 1, `${slug}: galeria`);
    assert.equal((strona.body.match(/^### Ilustracja \d+$/gm) ?? []).length, 1, `${slug}: jedna podsekcja`);
    assert.match(strona.body, /\{\{menu gra=srw-y\n\n## Ilustracje/, `${slug}: zakres gry`);
    assert.ok(strona.body.includes(`${manifest.baseUrl}/characters/${encodeURIComponent(name)}.png`),
      `${slug}: dokładny adres portretu z zachowaniem pisowni i wielkości liter`);
    const iParam = strona.body.indexOf('## Parametry');
    if (iParam !== -1) {
      assert.ok(strona.body.indexOf('## Ilustracje') < iParam, `${slug}: Ilustracje przed Parametrami`);
    }
  }
  // Tytuły stron zachowują pisownię z gry, nawet gdy klucz R2 różni się literą lub wielkością znaku.
  assert.equal(bySlug.get('yume-minami').tytul, 'Yume Minami');
  assert.equal(bySlug.get('matka-yomogiego').tytul, 'Matka Yomogiego');
  assert.ok(manifest.dostarczono >= '2026-11-17', 'manifest nie jest starszy od tej dostawy');
  assert.equal(manifest.weryfikacjaZdalna, false);
});

test('SRW Y 1-3A: ilustracje Dynazenona i Shalbandesa należą do jednostek', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  for (const [slug, plik] of [['dynazenon', 'Combine Dragon Dynazenon.png'], ['shalbandes', 'Hard Fall Kaiju Shalbandes.png']]) {
    assert.deepEqual(manifest.encje[slug], [plik]);
    const strona = bySlug.get(slug);
    assert.equal(strona.typ, 'mech');
    const galeria = strona.body.match(/\{\{menu gra=srw-y\n\n## Ilustracje\n([\s\S]*?)\n\}\}/);
    assert.ok(galeria?.[1].includes(`${manifest.baseUrl}/${encodeURIComponent(plik)}`), slug);
  }
});

test('dostawa ilustracji misji 3-5 SRW OE (2026-11-20): 20 plików jednostek i 10 portretów postaci', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const jednostki = {
    braver: ['Braver.png', 'Braver 2.png'],
    daljan: ['Daljan.png', 'Daljan 2.png'],
    'enh-layzner': ['Enhanced Layzner.png', 'Enhanced Layzner 2.png'],
    'macross-quarter': ['Macross Quarter Fortress Mode.png'],
    'macross-quarter-attack-mode': ['Macross Quarter Atack Mode.png'],
    'rvf-25-messiah': ['RVF-25 (F).png', 'RVF-25 (F) 2.png'],
    'rvf-25-messiah-battroid': ['RVF-25 (B).png', 'RVF-25 (B) 2.png'],
    'vf-25f-messiah': ['VF-25F (F).png', 'VF-25F (F) 2.png'],
    'vf-25f-messiah-battroid': ['VF-25F (B).png', 'VF-25F (B) 2.png'],
    'vf-25g-messiah': ['VF-25G (F).png', 'VF-25G (F) 2.png'],
    'vf-25g-messiah-battroid': ['VF-25G (B).png', 'VF-25G (B) 2.png'],
  };
  for (const [slug, files] of Object.entries(jednostki)) {
    assert.deepEqual(manifest.encje[slug], files, slug);
    const strona = bySlug.get(slug);
    assert.equal(strona?.typ, 'mech', slug);
    assert.equal((strona.body.match(/^## Ilustracje$/gm) ?? []).length, 1, `${slug}: nagłówek ilustracji`);
    assert.equal((strona.body.match(/^### Ilustracja \d+$/gm) ?? []).length, files.length, `${slug}: podsekcje`);
    assert.match(strona.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: zakres gry`);
    for (const plik of files) {
      const encoded = plik.split('/').map(encodeURIComponent).join('/');
      assert.ok(strona.body.includes(`${manifest.baseUrl}/${encoded}`), `${slug}: adres ${encoded}`);
    }
    const iIlustracje = strona.body.indexOf('## Ilustracje');
    assert.ok(iIlustracje < strona.body.indexOf('## Parametry'), `${slug}: Ilustracje przed Parametrami`);
  }

  const postacie = {
    'albatro-null-eiji-asuka': 'Albatro Null Eiji Asuka',
    'alto-saotome': 'Alto Saotome',
    'bobby-margot': 'Bobby Margot',
    'catherine-glass': 'Cathering Glass',
    gosterro: 'Gosterro',
    'jeffrey-wilder': 'Jeffrey Wilder',
    'luca-angeloni': 'Luca Angeloni',
    'michael-blanc': 'Michael Blanc',
    'monica-lang': 'Monica Lang',
    rei: 'Rei',
  };
  for (const [slug, nazwaPliku] of Object.entries(postacie)) {
    const plik = `characters/${nazwaPliku}.png`;
    assert.deepEqual(manifest.encje[slug], [plik], slug);
    const strona = bySlug.get(slug);
    assert.equal(strona?.typ, 'postac', slug);
    assert.equal((strona.body.match(/^## Ilustracje$/gm) ?? []).length, 1, `${slug}: nagłówek ilustracji`);
    assert.match(strona.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: zakres gry`);
    const encoded = plik.split('/').map(encodeURIComponent).join('/');
    assert.ok(strona.body.includes(`${manifest.baseUrl}/${encoded}`), `${slug}: adres ${encoded}`);
  }
  // Catherine Glass zachowuje literówkę właściciela w kluczu R2
  assert.equal(bySlug.get('catherine-glass').tytul, 'Catherine Glass');
  assert.equal(manifest.encje['catherine-glass'][0], 'characters/Cathering Glass.png');
  // Monica Lang i Rei to nowe postacie z ADR 0017; Monica weszła potem do skryptu misji 4-2
  assert.equal(bySlug.get('monica-lang').pochodzenie, 'skrypt');
  assert.equal(bySlug.get('rei').pochodzenie, 'zrodlo');
  assert.ok(manifest.dostarczono >= '2026-11-19');
  assert.equal(manifest.weryfikacjaZdalna, false);
});
