/**
 * Quick menu w kolumnie bocznej: spis boksów kolumny głównej (decyzja właściciela 2026-11-16).
 *
 * Właściciel chce na każdej podstronie, której lewa kolumna ma przynajmniej
 * dwa boksy, listę odsyłaczy do nich u szczytu prawej kolumny. Testy pilnują
 * czterech rzeczy:
 * - spis stoi w kolumnie bocznej scen, epizodów i encji, na samej górze,
 * - obejmuje boksy kolumny głównej, a nie metrykę ani „Powiązania”,
 * - każda pozycja celuje w kotwicę, która naprawdę istnieje w HTML-u strony,
 * - przy jednym boksie menu znika — spis z jedną pozycją nic nie wnosi.
 *
 * Oczekiwania są liczone z danych bazy, nie przepisywane z listy w teście:
 * liczba pozycji menu to liczba boksu w kolumnie głównej.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });
const DANE = globalThis.SRW_DATA.strony;

const { renderScena } = await import('../src/srw/render-scene.js');
const { renderEpizod } = await import('../src/srw/render-episode.js');
const { renderEncja } = await import('../src/srw/render-entity.js');

const rysuj = (s) => {
  if (s.typ === 'scena') return renderScena(s.slug);
  if (s.typ === 'epizod') return renderEpizod(s.slug);
  return renderEncja(s.slug);
};

/** Wycinek HTML: kolumna główna, kolumna boczna i samo menu. */
function czesci(html) {
  const iGlownej = html.indexOf('class="kolumna-glowna');
  // Wycinek zaczyna się od otwarcia `<aside>`, nie od atrybutu `class`.
  const iBocznej = html.lastIndexOf('<aside', html.indexOf('class="kolumna-boczna'));
  const menu = html.match(/<nav class="quick-menu"[\s\S]*?<\/nav>/)?.[0] ?? null;
  const iMenu = menu ? html.indexOf(menu) : -1;
  return {
    glowna: iGlownej >= 0 && iBocznej > iGlownej ? html.slice(iGlownej, iBocznej) : '',
    boczna: iBocznej >= 0 ? html.slice(iBocznej) : '',
    menu,
    menuWBocznej: iMenu >= iBocznej && iBocznej >= 0,
  };
}

/**
 * Kotwice, do których prowadzi spis. `data-cel` mają też odsyłacze podsekcji
 * analizy w treści strony — te stoją poza `<nav>`, więc wycinek menu jest
 * wolny od nich.
 */
