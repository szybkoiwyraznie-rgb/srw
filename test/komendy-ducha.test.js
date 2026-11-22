/**
 * „Ostatnia dostawa ma rację” (ADR 0044) w tabelach Komend Ducha.
 *
 * Strona pilota pokazuje komendy z ostatniego bloku, który go opisuje — także
 * wtedy, gdy ten blok jest krótszy od wcześniejszego. Dostawa 2-7 dała
 * Seishirowi cztery komendy (Skupienie, Pęd, Duch, Zapał), a każda późniejsza
 * podaje tylko dwie pierwsze; na stronie zostają więc dwie.
 *
 * To nie jest zakaz na zawsze: w miarę grania postacie dostają nowe komendy,
 * a strażnik czyta stan z materiału, nie z listy wpisanej w teście. Gdy pojawi
 * się `dostawa_4_2.txt` z trzecim slotem, test zacznie wymagać trzech wierszy
 * bez zmiany kodu.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { ostatnieBlokiDuchow, wierszeTabeli, kluczKomendy } from './helpers/komendy.js';

const strony = wczytajStrony();
const ostatnie = ostatnieBlokiDuchow();

/** Sekcja Komend Ducha z ciała strony (albo null). */
const sekcjaDuchow = (body) => /### Komendy Ducha\n([\s\S]*?)\n\n/.exec(body)?.[1] ?? null;

test('tabela Komend Ducha na stronie równa się ostatniemu blokowi z dostaw', () => {
  let porownane = 0;
  for (const strona of strony.filter((s) => s.typ === 'postac')) {
    const sekcja = sekcjaDuchow(strona.body);
    if (!sekcja) continue;
    const dostawa = ostatnie.get(strona.tytul);
    if (!dostawa) continue; // postacie bez bloku w dostawach (inne gry, opisy własne)
    porownane++;
    assert.deepEqual(wierszeTabeli(sekcja).map(kluczKomendy), dostawa.wiersze.map(kluczKomendy),
      `${strona.tytul}: tabela musi odpowiadać blokowi z ${dostawa.plik}`);
  }
  // Strażnik progu: bez porównań test przechodziłby zawsze.
  assert.ok(porownane >= 25, `porównano tylko ${porownane} postaci`);
});

test('żadna komenda na stronie nie pochodzi ze starszego bloku niż ostatni', () => {
  // Komenda spoza ostatniego bloku to ślad po starym stanie — do usunięcia
  // do następnej dostawy (ADR 0044). Gdy dostawa ją powtórzy, wraca legalnie.
  for (const strona of strony.filter((s) => s.typ === 'postac')) {
    const sekcja = sekcjaDuchow(strona.body);
    if (!sekcja) continue;
    const dostawa = ostatnie.get(strona.tytul);
    if (!dostawa) continue;
    const dozwolone = new Set(dostawa.wiersze.map((w) => w.split('|')[1]));
    for (const wiersz of wierszeTabeli(sekcja)) {
      const [, duch] = wiersz.split('|');
      assert.ok(dozwolone.has(duch), `${strona.tytul}: ${duch} nie występuje w ${dostawa.plik}`);
    }
  }
});
