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
  assert.match(blok[1], /sprawdzono 2026-10-24\)/, `${slug}: data sprawdzenia źródła`);
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
    'mikiyasu-shinshi', 'hiromi-yamazaki']) {
    sprawdzBlok(slug, [wiki]);
  }
  assert.match(bySlug.get('asuma-shinohara').body, /synem prezesa Shinohara Heavy Industries/);
  assert.match(bySlug.get('kiichi-goto').body, /dzielnicy Taitō/);
  assert.match(bySlug.get('kanuka-clancy').body, /policji nowojorskiej/);
  assert.doesNotMatch(bySlug.get('kanuka-clancy').body, /nie ma sobie równych/);
  assert.match(bySlug.get('mikiyasu-shinshi').body, /jako jedyny w jednostce jest żonaty/);
  assert.match(bySlug.get('mikiyasu-shinshi').body, /łatwo daje sobą pomiatać/);
  assert.match(bySlug.get('hiromi-yamazaki').body, /pochodzi z Okinawy/);
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
  assert.match(bySlug.get('labor').body, /patlabory/);
  assert.match(bySlug.get('labor').body, /do niego należy \[\[ingram-nr-1\|AV-98 Ingram\]\]/);
  assert.match(bySlug.get('sv2').body, /powołany w 1996 roku/);
  assert.match(bySlug.get('poligon-fuji').body, /pod Gotembą/);
  assert.match(bySlug.get('poligon-fuji').body, /\{\{zrodlo[\s\S]*\[\[hal-x10-green\|HAL-X10\]\]/);
  assert.match(bySlug.get('sily-samoobrony-japonii').body, /przed piechotą\s*\n?\s*spadochronową/);
});

test('encje bez pierwowzoru poza bazą źródeł nie dostają zmyślonego tła (ADR 0012, ADR 0018)', () => {
  // Zbiorcze profile, sprzęt pola walki i jednostki oryginalne nie mają osobnego
  // pierwowzoru do zacytowania — pusty blok byłby zmyśleniem.
  const bezTla = ['oficer-federacji', 'oficer-zeonu', 'zolnierz-federacji', 'zolnierz-jsdf',
    'zolnierz-zeonu', 'control-ai', 'shinohara-hos', 'turret', 'h-bomb-missile',
    'cybird', 'exart'];
  for (const slug of bezTla) {
    const page = bySlug.get(slug);
    assert.ok(page, `${slug}: strona istnieje`);
    assert.doesNotMatch(page.body, /\{\{zrodlo/, `${slug}: brak bloku tła`);
    assert.ok(!page.zrodla || page.zrodla.length === 0, `${slug}: brak adresów w zrodla`);
  }
});