const cele = (menu) => [...String(menu ?? '').matchAll(/<li><a href="[^"]*" data-cel="([^"]+)">/g)].map((m) => m[1]);


test('każda scena ma spis swoich sekcji u szczytu prawej kolumny', () => {
  const sceny = Object.values(DANE).filter((s) => s.typ === 'scena');
  assert.ok(sceny.length >= 20, 'baza ma sceny');
  for (const s of sceny) {
    const c = czesci(rysuj(s));
    assert.ok(c.menu, `${s.slug}: brak spisu boksu`);
    assert.ok(c.menuWBocznej, `${s.slug}: spis stoi poza kolumną boczną`);
    assert.match(c.boczna, /^<aside class="kolumna-boczna"[^>]*>\s*<nav class="quick-menu"/,
      `${s.slug}: spis jest pierwszą rzeczą w kolumnie bocznej`);
    // Kolejność czytania sceny; sekcja „Nawiązania” istnieje tylko w scenach,
    // które naprawdę prowadzą do konkretnego odcinka (ADR 0008).
    const tytuly = [...c.menu.matchAll(/<li><a href="[^"]*" data-cel="[^"]+">([^<]+)</g)].map((m) => m[1]);
    const oczekiwane = ['Analiza', 'Treść sceny', 'Wątki w scenie',
      ...(tytuly.includes('Nawiązania do oryginalnych odcinków') ? ['Nawiązania do oryginalnych odcinków'] : [])];
    assert.deepEqual(tytuly, oczekiwane, `${s.slug}: spis w kolejności czytania sceny`);
  }
});

test('każda pozycja spisu prowadzi do istniejącej kotwicy w kolumnie głównej', () => {
  let sprawdzone = 0;
  for (const s of Object.values(DANE)) {
    const html = rysuj(s);
    const c = czesci(html);
    if (!c.menu) continue;
    sprawdzone += 1;
    for (const cel of cele(c.menu)) {
      assert.match(c.glowna, new RegExp(`id="${cel}"`),
        `${s.slug}: pozycja spisu celuje w „${cel}”, którego nie ma w kolumnie głównej`);
      // Spis nie może prowadzić do metryki ani „Powiązań” — te stoją obok niego.
      assert.doesNotMatch(c.boczna.replace(c.menu, ''), new RegExp(`id="${cel}"`),
        `${s.slug}: „${cel}” stoi w kolumnie bocznej, a spis ma prowadzić do treści`);
    }
  }
  assert.ok(sprawdzone > 200, `spis sprawdzony na ${sprawdzone} stronach`);
});

test('menu ma sens tylko od dwóch boksów: przy jednym znika', () => {
  let zMenu = 0;
  let bezMenu = 0;
  for (const s of Object.values(DANE)) {
    const c = czesci(rysuj(s));
    if (c.menu) {
      zMenu += 1;
      assert.ok(cele(c.menu).length >= 2, `${s.slug}: menu z mniej niż dwiema pozycjami`);
    } else {
      bezMenu += 1;
    }
  }
  assert.ok(zMenu > 200 && bezMenu > 100, `menu na ${zMenu} stronach, bez menu ${bezMenu}`);
});

test('spis nie powtarza pozycji i nie pokazuje pustych tytułów', () => {
  for (const s of Object.values(DANE)) {
    const c = czesci(rysuj(s));
    if (!c.menu) continue;
    const lista = cele(c.menu);
    assert.equal(new Set(lista).size, lista.length, `${s.slug}: kotwica powtórzona w spisie`);
    const tytuly = [...c.menu.matchAll(/<li><a href="[^"]*" data-cel="[^"]+">([^<]*)</g)].map((m) => m[1].trim());
    assert.deepEqual(tytuly.filter((t) => t === ''), [], `${s.slug}: pusta pozycja w spisie`);
    assert.doesNotMatch(c.menu, />\s*(?:undefined|null)\s*<|data-cel="(?:undefined|null)"/, `${s.slug}: do spisu trafiła pusta wartość`);
  }
});

test('menu pojawia się dokładnie od dwóch boksów, nie wcześniej', () => {
  // Boksy kolumny głównej: sekcje sceny i epizodu oraz nagłówki i własne listy encji.
  const korzenie = (glowna) => [
    ...glowna.matchAll(/<(?:section|div)[^>]*\bid="(sekcja-[^"]+|boks-[^"]+)"/g),
    ...glowna.matchAll(/<h2[^>]*\bid="(boks-[^"]+)"/g),
  ].length;

  let zMenu = 0;
  let bezMenu = 0;
  for (const s of Object.values(DANE)) {
    const c = czesci(rysuj(s));
    const n = korzenie(c.glowna);
    if (n >= 2) {
      zMenu += 1;
      assert.ok(c.menu, `${s.slug}: ${n} boksy w kolumnie głównej, a nie ma spisu`);
    } else {
      bezMenu += 1;
      assert.equal(c.menu, null, `${s.slug}: menu przy ${n} boksie`);
    }
  }
  assert.ok(zMenu > 200, `stron z menu: ${zMenu}`);
  assert.ok(bezMenu > 100, `stron bez menu: ${bezMenu}`);
});

test('kliknięcie w spis przewija do boksu, zamiast zmieniać trasę', async () => {
  // Router reaguje na zmianę hasha, więc odsyłacz do kotwicy w tej samej
  // stronie łamałby nawigację. Kliknięcie przechwytuje `podepnijSkokiWStronie`
  // i przewija element o wskazanym `id` — sprawdzamy to na atrapie DOM.
  const { podepnijSkokiWStronie } = await import('../src/srw/skoki-w-stronie.js');

  const przewiniecia = [];
  const klasa = new Set();
  const cel = {
    id: 'sekcja-analiza',
    scrollIntoView: (o) => przewiniecia.push(o),
    classList: { add: (k) => klasa.add(k), remove: (k) => klasa.delete(k) },
    offsetWidth: 10,
  };
  const dokument = {
    uchwyty: [],
    addEventListener: (typ, fn) => dokument.uchwyty.push({ typ, fn }),
    getElementById: (id) => (id === cel.id ? cel : null),
  };
  const zapobiegniety = [];
  const link = {
    dataset: { cel: cel.id },
    closest: (sel) => (sel === '[data-cel]' ? link : null),
  };
  podepnijSkokiWStronie(dokument);
  {
    const klik = dokument.uchwyty.find((u) => u.typ === 'click');
    assert.ok(klik, 'delegacja kliknięcia jest podpięta');
    klik.fn({ target: link, preventDefault: () => zapobiegniety.push(true) });

    assert.deepEqual(zapobiegniety, [true], 'kliknięcie nie zmienia trasy');
    assert.equal(przewiniecia.length, 1, 'strona przewija się do boksu');
    assert.equal(przewiniecia[0].block, 'start');
    assert.ok(klasa.has('podswietlenie'), 'cel dostaje podświetlenie');
  }
});
