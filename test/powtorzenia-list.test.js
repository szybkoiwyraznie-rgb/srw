/**
 * Jedna pozycja — jedno miejsce na stronie encji (ADR 0036).
 *
 * Strona encji pokazuje odsyłacze w czterech miejscach: w metryce (Gra, Seria,
 * Piloci), na własnej liście w treści („Rozegrane epizody", „Z tej serii…"),
 * w „Powiązaniach" i w „Wymienione w". Ta sama strona nie może stać w dwóch
 * z nich naraz — inaczej czytelnik dostaje dwie listy tego samego, a ręcznie
 * pisane zdanie w treści rozjeżdża „Powiązania" z listą budowaną z pól.
 *
 * Oczekiwania są wyprowadzane z danych bazy i z wyrenderowanej strony, nie
 * z list wpisanych w test (L15).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });
const DANE = globalThis.SRW_DATA;

const { renderEncja } = await import('../src/srw/render-entity.js');

const TYPY_ENCJI = ['gra', 'postac', 'mech', 'pojecie', 'seria'];
const ENCJE = Object.values(DANE.strony).filter((s) => TYPY_ENCJI.includes(s.typ));

/** Slugi stron, do których prowadzą odsyłacze we fragmencie HTML. */
function slugi(html) {
  return [...html.matchAll(/href="#\/[a-z-]+\/([^"]+)"/g)].map((m) => m[1]);
}

/** Rozbiór wyrenderowanej strony na cztery miejsca z odsyłaczami. */
function miejsca(strona) {
  const html = renderEncja(strona.slug);
  const granica = html.indexOf('class="kolumna-boczna');
  assert.ok(granica > 0, `${strona.slug}: strona ma kolumnę boczną`);
  const glowna = html.slice(0, granica);
  const boczna = html.slice(granica);

  // Własne listy stoją w treści za opisem strony; poznajemy je po nagłówku.
  const listy = [...glowna.matchAll(/<section class="blok-(?:lista|powiazan)">\s*<h2>((?:Rozegrane epizody|Z tej serii:)[^<]*)<\/h2>([\s\S]*?)<\/section>/g)]
    .map((m) => ({ tytul: m[1], slugi: slugi(m[2]) }));

  const metryka = boczna.match(/<dl class="infoboks-lista">([\s\S]*?)<\/dl>/)?.[1] ?? '';
  const powiazania = boczna.match(/<section class="blok-powiazan">\s*<h2>Powiązania<\/h2>([\s\S]*?)<\/section>/)?.[1] ?? '';
  const wymienione = boczna.match(/<section class="blok-powiazan blok-przychodzacych">([\s\S]*?)<\/section>/)?.[1] ?? '';

  return {
    listy,
    naListach: listy.flatMap((l) => l.slugi),
    metryka: slugi(metryka),
    powiazania: slugi(powiazania),
    wymienione: slugi(wymienione),
  };
}

const wychodzace = (strona) => (strona.linki ?? []).filter((slug) => DANE.strony[slug]);
const przychodzace = (strona) => (DANE.backlinki[strona.slug] ?? []).map((b) => b.slug).filter((slug) => DANE.strony[slug]);
const posortowane = (lista) => [...new Set(lista)].sort();

test('kolumna boczna nie powtarza metryki ani własnych list strony', () => {
  let pominiete = 0;
  for (const strona of ENCJE) {
    const m = miejsca(strona);
    const pokazane = new Set([...m.metryka, ...m.naListach]);
    const naListach = new Set(m.naListach);

    assert.deepEqual(m.powiazania.filter((slug) => pokazane.has(slug)), [],
      `${strona.slug}: „Powiązania” powtarzają metrykę albo własną listę strony`);
    assert.deepEqual(m.wymienione.filter((slug) => naListach.has(slug)), [],
      `${strona.slug}: „Wymienione w” powtarza własną listę strony`);
    for (const [nazwa, lista] of [['Powiązania', m.powiazania], ['Wymienione w', m.wymienione], ['własne listy', m.naListach]]) {
      assert.equal(new Set(lista).size, lista.length, `${strona.slug}: ${nazwa} — pozycja stoi dwa razy`);
    }
    pominiete += wychodzace(strona).filter((slug) => pokazane.has(slug)).length;
  }
  // Test nie może przechodzić „na pusto”: baza ma powtórzenia do pominięcia.
  assert.ok(pominiete > 0, 'żadna strona nie miała odsyłacza do pominięcia — test niczego nie sprawdza');
});

test('pomijanie powtórzeń niczego nie gubi: każdy odsyłacz stoi dokładnie w jednym miejscu', () => {
  for (const strona of ENCJE) {
    const m = miejsca(strona);
    const pokazane = new Set([...m.metryka, ...m.naListach]);
    const naListach = new Set(m.naListach);

    assert.deepEqual(posortowane(m.powiazania), posortowane(wychodzace(strona).filter((slug) => !pokazane.has(slug))),
      `${strona.slug}: „Powiązania” = odsyłacze strony bez metryki i własnych list`);
    assert.deepEqual(posortowane(m.wymienione), posortowane(przychodzace(strona).filter((slug) => !naListach.has(slug))),
      `${strona.slug}: „Wymienione w” = strony odsyłające tutaj bez własnych list`);
  }
});

test('lista „Z tej serii” pochodzi z pola seria i jest jedynym miejscem dla postaci i mechów serii', () => {
  const serie = ENCJE.filter((s) => s.typ === 'seria');
  let zObsada = 0;
  let spozaSerii = 0;
  for (const seria of serie) {
    const m = miejsca(seria);
    const zPola = Object.values(DANE.strony)
      .filter((p) => (p.typ === 'postac' || p.typ === 'mech') && p.seria === seria.slug)
      .map((p) => p.slug);

    assert.deepEqual(posortowane(m.naListach), posortowane(zPola),
      `${seria.slug}: „Z tej serii” wymienia każdą stronę z polem seria i tylko takie`);
    if (zPola.length > 0) zObsada += 1;

    // Odsyłacz do postaci albo mecha spoza serii zostaje w „Powiązaniach”.
    const obce = wychodzace(seria).filter((slug) => ['postac', 'mech'].includes(DANE.strony[slug].typ) && !zPola.includes(slug));
    for (const slug of obce) {
      assert.ok(m.powiazania.includes(slug), `${seria.slug}: ${slug} jest spoza serii — zostaje w „Powiązaniach”`);
    }
    spozaSerii += obce.length;
  }
  assert.ok(zObsada > 0, 'żadna seria nie ma postaci ani mechów — test niczego nie sprawdza');
  assert.ok(spozaSerii > 0, 'żadna seria nie odsyła poza własną obsadę — test niczego nie sprawdza');
});

test('strona gry: rozegrane epizody stoją tylko na liście epizodów', () => {
  const gry = ENCJE.filter((s) => s.typ === 'gra');
  let zEpizodami = 0;
  for (const gra of gry) {
    const m = miejsca(gra);
    const zPola = Object.values(DANE.strony).filter((p) => p.typ === 'epizod' && p.gra === gra.slug).map((p) => p.slug);
    assert.deepEqual(posortowane(m.naListach), posortowane(zPola), `${gra.slug}: lista epizodów pochodzi z pola gra`);
    if (zPola.length > 0) zEpizodami += 1;
  }
  assert.ok(zEpizodami > 0, 'żadna gra nie ma epizodów — test niczego nie sprawdza');
});
