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
import {
  ostatnieBlokiDuchow,
  ostatnieBlokiUmiejetnosci,
  ostatniePuleSP,
  blokUmiejetnosci,
  wierszeTabeli,
  kluczKomendy,
} from './helpers/komendy.js';

const strony = wczytajStrony();
const ostatnie = ostatnieBlokiDuchow();
const ostatnieUmiejetnosci = ostatnieBlokiUmiejetnosci();
const ostatnieSP = ostatniePuleSP();

/**
 * Blok z dostaw SRW OE dla strony: po tytule albo po pseudonimie, pod którym postać
 * figuruje w tej grze — profil „Zero” z dostawy 4-4 to strona Leloucha (decyzja
 * właściciela o Zero, 2026-11-27).
 */
const dlaStrony = (mapa, strona) => mapa.get(strona.tytul) ?? mapa.get(strona.pseudonim_w_grze?.['srw-oe']);

/** Sekcja Komend Ducha z ciała strony (albo null) — obejmuje też sekcje tuż przed `}}` i nagłówki pogrubione. */
const sekcjaDuchow = (body) =>
  /(?:### Komendy Ducha|\*\*Komendy Ducha[^\n]*)\n([\s\S]*?)(?:\n\n|\n\}\}|$)/.exec(body)?.[1] ?? null;

/** Blok parametrów SRW OE ze strony postaci (albo całe ciało jako zapas). */
const blokParametrowOE = (body) =>
  /\{\{menu gra=srw-oe[\s\S]*?## Parametry[\s\S]*?\n\}\}/.exec(body)?.[0] ?? body;

test('tabela Komend Ducha na stronie równa się ostatniemu blokowi z dostaw', () => {
  let porownane = 0;
  for (const strona of strony.filter((s) => s.typ === 'postac')) {
    const dostawa = dlaStrony(ostatnie, strona);
    if (!dostawa) continue; // postacie bez bloku w dostawach (inne gry, opisy własne)
    const sekcja = sekcjaDuchow(strona.body);
    assert.ok(sekcja, `${strona.tytul}: brak sekcji Komend Ducha (ostatnia dostawa: ${dostawa.plik})`);
    porownane++;
    assert.deepEqual(wierszeTabeli(sekcja).map(kluczKomendy), dostawa.wiersze.map(kluczKomendy),
      `${strona.tytul}: tabela musi odpowiadać blokowi z ${dostawa.plik}`);
  }
  // Strażnik kompletności: każda postać z ostatniego bloku w dostawach musi być sprawdzona.
  assert.equal(porownane, ostatnie.size,
    `porównano ${porownane} z ${ostatnie.size} postaci z dostaw`);
});

test('żadna komenda na stronie nie pochodzi ze starszego bloku niż ostatni', () => {
  // Komenda spoza ostatniego bloku to ślad po starym stanie — do usunięcia
  // do następnej dostawy (ADR 0044). Gdy dostawa ją powtórzy, wraca legalnie.
  for (const strona of strony.filter((s) => s.typ === 'postac')) {
    const sekcja = sekcjaDuchow(strona.body);
    if (!sekcja) continue;
    const dostawa = dlaStrony(ostatnie, strona);
    if (!dostawa) continue;
    const dozwolone = new Set(dostawa.wiersze.map((w) => w.split('|')[1]));
    for (const wiersz of wierszeTabeli(sekcja)) {
      const [, duch] = wiersz.split('|');
      assert.ok(dozwolone.has(duch), `${strona.tytul}: ${duch} nie występuje w ${dostawa.plik}`);
    }
  }
});

test('tabela umiejętności pilota na stronie równa się ostatniemu blokowi z dostaw', () => {
  const kluczUmiejetnosci = (w) => {
    const [slot, nazwa, poz] = w.split('|');
    return `${slot}|${nazwa.replace(/\*\*/g, '').trim()}|${poz}`;
  };
  let porownane = 0;
  for (const strona of strony.filter((s) => s.typ === 'postac')) {
    const dostawa = dlaStrony(ostatnieUmiejetnosci, strona);
    if (!dostawa) continue;
    const wiersze = blokUmiejetnosci(blokParametrowOE(strona.body));
    assert.ok(wiersze, `${strona.tytul}: brak tabeli umiejętności z ${dostawa.plik}`);
    porownane++;
    assert.deepEqual(wiersze.map(kluczUmiejetnosci), dostawa.wiersze.map(kluczUmiejetnosci),
      `${strona.tytul}: umiejętności muszą odpowiadać blokowi z ${dostawa.plik}`);
  }
  assert.ok(porownane >= 65, `porównano tylko ${porownane} pilotów`);
});

test('pula SP podpilota na stronie równa się ostatniemu blokowi z dostaw', () => {
  let porownane = 0;
  for (const strona of strony.filter((s) => s.typ === 'postac')) {
    const dostawa = dlaStrony(ostatnieSP, strona);
    if (!dostawa) continue;
    const m = /Pula SP:\*?\*?\s*\*?\*?(\d+)/.exec(blokParametrowOE(strona.body));
    assert.ok(m, `${strona.tytul}: brak puli SP podpilota z ${dostawa.plik}`);
    porownane++;
    assert.equal(Number(m[1]), dostawa.sp,
      `${strona.tytul}: pula SP musi odpowiadać blokowi z ${dostawa.plik}`);
  }
  assert.equal(porownane, ostatnieSP.size,
    `porównano ${porownane} z ${ostatnieSP.size} podpilotów`);
});
