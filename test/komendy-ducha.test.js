/**
 * „Ostatnia dostawa ma rację” (ADR 0044) w tabelach Komend Ducha.
 *
 * Strona pilota pokazuje komendy z ostatniego bloku, który go opisuje —
 * także wtedy, gdy ten blok jest krótszy od wcześniejszego. Dostawa 2-7 dała
 * Seishirowi cztery komendy (Skupienie, Pęd, Duch, Zapał), a każda późniejsza
 * podaje tylko dwie pierwsze; na stronie zostają więc dwie.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { wczytajStrony } from '../tools/content-loader.mjs';

const strony = wczytajStrony();
const bySlug = new Map(strony.map((s) => [s.slug, s]));

/** Pliki dostaw w kolejności chronologicznej (prolog przed numerowanymi). */
const pliki = fs.readdirSync('dostawy/srw-oe')
  .filter((p) => /^dostawa_.*\.txt$/.test(p))
  .sort((a, b) => (a.includes('epizod_0') ? -1 : b.includes('epizod_0') ? 1 : a.localeCompare(b)));

/**
 * Wiersz komendy bez różnic redakcyjnych: nazwa, poziom i koszt muszą się zgadzać
 * znak w znak, a w efekcie pomijamy doklejane w jednych dostawach, a w innych nie
 * „Efekt: 1 razy —” / „Efekt: 1 tura —”.
 */
const klucz = (wiersz) => {
  const [slot, duch, poz, koszt, efekt] = wiersz.split('|');
  const opis = efekt
    .replace(/Efekt: 1 (?:razy|tura)\s*—\s*/g, '')
    .replace(/\s*—\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return [slot, duch, poz, koszt, opis].join('|');
};

/** Ostatni blok ducha dla każdej nazwy postaci w plikach dostaw. */
const ostatnie = new Map();
for (const plik of pliki) {
  const tekst = fs.readFileSync(path.join('dostawy/srw-oe', plik), 'utf8').replace(/\r/g, '');
  for (const m of tekst.matchAll(/^#{3,4} ([^\n]+)\n([\s\S]*?)(?=^#{3,4} |$(?![\s\S]))/gm)) {
    const duchy = /\*\*Komendy Ducha[^\n]*\n([\s\S]*?)(?:\n\n|$)/.exec(m[2]);
    if (!duchy) continue;
    const wiersze = duchy[1].split('\n')
      .filter((l) => /^\|\s*\d+\s*\|/.test(l))
      .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()).join('|'));
    if (wiersze.length) ostatnie.set(m[1].trim(), { plik, wiersze });
  }
}

test('tabela Komend Ducha na stronie równa się ostatniemu blokowi z dostaw', () => {
  let porownane = 0;
  for (const strona of strony.filter((s) => s.typ === 'postac')) {
    const sekcja = /### Komendy Ducha\n([\s\S]*?)\n\n/.exec(strona.body);
    if (!sekcja) continue;
    const dostawa = ostatnie.get(strona.tytul);
    if (!dostawa) continue; // postacie bez bloku w dostawach (inne gry, opisy własne)
    porownane++;
    const wiersze = sekcja[1].split('\n')
      .filter((l) => /^\|\s*\d+\s*\|/.test(l))
      .map((l) => klucz(l.split('|').slice(1, -1).map((c) => c.trim()).join('|')));
    assert.deepEqual(wiersze, dostawa.wiersze.map(klucz),
      `${strona.tytul}: tabela musi odpowiadać blokowi z ${dostawa.plik}`);
  }
  // Strażnik progu: bez porównań test przechodziłby zawsze.
  assert.ok(porownane >= 25, `porównano tylko ${porownane} postaci`);
});

test('Seishiro nie wraca do czterech komend z dostawy 2-7', () => {
  const seishiro = bySlug.get('seishiro');
  assert.match(seishiro.body, /### Komendy Ducha\n\n\| Slot \| Duch \| Poz\. nauki \| Koszt SP \| Efekt bazowy \|\n/);
  assert.doesNotMatch(seishiro.body, /\*\*Duch\*\*/);
  assert.doesNotMatch(seishiro.body, /\*\*Zapał\*\*/);
});
