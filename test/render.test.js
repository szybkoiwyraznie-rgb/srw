/**
 * Testy rendererów — uruchamiane w Node, bez przeglądarki.
 *
 * Renderery zwracają HTML (string), więc można je wywołać na prawdziwych
 * danych bazy i sprawdzić, czy strony faktycznie się składają. To łapie
 * błędy, których nie widzi ani kontrola składni, ani walidacja schematu:
 * brakujące funkcje, złe nazwy pól, puste sekcje wyglądające jak treść.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';
import { wczytajCoNowego } from '../tools/content-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });

const { renderGlowna } = await import('../src/srw/render-home.js');
const { renderEncja } = await import('../src/srw/render-entity.js');
const { renderEpizod } = await import('../src/srw/render-episode.js');
const { renderScena } = await import('../src/srw/render-scene.js');
const { renderListe, renderTagi, renderTag } = await import('../src/srw/render-lists.js');
const { renderSzukanie } = await import('../src/srw/render-search.js');
const { renderCoNowego } = await import('../src/srw/render-whatsnew.js');
const { renderOBazie } = await import('../src/srw/render-about.js');
const { rama, nieZnalesc, NAZWY_POCHODZENIA } = await import('../src/srw/render.js');

test('strona główna pokazuje liczby i nie udaje już bazy demonstracyjnej', () => {
  const html = renderGlowna();
  assert.match(html, /SRW Database/);
  assert.match(html, /kafelek-liczba/);
  assert.ok(!/baner-demo/.test(html), 'po dostawie baza nie jest demonstracyjna');
});

test('strona postaci składa infoboks, powiązania i backlinki', () => {
  const html = renderEncja('seishiro');
  assert.match(html, /Seishiro/);
  assert.match(html, /Powiązania/);
  assert.match(html, /Wymienione w/);
  assert.match(html, /#\/epizod\/srw-oe-ep0/, 'postać ma być podlinkowana do epizodu z treści');
  assert.match(html, /poziom-skrypt/, 'poziom wiarygodności ma być widoczny jako kolor tła fragmentu');
  assert.ok(!/class="tresc-encja poziom/.test(html), 'kolor nie może wisieć na stronie (ADR 0011)');
});

test('infoboks encji podaje grę, w której występuje (ADR 0020)', () => {
  const html = renderEncja('cybuster');
  assert.match(html, /<dt>Gra<\/dt><dd><a class="link-strony" href="#\/gra\/srw-oe">Super Robot Wars OE<\/a><\/dd>/);
  assert.match(html, /data-gra="srw-oe"/, 'galeria ilustracji ma zakres gry');
  assert.match(html, /<p class="zakres-gry"><a href="#\/gra\/srw-oe">Super Robot Wars OE<\/a><\/p>/);
});

test('fragment wspólny ma etykietę bez odsyłacza do gry (ADR 0020)', () => {
  const html = renderEncja('cybuster');
  assert.match(html, /data-gra="wspolne"/);
  assert.match(html, /<p class="zakres-gry"><span title="Informacje wspólne dla wszystkich tytułów">Wspólne<\/span><\/p>/);
});

test('strona epizodu otwiera się scenami, bez boksu z surowym skryptem', () => {
  const html = renderEpizod('srw-oe-ep0');
  assert.doesNotMatch(html, /panel-skryptu/, 'zwijany boks „Treść epizodu” zniknął');
  assert.match(html, /#\/scena\/prolog-i-trening-w-connect/);
  const sceny = html.indexOf('blok-sceny-pelna');
  const uklad = html.indexOf('uklad-strona');
  assert.ok(sceny >= 0, 'sekcja scen na pełną szerokość');
  assert.ok(sceny < uklad, 'sceny stoją nad układem dwukolumnowym');
});

test('strona sceny pokazuje dosłowną treść i analizę', () => {
  const html = renderScena('prolog-i-trening-w-connect');
  assert.match(html, /Treść sceny/);
  assert.match(html, /Analiza/);
  assert.match(html, /Himari/);
  assert.match(html, /uklad-strona/, 'scena ma układ dwukolumnowy');
});

test('listy działów działają i respektują filtry', () => {
  const postacie = renderListe('postac');
  assert.match(postacie, /Seishiro/);
  assert.match(postacie, /Himari Yaegaki/);

  const epizody = renderListe('epizod');
  assert.match(epizody, /Epizod 0/);
});

test('tagi i strony tagów działają', () => {
  const chmura = renderTagi();
  assert.match(chmura, /connect/);
  const tag = renderTag('connect');
  assert.match(tag, /Seishiro/);
  assert.match(nieZnalesc('x'), /Nie znaleziono/);
});

test('wyszukiwanie znajduje po tytule i po treści', () => {
  const poTytule = renderSzukanie('seishiro');
  assert.match(poTytule, /wynik/);
  assert.match(poTytule, /Seishiro/);

  // szukanie działa na tekście treści, nie tylko na tytułach
  const poTresci = renderSzukanie('Exart');
  assert.match(poTresci, /Prolog i trening/);

  assert.match(renderSzukanie(''), /Wpisz frazę/);
  assert.match(renderSzukanie('zzznie-ma-takiego'), /Nic nie znaleziono/);
});

test('dziennik zmian i strona „o bazie\" się renderują', () => {
  assert.match(renderCoNowego(), /2026-10-17/);
  assert.match(renderOBazie(), /Znaczniki pochodzenia/);
});

test('wpisy dziennika linkują do stron, których dotyczą', () => {
  // Wpis o postaci, mechu, haśle, serii albo epizodzie ma prowadzić wprost
  // do tej strony. Wystarczy jeden odsyłacz na wpis — powtórzone w tym samym
  // wpisie nazwy (np. w cytowanym tytule sekcji) mogą zostać bez linku.
  // Test łapie tytuły w formie podstawowej; odmienione formy („Cybustera”)
  // zostają w gestii redakcji wpisu.
  const wpisy = wczytajCoNowego({ root: ROOT });
  const strony = Object.values(globalThis.SRW_DATA.strony);
  const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const problemy = [];
  for (const w of wpisy) {
    const bezLinkow = w.tekst
      .replace(/\[\[[^\]]+\]\]/g, ' ')
      .replace(/\[[^\]]+\]\([^)]*\)/g, ' ');
    const podlinkowane = new Set(
      [...w.tekst.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1].trim()),
    );
    for (const p of strony) {
      if (p.tytul.length < 5 || podlinkowane.has(p.slug)) continue;
      const re = new RegExp(
        `(?<![\\p{L}\\p{N}])${escapeRe(p.tytul)}(?![\\p{L}\\p{N}])`, 'u');
      if (re.test(bezLinkow)) problemy.push(`${w.data} ${w.czas ?? ''}: „${p.tytul}” bez linku (${p.slug})`);
    }
  }
  assert.deepEqual(problemy, [], 'każda wzmianka o stronie powinna być odsyłaczem');
});

test('menu w nagłówku prowadzi do wszystkich działów, w kolejności czytania', () => {
  const html = rama('glowna', 'Baza', '<p>treść</p>');
  const nawigacja = html.match(/<nav class="nawigacja"[\s\S]*?<\/nav>/)[0];
  // Cztery działy fabularne stoją przed działami technicznymi, w kolejności
  // scena → epizod → postać → mech → gra.
  const kolejnosc = ['#/sceny', '#/epizody', '#/postacie', '#/mechy', '#/gry', '#/serie', '#/pojecia', '#/tagi', '#/co-nowego', '#/o-bazie'];
  const pozycje = kolejnosc.map((href) => {
    const i = nawigacja.indexOf(`href="${href}"`);
    assert.ok(i >= 0, `menu: ${href}`);
    return i;
  });
  assert.deepEqual([...pozycje].sort((a, b) => a - b), pozycje, 'menu zachowuje kolejność działów');
  assert.match(html, /stopka/);
  assert.doesNotMatch(html, /stopka-linki/, 'stopka nie ma już własnego menu');
  assert.equal((html.match(/href="#\/serie"/g) ?? []).length, 1, 'link do działu występuje raz');
});

test('menu i wyszukiwarka mieszczą się w jednej linii bez zawijania', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/srw/style.css'), 'utf8');
  const wnetrze = css.match(/\.naglowek-wnetrze \{[^}]*\}/)[0];
  assert.match(wnetrze, /flex-wrap:\s*nowrap/, 'pasek nagłówka się nie zawija');
  const nawigacja = css.match(/\.nawigacja \{[^}]*\}/)[0];
  assert.match(nawigacja, /flex-wrap:\s*nowrap/, 'menu się nie zawija');
  const szukaj = css.match(/\.szukaj \{[^}]*\}/)[0];
  assert.match(szukaj, /flex:\s*1 1 auto/, 'szerokość wyszukiwarki jest płynna');
  assert.match(szukaj, /min-width:/, 'wyszukiwarka ma dolny limit szerokości');
  assert.match(szukaj, /max-width:/, 'wyszukiwarka ma górny limit szerokości');
  const link = css.match(/\.nawigacja a \{[^}]*\}/)[0];
  assert.match(link, /padding:[^;]*clamp\(/, 'odstępy pozycji menu są płynne');
  assert.match(link, /font-size:[^;]*clamp\(/, 'wielkość pozycji menu jest płynna');
  assert.match(link, /white-space:\s*nowrap/, 'pozycje menu nie łamią się w środku');
});

test('strona główna: dziennik zmian w lewej kolumnie, ostatnio dodane w prawej', () => {
  const html = renderGlowna();
  assert.match(html, /dwie-kolumny-nierowne/, 'układ 3/4 + 1/4');
  assert.match(html, /<h2>Co nowego<\/h2>/);
  assert.match(html, /<h2>Ostatnio dodane<\/h2>/);
  assert.doesNotMatch(html, /Najnowsze epizody/, 'lista epizodów ustąpiła dziennikowi');
  const lewa = html.slice(html.indexOf('<h2>Co nowego</h2>'), html.indexOf('<h2>Ostatnio dodane</h2>'));
  assert.equal((lewa.match(/<span class="data mono">/g) ?? []).length, 8, 'osiem najnowszych wpisów');
  assert.match(lewa, /href="#\/co-nowego"/, 'odsyłacz do całego dziennika');
  const prawa = html.slice(html.indexOf('Ostatnio dodane'));
  assert.match(prawa, /href="#\/(postac|mech|pojecie|seria)\//, 'prawa kolumna linkuje do wpisów');
  // Kafle nadal prowadzą do czterech działów fabularnych.
  for (const href of ['#/sceny', '#/epizody', '#/postacie', '#/mechy']) {
    assert.ok(html.includes(`class="kafelek" href="${href}"`), `kafel ${href}`);
  }
  // Opis nie jest sztucznie zawężany — ma zajmować całą szerokość.
  const css = fs.readFileSync(path.join(ROOT, 'src/srw/style.css'), 'utf8');
  const heroOpis = css.match(/\.hero-opis \{[^}]*\}/)[0];
  assert.doesNotMatch(heroOpis, /max-width/, 'hero-opis bez ograniczenia szerokości');
});


// Podmieniamy tylko metadane epizodu; po każdym teście przywracamy dane bazy.
function epizodZPolami(t, pola) {
  const strony = globalThis.SRW_DATA.strony;
  const oryginal = strony['srw-oe-ep0'];
  strony['srw-oe-ep0'] = { ...oryginal, ...pola };
  t.after(() => { strony['srw-oe-ep0'] = oryginal; });
  return renderEpizod('srw-oe-ep0');
}

test('brak daty rozegrania nie jest zadaniem do uzupełnienia ani pustym podtytułem', (t) => {
  const html = epizodZPolami(t, { rozegrano: '', trasa: '' });
  assert.doesNotMatch(html, /data rozegrania|Do uzupełnienia|blok-braki|class="podtytul"/);
});

test('podana data rozegrania nadal wyświetla się razem z trasą', (t) => {
  const html = epizodZPolami(t, { rozegrano: '2026-10-19', trasa: 'A & B' });
  assert.match(html, /rozegrano 2026-10-19 · trasa: <strong>A &amp; B<\/strong>/);
  assert.match(html, /<dt>Rozegrano<\/dt><dd>2026-10-19<\/dd>/);
});

test('trasa bez daty nie ma początkowego separatora', (t) => {
  const html = epizodZPolami(t, { rozegrano: '', trasa: 'A' });
  assert.match(html, /<p class="podtytul">trasa: <strong>A<\/strong><\/p>/);
});

test('braki redakcyjne epizodu nie tworzą publicznej kolejki zadań', (t) => {
  const html = epizodZPolami(t, { rozegrano: '', skrypt: '', postacie: [], mechy: [] });
  assert.doesNotMatch(html, /Do uzupełnienia|odnośnik do skryptu|blok-braki|data rozegrania/);
});


// Sprawdzamy tekst czytelnika, nie techniczne nazwy pól, klasy CSS i adresy URL.
function tekstWidoczny(html) {
  // Surowy skrypt epizodu to archiwum rozgrywki (ADR 0005), nie proza redakcyjna:
  // może zawierać światowe słowa typu „dostawa zaopatrzenia”, których zakaz dotyczy
  // wyłącznie opisów pisanych przez redakcję.
  return html
    .replace(/<pre class="skrypt">[\s\S]*?<\/pre>/g, ' ')
    .replace(/<div class="skrypt-tekst">[\s\S]*?<\/div>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ');
}

test('opisy wszystkich stron mówią o świecie, bez wewnętrznych procedur', () => {
  for (const page of Object.values(globalThis.SRW_DATA.strony)) {
    const html = page.typ === 'epizod'
      ? renderEpizod(page.slug)
      : page.typ === 'scena' ? renderScena(page.slug) : renderEncja(page.slug);
    assert.doesNotMatch(tekstWidoczny(html), /\b(?:dostaw[\p{L}]*|właściciel[\p{L}]*|skryp[\p{L}]*)\b/iu, page.slug);
    assert.doesNotMatch(tekstWidoczny(html), /nie przypisano|dane od|brak materiału|tworzenia biografii|danych domyślnej załogi|w obrębie.*hasła|w tej bazie|nie sprawdzono|nie potwierdzono/iu, page.slug);
  }
});

test('strony pomocnicze, dziennik i legendy nie ujawniają procesu redakcyjnego', () => {
  const html = [renderGlowna(), renderOBazie(), renderCoNowego()].join(' ');
  const text = tekstWidoczny(html);
  assert.doesNotMatch(text, /\b(?:dostaw[\p{L}]*|właściciel[\p{L}]*|skryp[\p{L}]*)\b/iu);
  assert.doesNotMatch(text, /AGENTS\.md|docs\/|ADR \d|agentowi|praca agenta|build|repozytorium|push|modelu/iu);
  assert.doesNotMatch(JSON.stringify(NAZWY_POCHODZENIA), /dostaw|właściciel|skrypt epizodu|modelu|ADR/i);
  assert.match(text, /niezweryfikowany kontekst/i, 'legenda nadal odróżnia treść niepotwierdzoną');
});

test('pełna treść epizodu jest dostępna przez sceny, bez ujawniania ścieżki archiwum', () => {
  const html = renderEpizod('srw-oe-ep0');
  assert.doesNotMatch(html, /episodes\/|ep000\.md|<dt>Skrypt/);
  // Dosłowny tekst epizodu czyta się po scenach — strona epizodu do nich prowadzi.
  assert.match(html, /#\/scena\/prolog-i-trening-w-connect/);
  assert.match(html, /#\/scena\/srw-oe-ep0-na-ratunek-white-base/);
  const scena = renderScena('prolog-i-trening-w-connect');
  assert.match(scena, /Stacja Connect/, 'treść sceny zostaje dosłowna');
  assert.doesNotMatch(scena, /episodes\/|ep000\.md|<dt>Skrypt/);
});

test('listy scen: tytuł i streszczenie mają ten sam układ na stronie epizodu i w dziale', async () => {
  const { sekcjaScen } = await import('../src/srw/render-scene.js');
  const zEpizodu = sekcjaScen('srw-oe-ep0');
  const zDzialu = renderListe('scena');
  const wiersze = (html) => [...html.matchAll(/<li><a href="#\/scena\/[^"]+">[\s\S]*?<\/li>/g)].map((m) => m[0]);
  const a = wiersze(zEpizodu);
  // Dział „Sceny” grupuje wszystkie epizody — porównujemy tylko wiersze epizodu 0.
  const ep0 = new Set(['prolog-i-trening-w-connect', 'srw-oe-ep0-na-ratunek-white-base']);
  const b = wiersze(zDzialu).filter((w) => [...ep0].some((slug) => w.includes(`#/scena/${slug}"`)));
  assert.equal(a.length, 2);
  assert.equal(b.length, 2);
  assert.deepEqual(a, b, 'oba widoki składają wiersz sceny tak samo');
  for (const wiersz of a) {
    assert.match(wiersz, /<\/a><span class="streszczenie-sceny">/, 'streszczenie w osobnym elemencie, nie po myślniku');
    assert.match(wiersz, /<span class="numer-sceny">/, 'numer sceny w tym samym stylu');
    assert.doesNotMatch(wiersz, /<\/a> — /, 'brak wtrąconego myślnika');
  }
  // Kolejność i komplet: każda scena epizodu ma opis.
  assert.match(a[0], /0-1<\/span> <strong>Prolog i trening w Connect/);
  assert.match(a[1], /0-2<\/span> <strong>Na ratunek White Base/);
});

test('galeria: selektory zależne są wyłączone, dopóki brak nadrzędnego filtra', () => {
  const bezGry = renderListe('mech');
  assert.match(bezGry, /<select class="filtr-select" name="epizod" disabled onchange=/, 'Odcinek wymaga Gry');
  assert.match(bezGry, /<select class="filtr-select" name="scena" disabled onchange=/, 'Scena wymaga Odcinka');
  assert.doesNotMatch(bezGry, /onchange="[^"]*disabled/, 'disabled nie może trafić do kodu obsługi zdarzenia');

  const zGra = renderListe('mech', { gra: 'srw-oe' });
  assert.match(zGra, /<select class="filtr-select" name="epizod" onchange=/, 'po wyborze gry Odcinek jest dostępny');
  assert.match(zGra, /<select class="filtr-select" name="scena" disabled onchange=/, 'Scena nadal czeka na Odcinek');
});

test('galeria: pusty wynik filtra nie zabiera filtrów', () => {
  const html = renderListe('mech', { gra: 'srw-oe', epizod: 'srw-oe-ep0', seria: 'patlabor-the-movie' });
  assert.match(html, /stan-pusty/);
  assert.match(html, /filtry-krokowe/, 'zestaw filtrów zostaje nad pustą listą');
});

test('galeria: wartości z adresu nie wstrzykują znaczników ani stylów', () => {
  const html = renderListe('mech', {
    seria: `'><img src=x onerror=alert(1)>`,
    rozmiar: '</style><script>alert(1)</script>',
    cokolwiek: '<b>nieznany klucz</b>',
  });
  assert.doesNotMatch(html, /<\/style><script>|<img src=x|<script>alert/);
  assert.match(html, /--kafel-szer: 240px/, 'niepoprawny rozmiar wraca do wartości domyślnej');
  assert.match(html, /&#39;&gt;&lt;img/, 'wartość filtra jest zakodowana w atrybucie');
  assert.doesNotMatch(html, /cokolwiek/, 'nieznane klucze adresu są odrzucane');
  assert.match(renderListe('mech', { rozmiar: '9999' }), /--kafel-szer: 360px/, 'rozmiar jest ograniczony do zakresu suwaka');
});
