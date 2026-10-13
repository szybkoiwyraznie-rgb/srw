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
const { rama, nieZnalesc } = await import('../src/srw/render.js');

test('strona główna pokazuje liczby i oznacza dane demonstracyjne', () => {
  const html = renderGlowna();
  assert.match(html, /SRW Database/);
  assert.match(html, /baner-demo/, 'baza w trybie demo ma o tym mówić wprost');
  assert.match(html, /kafelek-liczba/);
});

test('strona encji składa infoboks, powiązania i backlinki', () => {
  const html = renderEncja('amuro-ray');
  assert.match(html, /Amuro Ray/);
  assert.match(html, /Powiązania/);
  assert.match(html, /Wymienione w/);
  assert.match(html, /#\/mech\/rx-78-2-gundam/, 'mech pilota musi być podlinkowany');
  assert.match(html, /#\/seria\/mobile-suit-gundam-1979/);
  assert.match(html, /plakietka-wiedza/, 'pochodzenie ma być widoczne');
});

test('strona mecha pokazuje arsenał i serial źródłowy', () => {
  const html = renderEncja('mazinger-z');
  assert.match(html, /Arsenał/);
  assert.match(html, /#\/bron\/rocket-punch/);
  assert.match(html, /#\/postac\/koji-kabuto/);
});

test('strona epizodu pokazuje skrypt, obsadę i nawigację między odcinkami', () => {
  const html = renderEpizod('demo-ep001');
  assert.match(html, /panel-skryptu/);
  assert.match(html, /AMURO: To nie jest nasze niebo/);
  assert.match(html, /W tym epizodzie/);
  assert.match(html, /#\/mech\/getter-1/);
  assert.match(html, /Wątki anime/);
});

test('strona serii zbiera postacie i mechy z tego uniwersum', () => {
  const html = renderEncja('getter-robo-1974');
  assert.match(html, /Z tej serii/);
  assert.match(html, /#\/postac\/ryoma-nagare/);
});

test('listy działów działają i respektują filtry', () => {
  const mechy = renderListe('mech');
  assert.match(mechy, /Gundam/);
  assert.match(mechy, /Mazinger Z/);

  const zMazingera = renderListe('mech', { seria: 'mazinger-z-1972' });
  assert.match(zMazingera, /Mazinger Z/);
  assert.ok(!zMazingera.includes('Getter-1'), 'filtr po serii musi zawężać listę');

  const epizody = renderListe('epizod');
  assert.match(epizody, /Gra demonstracyjna/);
});

test('tagi i strony tagów działają', () => {
  const chmura = renderTagi();
  assert.match(chmura, /super-robot/);
  const tag = renderTag('super-robot');
  assert.match(tag, /Mazinger Z/);
  assert.match(nieZnalesc('x'), /Nie znaleziono/);
});

test('wyszukiwanie znajduje po tytule i po treści', () => {
  const poTytule = renderSzukanie('gundam');
  assert.match(poTytule, /wynik/);
  assert.match(poTytule, /Gundam/);

  // szukanie działa na tekście treści, nie tylko na tytułach (szukamy rdzenia)
  const poTresci = renderSzukanie('fotoniczn');
  assert.match(poTresci, /Mazinger/);

  assert.match(renderSzukanie(''), /Wpisz frazę/);
  assert.match(renderSzukanie('zzznie-ma-takiego'), /Nic nie znaleziono/);
});

test('dziennik zmian i strona „o bazie" się renderują', () => {
  assert.match(renderCoNowego(), /2026-10-13|październik 2026/);
  assert.match(renderOBazie(), /Znaczniki pochodzenia/);
});

test('szkielet strony zawiera nawigację i stopkę z licznikami', () => {
  const html = rama('glowna', 'Baza', '<p>treść</p>');
  assert.match(html, /nawigacja/);
  assert.match(html, /#\/epizody/);
  assert.match(html, /#\/serie/);
  assert.match(html, /stopka/);
});
