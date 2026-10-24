/**
 * Tagi jako jedyny opis rodzaju treści (ADR 0033).
 *
 * Testy pilnują trzech rzeczy: pole `kategoria` zniknęło, warstwy tagów
 * (rodzaj treści, rola, rodzaj jednostki, seria, rodzaj serii) zgadzają się
 * z polami strony, a listy pokazują tagi zamiast tekstowego typu.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });

const { renderListe, renderTagi } = await import('../src/srw/render-lists.js');

const strony = Object.values(globalThis.SRW_DATA.strony);
const oTypie = (typ) => strony.filter((s) => s.typ === typ);
const tagi = (s) => s.tagi ?? [];

/** Rodzaje treści, które były kiedyś wartościami pola `kategoria`. */
const RODZAJE_TRESCI = new Set([
  'technologia', 'organizacja', 'miejsce', 'jednostka-wojskowa', 'panstwo', 'najazd',
  'wydarzenie', 'era', 'czas-akcji', 'taktyka', 'traktat-wojenny', 'zjawisko',
  'odznaczenie', 'postac-z-innej-serii',
]);

const TAG_SERII = {
  'mobile-suit-gundam-1979': 'gundam-1979',
  'mobile-suit-gundam-0080': 'gundam-0080',
  'mobile-suit-gundam-08th-ms-team': '08th-ms-team',
  'mobile-police-patlabor': 'patlabor',
  'patlabor-the-movie': 'patlabor',
  'matchless-raijin-oh': 'eldran',
  'sgt-frog': 'sgt-frog',
  'super-robot-wars-original': 'super-robot-wars',
};

test('pole kategoria zniknęło z całej bazy', () => {
  for (const s of strony) {
    assert.equal(Object.hasOwn(s, 'kategoria'), false, `${s.slug}: rodzaj treści niesie tag, nie osobne pole`);
  }
});

test('każde hasło ma tag rodzaju treści', () => {
  for (const s of oTypie('pojecie')) {
    const rodzaje = tagi(s).filter((t) => RODZAJE_TRESCI.has(t));
    assert.ok(rodzaje.length > 0, `${s.slug}: brak tagu rodzaju treści (tagi: ${tagi(s).join(', ') || 'brak'})`);
  }
});

test('rola postaci i rodzaj serii mają odpowiednik w tagach', () => {
  for (const s of oTypie('postac')) {
    if (!s.rola) continue;
    assert.ok(tagi(s).includes(s.rola), `${s.slug}: rola ${s.rola} ma być tagiem`);
  }
  const rodzaje = { tv: 'serial-tv', ova: 'ova', film: 'film', manga: 'manga' };
  for (const s of oTypie('seria')) {
    if (!s.rodzaj) continue;
    assert.ok(tagi(s).includes(rodzaje[s.rodzaj]), `${s.slug}: rodzaj ${s.rodzaj} ma być tagiem`);
  }
});

test('strona z serią nosi tag swojego świata', () => {
  for (const s of strony) {
    if (!s.seria) continue;
    const oczekiwany = TAG_SERII[s.seria];
    assert.ok(oczekiwany, `${s.slug}: seria ${s.seria} bez tagu w tabeli (ADR 0033)`);
    assert.ok(tagi(s).includes(oczekiwany), `${s.slug}: brak tagu serii ${oczekiwany}`);
  }
});

test('każda strona bazy ma tag i żadna nie taguje samej siebie', () => {
  for (const s of strony) {
    assert.ok(tagi(s).length > 0, `${s.slug}: strona bez tagów`);
    assert.ok(!tagi(s).includes(s.slug), `${s.slug}: tag równy własnemu slugowi nic nie wnosi`);
    assert.equal(new Set(tagi(s)).size, tagi(s).length, `${s.slug}: powtórzony tag`);
  }
  const wszystkie = Object.keys(globalThis.SRW_DATA.tagi);
  assert.ok(wszystkie.length >= 50, `baza ma ${wszystkie.length} tagów — za mało na nawigację przekrojową`);
});

test('maszyny bez podanej klasy świadomie nie dostają tagu rodzaju jednostki', () => {
  // ADR 0018: czego materiał nie mówi, tego nie dopisujemy. Te pięć jednostek
  // nie ma w bazie podanej klasy, więc nie zgadujemy jej tagiem.
  const RODZAJE_JEDNOSTEK = ['mobile-suit', 'labor', 'okret', 'mysliwiec', 'super-robot', 'pojazd-wsparcia', 'pocisk', 'bezzalogowy'];
  const bezKlasy = oTypie('mech')
    .filter((s) => !tagi(s).some((t) => RODZAJE_JEDNOSTEK.includes(t)))
    .map((s) => s.slug)
    .sort();
  assert.deepEqual(bezKlasy, ['cybird', 'cybuster', 'exart', 'guntank', 'real-pg-gundam']);
});

test('lista haseł pokazuje tagi zamiast tekstowego typu', () => {
  const html = renderListe('pojecie');
  assert.match(html, /chipsy-inline/, 'wiersz hasła ma chipsy tagów');
  assert.match(html, /href="#\/tag\/jednostka-wojskowa"/, 'rodzaj treści jest klikalnym tagiem');
  assert.doesNotMatch(html, /<span class="meta">jednostka wojskowa<\/span>/, 'bez martwego podpisu z typem');
  assert.doesNotMatch(html, /postać z innej serii/, 'dawne wartości kategorii zniknęły z listy');

  const chmura = renderTagi();
  for (const tag of ['pilot', 'zeon', 'federacja', 'labor', 'miejsce', 'organizacja']) {
    assert.match(chmura, new RegExp(`#/tag/${tag}"`), `chmura tagów zawiera ${tag}`);
  }
});
