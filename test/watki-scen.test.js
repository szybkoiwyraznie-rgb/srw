/**
 * „Wątki w scenie” mają wszędzie ten sam kształt tabeli (decyzja właściciela 2026-11-16).
 *
 * Scena 3-2 miała tabelę czterokolumnową, pozostałe sceny listę punktowaną — ten sam
 * boks wyglądał więc inaczej w zależności od tego, kto i kiedy pisał scenę. Właściciel
 * oczekuje jednego, tabelarycznego układu, spójnego z „Wątkami fabularnymi” epizodu
 * (ADR 0031): motyw, źródło, odcinek w źródle, różnice.
 *
 * Test pilnuje nagłówka, czterech kolumn w każdym wierszu i braku listy w tym boksie.
 * Nie pilnuje treści — o tym, co jest motywem, decyduje autor sceny.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wczytajStrony } from '../tools/content-loader.mjs';

const strony = wczytajStrony();
const bySlug = new Map(strony.map((p) => [p.slug, p]));
const sceny = strony.filter((p) => p.typ === 'scena');
const NAGLOWEK = '## Wątki w scenie';
const KOLUMNY = ['Motyw w scenie', 'Źródło', 'Odcinek w źródle', 'Różnice'];

/**
 * Surowa treść sekcji „Wątki w scenie” z ciała strony, bez znaczników bloku
 * poziomu wiarygodności przed ewentualnym następnym nagłówkiem `##`.
 */
function sekcja(page) {
  const start = page.body.indexOf(NAGLOWEK);
  if (start < 0) return null;
  const reszta = page.body.slice(start + NAGLOWEK.length);
  const koniec = reszta.search(/^(?:## |\{\{[a-z]+)/m);
  const tresc = koniec < 0 ? reszta : reszta.slice(0, koniec);
  return tresc.replace(/^\s*\}\}\s*$/gm, '');
}

/** Komórki wiersza tabeli bez skrajnych pionków; `\|` w wikilinkach nie dzieli komórek. */
function komorki(linia) {
  return linia.replace(/\\\|/g, '\u0000').split('|').slice(1, -1)
    .map((c) => c.trim().replace(/\u0000/g, '\\|'));
}

test('każda scena ma sekcję „Wątki w scenie”', () => {
  assert.ok(sceny.length > 0, 'baza ma sceny');
  for (const page of sceny) {
    assert.ok(sekcja(page) !== null, `${page.slug}: brak sekcji „${NAGLOWEK}”`);
  }
});

test('wątki w scenie są tabelą, a nie listą punktowaną', () => {
  for (const page of sceny) {
    const tresc = sekcja(page);
    if (tresc === null) continue;
    const niepuste = tresc.split('\n').map((l) => l.trim()).filter(Boolean);
    assert.ok(niepuste.length > 0, `${page.slug}: pusta sekcja wątków`);
    assert.ok(niepuste.every((l) => l.startsWith('|')),
      `${page.slug}: sekcja wątków nie jest w całości tabelą — „${niepuste.find((l) => !l.startsWith('|'))}”`);
    assert.doesNotMatch(tresc, /^\s*[-*]\s+\S/m, `${page.slug}: wątek zapisany listą punktowaną`);
  }
});

test('tabela wątków sceny ma cztery kolumny i wiersz oddzielający', () => {
  for (const page of sceny) {
    const tresc = sekcja(page);
    if (tresc === null) continue;
    const wiersze = tresc.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
    assert.deepEqual(komorki(wiersze[0]), KOLUMNY, `${page.slug}: nagłówek tabeli wątków`);
    assert.match(wiersze[1], /^\|(?:\s*:?-{3,}:?\s*\|)+$/, `${page.slug}: wiersz oddzielający`);
    for (const wiersz of wiersze.slice(2)) {
      assert.equal(komorki(wiersz).length, 4, `${page.slug}: wiersz poza czterema kolumnami — ${wiersz}`);
    }
    assert.ok(wiersze.length >= 3, `${page.slug}: tabela ma co najmniej jeden wątek`);
  }
});

test('każdy wątek sceny ma wypełnione źródło i odcinek w źródle', () => {
  for (const page of sceny) {
    const tresc = sekcja(page);
    if (tresc === null) continue;
    const gra = bySlug.get(page.epizod)?.gra;
    const wiersze = tresc.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|')).slice(2);
    for (const wiersz of wiersze) {
      const [, zrodlo, odcinek] = komorki(wiersz);
      assert.ok(zrodlo && zrodlo.length > 0, `${page.slug}: wątek bez źródła — ${wiersz}`);
      assert.match(odcinek, /^(?:odc\.\s*\d|cała seria$|n\/d$)/,
        `${page.slug}: „Odcinek w źródle” musi być odcinkiem, całą serią lub n/d — ${odcinek}`);
      if (odcinek === 'n/d' && gra) {
        assert.ok(zrodlo.includes(`[[${gra}`),
          `${page.slug}: przy „n/d” źródłem musi być gra ${gra}, nie ${zrodlo}`);
      }
    }
  }
});
