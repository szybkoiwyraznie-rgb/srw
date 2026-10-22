/**
 * Filtry działów: opcja „Nieokreślona” w serii mechów (2026-10-22, zgłoszenie
 * właściciela) oraz chmura tagów nad listą haseł.
 *
 * Oba filtry żyją w adresie, więc test sprawdza także, że link z chipa niesie
 * poprawny wybór, a wartości spoza bazy są odrzucane.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });
const { renderListe } = await import('../src/srw/render-lists.js');

const strony = Object.values(globalThis.SRW_DATA.strony);
const mechy = strony.filter((p) => p.typ === 'mech');
const hasla = strony.filter((p) => p.typ === 'pojecie');
const linkiMechow = (html) => [...html.matchAll(/href="#\/mech\/([^"]+)"/g)].map((m) => m[1]).sort();
const linkiHasel = (html) => [...html.matchAll(/href="#\/pojecie\/([^"]+)"/g)].map((m) => m[1]).sort();

test('mechy: seria ma opcję „Nieokreślona”, która wybiera maszyny bez serii', () => {
  const bezSerii = mechy.filter((p) => !p.seria).map((p) => p.slug).sort();
  assert.ok(bezSerii.length > 0, 'baza ma mechy bez przypisanej serii');

  const wszystkie = renderListe('mech');
  assert.match(wszystkie, /<option value="bez-serii">Nieokreślona<\/option>/, 'opcja w selektorze serii');

  const wybrane = renderListe('mech', { seria: 'bez-serii' });
  assert.match(wybrane, /<option value="bez-serii" selected>Nieokreślona<\/option>/, 'opcja zaznaczona');
  assert.deepEqual(linkiMechow(wybrane), bezSerii, 'lista zawiera tylko maszyny bez serii');
  assert.match(wybrane, /filtru-jest/, 'nagłówek nazywa aktywny filtr');
  assert.match(wybrane, /bez serii/);
  assert.match(wybrane, /pokaż wszystkie/, 'powrót do pełnej listy');

  // Filtr łączy się z pozostałymi: gra zawęża, gdy nie ma takich maszyn w grze.
  const zGra = renderListe('mech', { seria: 'bez-serii', gra: 'srw-oe' });
  assert.deepEqual(linkiMechow(zGra), bezSerii, 'wszystkie trzy maszyny są z OE');
});

test('hasła: chmura tagów filtruje listę i przełącza wybór linkiem', () => {
  const baza = renderListe('pojecie');
  assert.match(baza, /class="chmura-tagow"/, 'chmura jest nad listą');
  assert.ok(baza.indexOf('chmura-tagow') < baza.indexOf('lista-duza'), 'chmura poprzedza hasła');
  assert.deepEqual(linkiHasel(baza), hasla.map((p) => p.slug).sort(), 'bez wyboru widać wszystkie hasła');

  const tag = 'najazd';
  const oczekiwane = hasla.filter((p) => (p.tagi ?? []).includes(tag)).map((p) => p.slug).sort();
  assert.ok(oczekiwane.length > 0 && oczekiwane.length < hasla.length, 'tag zawęża listę');
  const poJednym = renderListe('pojecie', { tagi: tag });
  assert.deepEqual(linkiHasel(poJednym), oczekiwane, 'tylko hasła z wybranym tagiem');
  assert.match(poJednym, /chip chip-aktywny/, 'wybrany tag jest wyróżniony');
  assert.match(poJednym, /tagi: najazd/, 'nagłówek pokazuje wybór');
  assert.match(poJednym, /wyczyść wybór/, 'jest powrót do wszystkich haseł');
  assert.match(poJednym, /href="#\/pojecia"/, 'czyszczenie prowadzi do pełnej listy');

  // Kliknięcie drugiego chipa dokłada tag do wyboru: lista pokazuje sumę obu zbiorów.
  const suma = hasla.filter((p) => ['najazd', 'era'].some((t) => (p.tagi ?? []).includes(t)));
  const poDwoch = renderListe('pojecie', { tagi: 'najazd,era' });
  assert.deepEqual(linkiHasel(poDwoch), suma.map((p) => p.slug).sort(), 'wybrane tagi sumują listę');
  assert.match(poDwoch, /tagi: najazd, era/, 'wybór jest opisany w nagłówku');
  // Chip nieaktywnego tagu prowadzi do wyboru z dołożonym tagiem.
  assert.match(poDwoch, new RegExp(`href="#/pojecia\\?tagi=[^"]*era[^"]*"`));

  // Wybór w adresie jest odfiltrowany z duplikatów i nazw spoza bazy.
  assert.deepEqual(linkiHasel(renderListe('pojecie', { tagi: 'najazd,najazd,nie-ma-takiego' })), oczekiwane);
  const smieci = renderListe('pojecie', { tagi: '"><script>alert(1)</script>' });
  assert.doesNotMatch(smieci, /<script>alert/);
  assert.deepEqual(linkiHasel(smieci), hasla.map((p) => p.slug).sort(), 'nieznany tag nie zmienia listy');
});

test('hasła: chmura pokazuje liczby wszystkich haseł z danym tagiem', () => {
  const html = renderListe('pojecie', { tagi: 'najazd' });
  for (const tag of ['najazd', 'one-year-war', 'connect']) {
    const liczba = hasla.filter((p) => (p.tagi ?? []).includes(tag)).length;
    assert.match(html, new RegExp(`>${tag} <span class="licznik">${liczba}</span>`), `${tag}: licznik`);
  }
  // Wybór tagu nie zmienia liczb na chipach — pokazują rozmiar zbioru, nie wynik filtra.
  const bezWyboru = renderListe('pojecie');
  const licznik = (dokument, tag) => dokument.match(new RegExp(`>${tag} <span class="licznik">(\\d+)</span>`))[1];
  assert.equal(licznik(html, 'najazd'), licznik(bezWyboru, 'najazd'));
});
