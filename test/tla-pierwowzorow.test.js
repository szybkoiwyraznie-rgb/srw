/**
 * Tła z pierwowzorów dla stron, które dotąd miały tylko materiał z gry.
 *
 * Reguły: tło siedzi w osobnym bloku `{{zrodlo gra=wspolne}}` za wydarzeniami
 * z gry (ADR 0008, ADR 0013), każdy adres z bloku jest w `zrodla` (ADR 0018),
 * a treść nie wyprzedza fabuły — losy postaci i maszyn zostają poza bazą
 * do czasu, aż pokaże je rozgrywka (ADR 0012).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));

// Zdania o śmierci, przegranej i dalszych losach to materiał na późniejsze misje.
const spoilery = /gin(ie|ą)|zgin|śmier|poleg|zabit|ocala|zostaje zniszczon/i;

function sprawdzBlok(slug, adresy) {
  const page = bySlug.get(slug);
  assert.ok(page, `${slug}: strona istnieje`);
  const blok = page.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
  assert.ok(blok, `${slug}: blok tła z pierwowzoru`);
  assert.match(blok[1], /pierwowzor/i, `${slug}: tło oddzielone od wydarzeń gry`);
  assert.match(blok[1], /sprawdzono 2026-10-2[45]\)/, `${slug}: data sprawdzenia źródła`);
  assert.doesNotMatch(blok[1], spoilery, `${slug}: tło nie wyprzedza fabuły`);
  for (const adres of adresy) {
    assert.ok(page.zrodla.includes(adres), `${slug}: ${adres} w frontmatterze`);
    assert.ok(blok[1].includes(adres), `${slug}: ${adres} przy informacji`);
  }
  assert.ok(page.body.indexOf('{{skrypt') < page.body.indexOf('{{zrodlo'),
    `${slug}: wydarzenia z gry przed tłem z pierwowzoru`);
  return blok[1];
}

test('obsada SV2 ma tło z pierwowzoru (ADR 0008, ADR 0013)', () => {
  const wiki = 'https://en.wikipedia.org/wiki/List_of_Patlabor_characters';
  for (const slug of ['asuma-shinohara', 'kiichi-goto', 'kanuka-clancy',
    'mikiyasu-shinshi', 'hiromi-yamazaki', 'shinobu-nagumo', 'shigeo-shiba']) {
    sprawdzBlok(slug, [wiki]);
  }
  assert.match(bySlug.get('asuma-shinohara').body, /synem prezesa (?:\[\[shinohara-heavy-industries\|)?Shinohara Heavy Industries/);
  assert.match(bySlug.get('kiichi-goto').body, /dzielnicy Taitō/);
  assert.match(bySlug.get('kanuka-clancy').body, /policji nowojorskiej/);
  assert.doesNotMatch(bySlug.get('kanuka-clancy').body, /nie ma sobie równych/);
  assert.match(bySlug.get('mikiyasu-shinshi').body, /jako jedyny w jednostce jest żonaty/);
  assert.match(bySlug.get('mikiyasu-shinshi').body, /łatwo daje sobą pomiatać/);
  assert.match(bySlug.get('hiromi-yamazaki').body, /pochodzi z Okinawy/);
  assert.match(bySlug.get('shinobu-nagumo').body, /dzielnicy Setagaya/);
  assert.match(bySlug.get('shigeo-shiba').body, /zastępcą szefa mechaników/);
});

test('Labory misji 1-1 mają tło techniczne z pierwowzoru (ADR 0008, ADR 0013)', () => {
  const ingram = 'https://www.mahq.net/av-98-tv/';
  const ingramWiki = 'https://patlabor.fandom.com/wiki/AV-98_Ingram';
  const helldiver = 'https://www.mahq.net/arl-99-tv/';
  const helldiverWiki = 'https://patlabor.fandom.com/wiki/ARL-99_Helldiver';
  const hal = 'https://www.mahq.net/hal-x-10-tv/';
  const halWiki = 'https://patlabor.fandom.com/wiki/HAL_X-10';
  const halWikiEs = 'https://patlabormechanime.fandom.com/es/wiki/HAL_X-10';
  sprawdzBlok('ingram-nr-1', [ingram, ingramWiki]);
  sprawdzBlok('ingram-nr-2', [ingram, ingramWiki]);
  sprawdzBlok('helldiver', [helldiver, helldiverWiki]);
  sprawdzBlok('hal-x10', [hal, halWikiEs]);
  sprawdzBlok('hal-x10-green', [hal, halWiki]);
  // Każda strona wnosi inne fakty, a nie powtórzenie tej samej notki.
  assert.match(bySlug.get('ingram-nr-1').body, /palec po palcu/);
  assert.match(bySlug.get('ingram-nr-2').body, /źródło części zapasowych/);
  assert.doesNotMatch(bySlug.get('ingram-nr-2').body, /pancerz reaktywny|av-98-ova/);
  assert.match(bySlug.get('helldiver').body, /worek spadochronowy/);
  assert.match(bySlug.get('hal-x10').body, /czterech nogach z wbudowanymi kołami/);
  assert.match(bySlug.get('hal-x10-green').body, /zamalowują jej\s*\n?\s*oznaczenia farbą/);
  // Dwie odmiany HAL-X10 opisują dwa różne pierwowzory (ADR 0013).
  assert.match(bySlug.get('hal-x10').body, /W kinowym/);
  assert.match(bySlug.get('hal-x10-green').body, /W serialowym/);
});

test('załoga White Base i piloci Zeonu mają tło z pierwowzoru (ADR 0008, ADR 0013)', () => {
  const wiki = 'https://en.wikipedia.org/wiki/List_of_Mobile_Suit_Gundam_characters';
  const triStars = 'https://gundam.fandom.com/wiki/Black_Tri-Stars';
  sprawdzBlok('kai-shiden', [wiki]);
  sprawdzBlok('hayato-kobayashi', [wiki]);
  sprawdzBlok('gaia', [triStars]);
  sprawdzBlok('ortega', [triStars]);
  sprawdzBlok('mash', [triStars]);
  sprawdzBlok('oscar-dublin', ['https://gundam.fandom.com/wiki/Oscar_Dublin']);
  sprawdzBlok('marker', ['https://gundam.fandom.com/wiki/Marker_Clan']);
  sprawdzBlok('slender', ['https://gundam.fandom.com/wiki/Slender']);
  sprawdzBlok('crown', ['https://gundam.fandom.com/wiki/Crown']);
  assert.match(bySlug.get('kai-shiden').body, /kolonii Green Oasis/);
  assert.doesNotMatch(bySlug.get('kai-shiden').body, /do końca wojny/);
  assert.match(bySlug.get('hayato-kobayashi').body, /dwuosobowej maszynie/);
  assert.match(bySlug.get('gaia').body, /batalionu szkolenia mobilnego/);
  assert.match(bySlug.get('ortega').body, /jedna za drugą/);
  assert.match(bySlug.get('mash').body, /Ananke/);
  assert.match(bySlug.get('oscar-dublin').body, /na prawą burtę/);
  assert.match(bySlug.get('marker').body, /na lewą burtę/);
  assert.doesNotMatch(bySlug.get('oscar-dublin').body, /kapral|White_Base_Corps/);
  assert.doesNotMatch(bySlug.get('marker').body, /kapral|White_Base_Corps/);
  assert.match(bySlug.get('slender').body, /Operację V/);
  assert.match(bySlug.get('crown').body, /przed wejściem okrętu w atmosferę/);
});

test('maszyny Zeonu mają tło techniczne z pierwowzoru (ADR 0008, ADR 0013)', () => {
  sprawdzBlok('dom-zolnierz-zeonu', ['https://www.mahq.net/ms-09/']);
  sprawdzBlok('dopp', ['https://gundam.fandom.com/wiki/Dopp']);
  assert.match(bySlug.get('dom-zolnierz-zeonu').body, /380 km\/h/);
  assert.match(bySlug.get('dopp').body, /symulacjach komputerowych/);
  // Tło maszyny nie powtarza bloku z pokrewnej strony (ADR 0013).
  const tloDoma = bySlug.get('dom-zolnierz-zeonu').body.match(/^\{\{zrodlo[\s\S]*?^\}\}$/m)[0];
  const tloTriStars = bySlug.get('dom').body.match(/^\{\{zrodlo[\s\S]*?^\}\}$/m)[0];
  assert.notEqual(tloDoma, tloTriStars);
});

test('hasła świata Patlabora mają tło z pierwowzoru (ADR 0008, ADR 0013)', () => {
  sprawdzBlok('labor', ['https://patlabor.fandom.com/wiki/Labor',
    'https://patlabor.fandom.com/wiki/Patlabor']);
  sprawdzBlok('sv2', ['https://patlabor.fandom.com/wiki/Special_Vehicles_Section_2',
    'https://en.wikipedia.org/wiki/List_of_Patlabor_characters']);
  sprawdzBlok('poligon-fuji', ['https://patlabor.fandom.com/wiki/Runaway_Labor_X-10!']);
  sprawdzBlok('sily-samoobrony-japonii', ['https://patlabor.fandom.com/wiki/ARL-99_Helldiver',
    'https://patlabor.fandom.com/wiki/HAL_X-10']);
  sprawdzBlok('shinohara-heavy-industries', [
    'https://patlabor.fandom.com/wiki/Shinohara_Heavy_Industries',
    'https://en.wikipedia.org/wiki/List_of_Patlabor_characters',
    'https://ja.wikipedia.org/wiki/%E6%A9%9F%E5%8B%95%E8%AD%A6%E5%AF%9F%E3%83%91%E3%83%88%E3%83%AC%E3%82%A4%E3%83%90%E3%83%BC_the_Movie',
  ]);
  assert.match(bySlug.get('labor').body, /patlabory/);
  assert.match(bySlug.get('labor').body, /do niego należy \[\[ingram-nr-1\|AV-98 Ingram\]\]/);
  assert.match(bySlug.get('sv2').body, /powołany w 1996 roku/);
  assert.match(bySlug.get('poligon-fuji').body, /pod Gotembą/);
  assert.match(bySlug.get('poligon-fuji').body, /\{\{zrodlo[\s\S]*\[\[hal-x10-green\|HAL-X10\]\]/);
  assert.match(bySlug.get('sily-samoobrony-japonii').body, /przed piechotą\s*\n?\s*spadochronową/);
});

test('źródłowe nawiązania do serialu Patlabor linkują wariant TV HAL-X10', () => {
  for (const slug of ['srw-oe-ep1-szalejacy-prototyp-labora', 'poligon-fuji', 'sily-samoobrony-japonii']) {
    const bloki = [...bySlug.get(slug).body.matchAll(/^\{\{zrodlo[^\n]*\n([\s\S]*?)^\}\}$/gm)]
      .map((m) => m[1]).filter((blok) => blok.includes('[[mobile-police-patlabor|'));
    assert.ok(bloki.length > 0, `${slug}: blok nawiązania do serialu`);
    for (const blok of bloki) {
      assert.match(blok, /\[\[hal-x10-green\|HAL-X10\]\]/, `${slug}: wariant TV`);
      assert.doesNotMatch(blok, /\[\[hal-x10\|HAL-X10\]\]/, `${slug}: bez wariantu kinowego`);
    }
  }
});

test('God Raijin-Oh i Real PG Gundam mają sprawdzone tło pierwowzoru (ADR 0008, ADR 0012, ADR 0013)', () => {
  sprawdzBlok('god-raijin-oh', [
    'https://en.wikipedia.org/wiki/Matchless_Raijin-Oh',
    'https://eldran.fandom.com/wiki/God_Raijin-Oh',
  ]);
  sprawdzBlok('real-pg-gundam', [
    'https://superrobotwars.fandom.com/wiki/Banpresto_Original/Units',
    'https://en.wikipedia.org/wiki/Sgt._Frog',
    'https://en.wikipedia.org/wiki/Gunpla',
  ]);
  assert.match(bySlug.get('god-raijin-oh').body, /Bakuryū-Oh/);
  assert.match(bySlug.get('god-raijin-oh').body, /41 metrów/);
  // Dostawa ilustracji z 2026-10-25 jednoznacznie wskazuje kopilota — Bakuryu-Oh
  // dostaje własną stronę postaci (ADR 0017), zamiast być tylko zdjęciem w galerii.
  const bakuryu = bySlug.get('bakuryu-oh');
  assert.ok(bakuryu, 'Bakuryu-Oh ma stronę postaci z dostawy ilustracji');
  assert.equal(bakuryu.typ, 'postac');
  assert.equal(bakuryu.rola, 'wsparcie');
  assert.equal(bakuryu.pochodzenie, 'zrodlo');
  assert.equal(bakuryu.seria, 'matchless-raijin-oh');
  assert.deepEqual(bakuryu.mechy, ['god-raijin-oh']);
  // Właściciel (2026-11-10): forma połączona ma załogę maszyny bazowej, a w God Raijin-Ohu
  // dochodzi do niej Bakuryu-Oh. Wcześniej test tego zabraniał, bo podpilota podawało
  // tylko źródło — decyzja właściciela to rozstrzyga (ADR 0037, adnotacja).
  assert.deepEqual(bySlug.get('god-raijin-oh').piloci,
    [...bySlug.get('raijin-oh').piloci, 'bakuryu-oh']);
  assert.doesNotMatch(bakuryu.body, /Super Robot Wars GC|sub-pilot|na ekranie załogi/i);
  assert.doesNotMatch(bySlug.get('devil-gundam-incident').body, /Master Asia|zgładzenia ludzkości|Kasshu|Kyoji/i);
  for (const adres of [
    'https://srw.wiki.cre.jp/wiki/%E3%83%90%E3%82%AF%E3%83%AA%E3%83%A5%E3%82%A6%E3%82%AA%E3%83%BC',
    'https://eldran.fandom.com/wiki/Bakury%C5%AB-Oh',
    'https://en.wikipedia.org/wiki/Matchless_Raijin-Oh',
  ]) {
    assert.ok(bakuryu.zrodla.includes(adres), `bakuryu-oh: ${adres} w frontmatterze`);
    assert.ok(bakuryu.body.includes(adres), `bakuryu-oh: ${adres} przy informacji`);
  }
  assert.match(bakuryu.body, /sprawdzono 2026-10-25\)/);
  assert.match(bySlug.get('real-pg-gundam').body, /Perfect Grade/);
  assert.match(bySlug.get('real-pg-gundam').body, /1:60/);
  assert.deepEqual(bySlug.get('real-pg-gundam').piloci, []);
});

test('Federacja Ziemska i zagrożenia cyklu Eldran mają sprawdzone tło bez domysłów wiedzy', () => {
  sprawdzBlok('earth-federation', [
    'https://en.wikipedia.org/wiki/Mobile_Suit_Gundam',
    'https://gundam.fandom.com/wiki/Earth_Federation',
  ]);
  sprawdzBlok('jaku-empire', [
    'https://eldran.fandom.com/wiki/Jaku_Empire',
    'https://en.wikipedia.org/wiki/Matchless_Raijin-Oh',
  ]);
  for (const slug of ['earth-federation', 'jaku-empire', 'daimakai', 'mechanization-empire',
    'invaderzy', 'muge-empire', 'evil-god-drago', 'super-robot-wars-original']) {
    assert.doesNotMatch(bySlug.get(slug).body, /\{\{wiedza/, `${slug}: bez przestarzałego bloku wiedzy`);
  }
  sprawdzBlok('luna-ii', ['https://gundam.fandom.com/wiki/Luna_II']);
  sprawdzBlok('libot', ['https://www.mahq.net/gundam0080ep1/']);
  sprawdzBlok('side-6', [
    'https://gundam.fandom.com/wiki/Mobile_Suit_Gundam_0080:_War_in_the_Pocket',
    'https://en.wikipedia.org/wiki/Mobile_Suit_Gundam_0080:_War_in_the_Pocket',
  ]);
  sprawdzBlok('side-7', [
    'https://gundam.fandom.com/wiki/RX-78-2_Gundam',
    'https://gundam.fandom.com/wiki/Gundam_Rising',
  ]);
  assert.match(bySlug.get('invaderzy').body, /Getter Robo Armageddon/);
  assert.match(bySlug.get('muge-empire').body, /Muge Zorbados/);
  assert.doesNotMatch(bySlug.get('srw-oe-ep0').body, /prawdopodobnie nawiązuje/);
  // Relacje encji są renderowane z pól frontmattera; strony serii nie
  // powtarzają już technicznej listy „Encje reprezentowane w bazie”.
  const generyczne = new Set(['zolnierz-jsdf', 'zolnierz-federacji', 'zolnierz-zeonu', 'oficer-federacji', 'oficer-zeonu']);
  for (const seria of pages.filter((p) => p.typ === 'seria')) {
    const czlonkowie = pages.filter((p) => p.seria === seria.slug && !generyczne.has(p.slug));
    for (const encja of czlonkowie) {
      assert.equal(encja.seria, seria.slug,
        `${seria.slug}: relacja encji ${encja.slug} nie pochodzi z pola seria`);
    }
  }
});

test('encje bez pierwowzoru poza bazą źródeł nie dostają zmyślonego tła (ADR 0012, ADR 0018)', () => {
  // Zbiorcze profile, sprzęt pola walki i jednostki oryginalne nie mają osobnego
  // pierwowzoru do zacytowania — pusty blok byłby zmyśleniem.
  const bezTla = ['oficer-federacji', 'oficer-zeonu', 'zolnierz-federacji', 'zolnierz-jsdf',
    'zolnierz-zeonu', 'control-ai', 'shinohara-hos', 'mechabestia', 'invader', 'mucus',
    'turret', 'h-bomb-missile', 'cybird', 'exart'];
  for (const slug of bezTla) {
    const page = bySlug.get(slug);
    assert.ok(page, `${slug}: strona istnieje`);
    assert.doesNotMatch(page.body, /\{\{zrodlo/, `${slug}: brak bloku tła`);
    assert.ok(!page.zrodla || page.zrodla.length === 0, `${slug}: brak adresów w zrodla`);
  }
});

test('serie Eldrana i Macross Delta mają komplet metadanych i tło pierwowzoru (ADR 0008, ADR 0012)', () => {
  const daiteioh = bySlug.get('kanzen-shouri-daiteioh');
  assert.equal(daiteioh.tytul_ja, '完全勝利ダイテイオー');
  assert.equal(daiteioh.rodzaj, 'ova');
  assert.equal(daiteioh.rok, 2001);
  assert.equal(daiteioh.odcinki, 1);
  assert.ok(daiteioh.tagi.includes('ova'));
  assert.ok(!daiteioh.tagi.includes('serial-tv'));
  assert.match(daiteioh.body, /\{\{zrodlo gra=wspolne[\s\S]*sprawdzono 2026-11-10/);

  const ganbaruger = bySlug.get('genki-bakuhatsu-ganbaruger');
  assert.equal(ganbaruger.tytul_ja, '元気爆発ガンバルガー');
  assert.equal(ganbaruger.rodzaj, 'tv');
  assert.equal(ganbaruger.rok, 1992);
  assert.equal(ganbaruger.odcinki, 47);
  assert.match(ganbaruger.body, /\{\{zrodlo gra=wspolne[\s\S]*sprawdzono 2026-11-10/);

  const macross = bySlug.get('macross-delta');
  assert.equal(macross.rok, 2016);
  assert.equal(macross.odcinki, 26);
  assert.match(macross.body, /\{\{zrodlo gra=wspolne[\s\S]*sprawdzono 2026-11-10/);
});

test('maszyny z misji 2-8 mają sprawdzone tło pierwowzoru (ADR 0008, ADR 0013)', () => {
  for (const [slug, wzorzec] of [
    ['bolt-robo-anti-air', /Hyper Bolt Robo/],
    ['brocken-cannon', /105mm Cannon/],
    ['gandoppler', /dziewiętnastym odcinku/],
    ['daiteioh', /Shōri Gattai/],
    ['perfect-daiteioh', /Dairyuoha/],
    ['ganbaruger', /Miracle Gattai/],
    ['great-ganbaruger', /Revolgerem/],
  ]) {
    const page = bySlug.get(slug);
    assert.ok(page.zrodla.length >= 1, `${slug}: zrodla`);
    const blok = page.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
    assert.ok(blok, `${slug}: blok zrodlo`);
    assert.match(blok[1], /sprawdzono 2026-11-10/, `${slug}: data sprawdzenia`);
    assert.match(blok[1], wzorzec, `${slug}: wyróżnik pierwowzoru`);
    for (const url of page.zrodla) assert.ok(blok[1].includes(url), `${slug}: link w treści`);
  }
});

test('piloci Daiteioh i Ganbaruger z misji 2-8 mają sprawdzone tło pierwowzoru (ADR 0008, ADR 0013)', () => {
  for (const [slug, wzorzec] of [
    ['taro-omomo', /大桃 タロウ/],
    ['mai-ozora', /大空 マイ/],
    ['kakeru-daichi', /大地 カケル/],
    ['hiryu-tsukishiro', /月城 ヒリュウ/],
    ['kotaro-kirigakure', /霧隠 虎太郎/],
    ['yosuke-kazamatsuri', /風祭 鷹介/],
    ['rikiya-ryuzaki', /流崎 力哉/],
  ]) {
    const page = bySlug.get(slug);
    assert.ok(page.zrodla.length >= 1, `${slug}: zrodla`);
    const blok = page.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
    assert.ok(blok, `${slug}: blok zrodlo`);
    assert.match(blok[1], /sprawdzono 2026-11-10/, `${slug}: data sprawdzenia`);
    assert.match(blok[1], wzorzec, `${slug}: zapis oryginalny`);
    for (const url of page.zrodla) assert.ok(blok[1].includes(url), `${slug}: link w treści`);
  }
});

test('serie z pochodzeniem skrypt mają opis udziału w SRW OE i tytuł japoński', () => {
  for (const [slug, tytulJa] of [
    ['getter-robo-armageddon', '真(チェンジ!!)ゲッターロボ 世界最後の日'],
    ['mazinger-edition-z-the-impact', '真マジンガー 衝撃! Z編'],
    ['nekketsu-saikyo-go-saurer', '熱血最強ゴウザウラー'],
    ['tengen-toppa-gurren-lagann', '天元突破グレンラガン'],
  ]) {
    const seria = bySlug.get(slug);
    assert.equal(seria.pochodzenie, 'skrypt', slug);
    assert.equal(seria.tytul_ja, tytulJa, `${slug}: tytul_ja`);
    assert.match(seria.body, /^\{\{skrypt gra=srw-oe\n/m, `${slug}: blok skrypt`);
    assert.match(seria.body, /^\{\{zrodlo gra=wspolne\n/m, `${slug}: blok zrodlo`);
  }
});

test('pozostała obsada wsparcia Eldrana, Generał Takeda i nazwane encje SRW Y mają tło ze źródeł (ADR 0008, ADR 0013)', () => {
  for (const [slug, wzorzec] of [
    ['hidenori-kondo', /近藤 ひでのり/],
    ['hiroshi-takamori', /高森 ひろし/],
    ['miki-mano', /真野 美紀/],
    ['yu-izumi', /泉 ゆう/],
    ['shuzo-osada', /長田 秀三/],
    ['ikuyo-oyama', /大山 育代/],
    ['yuka-mizuhara', /水原 結花/],
    ['general-takeda', /武田長官/],
    ['zero', /Suzaku Kururugi/],
    ['yomogi-asanaka', /麻中 蓬/],
    ['baku-yamagishi', /山岸 獏/],
    ['altron-gundam', /XXXG-01S2 Altron Gundam/],
    ['lancelot-albion-zero', /ランスロット・アルビオンゼロ/],
    ['taurus', /OZ-12SMS Taurus/],
  ]) {
    const page = bySlug.get(slug);
    assert.ok(page, `${slug}: strona istnieje`);
    assert.ok(Array.isArray(page.zrodla) && page.zrodla.length >= 1, `${slug}: zrodla`);
    const blok = page.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
    assert.ok(blok, `${slug}: blok zrodlo`);
    assert.match(blok[1], /sprawdzono 2026-11-10/, `${slug}: data sprawdzenia`);
    assert.match(blok[1], wzorzec, `${slug}: zapis lub wyróżnik ze źródła`);
    for (const url of page.zrodla) assert.ok(blok[1].includes(url), `${slug}: link w treści`);
  }
});
