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
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });

const { renderGlowna } = await import('../src/srw/render-home.js');
const { renderEncja } = await import('../src/srw/render-entity.js');
const { renderEpizod } = await import('../src/srw/render-episode.js');
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

test('strona epizodu pokazuje skrypt, sceny i nawigację', () => {
  const html = renderEpizod('srw-oe-ep0');
  assert.match(html, /panel-skryptu/);
  assert.match(html, /Stacja Connect/, 'surowy skrypt epizodu ma być widoczny');
  assert.match(html, /#\/scena\/prolog-i-trening-w-connect/);
});

test('strona sceny pokazuje dosłowną treść i analizę', () => {
  const html = renderEncja('prolog-i-trening-w-connect');
  assert.match(html, /Treść sceny/);
  assert.match(html, /Analiza/);
  assert.match(html, /Himari/);
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

test('szkielet strony zawiera nawigację i stopkę z licznikami', () => {
  const html = rama('glowna', 'Baza', '<p>treść</p>');
  assert.match(html, /nawigacja/);
  assert.match(html, /#\/epizody/);
  assert.match(html, /#\/serie/);
  assert.match(html, /stopka/);
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
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

test('opisy wszystkich stron mówią o świecie, bez wewnętrznych procedur', () => {
  for (const page of Object.values(globalThis.SRW_DATA.strony)) {
    const html = page.typ === 'epizod' ? renderEpizod(page.slug) : renderEncja(page.slug);
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

test('pełna treść epizodu jest dostępna bez ujawniania ścieżki archiwum', () => {
  const html = renderEpizod('srw-oe-ep0');
  assert.match(html, /<summary>Treść epizodu<\/summary>/);
  assert.match(html, /Stacja Connect/);
  assert.doesNotMatch(html, /episodes\/|ep000\.md|<dt>Skrypt/);
});
