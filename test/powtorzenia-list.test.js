/**
 * Jedna pozycja — jedno miejsce na stronie encji (ADR 0036, 0038 i 0040).
 *
 * Strona encji pokazuje odsyłacze w trzech miejscach: w metryce (Gra, Seria,
 * Piloci), na własnej liście w treści („Rozegrane epizody", „Z tej serii…")
 * i w boksie „Powiązania". Na stronie encji „Powiązania” pokazują wyłącznie
 * powiązane sceny i hasła (`TYPY_POWIAZAN`, ADR 0040) z obu kierunków — bez
 * powtarzania metryki ani własnych list strony.
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

const { renderEncja, TYPY_POWIAZAN } = await import('../src/srw/render-entity.js');

const TYPY_ENCJI = ['gra', 'postac', 'mech', 'pojecie', 'seria'];
const ENCJE = Object.values(DANE.strony).filter((s) => TYPY_ENCJI.includes(s.typ));

/** Slugi stron, do których prowadzą odsyłacze we fragmencie HTML. */
function slugi(html) {
  return [...html.matchAll(/href="#\/[a-z-]+\/([^"]+)"/g)].map((m) => m[1]);
}

/** Rozbiór wyrenderowanej strony na trzy miejsca z odsyłaczami. */
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
  // Zwinięty boks ma atrybut `data-zwiniety`, a grupa ponad limit — dodatkową klasę (ADR 0039).
  const boksy = [...boczna.matchAll(/<section class="blok-powiazan[^"]*"[^>]*>\s*<h2>([^<]*)<\/h2>([\s\S]*?)<\/section>/g)];
  const powiazania = boksy.find((b) => b[1] === 'Powiązania')?.[2] ?? '';
  // Grupy boksu: nazwa typu, liczba z nagłówka i slugi w kolejności wyświetlania.
  const grupy = powiazania.split(/<div class="grupa-powiazan[^"]*">/).slice(1).map((g) => {
    const naglowek = g.match(/<h3>([^<]*?)\s*<span class="licznik">(\d+)<\/span><\/h3>/);
    return {
      nazwa: naglowek?.[1] ?? null,
      licznik: Number(naglowek?.[2]),
      slugi: slugi(g),
      podpisyGier: [...g.matchAll(/<p class="gra-fabuly">([^<]*)<\/p>/g)].map((m) => m[1]),
    };
  });

  return {
    html,
    listy,
    naListach: listy.flatMap((l) => l.slugi),
    metryka: slugi(metryka),
    tytulyBoksow: boksy.map((b) => b[1]),
    powiazania: slugi(powiazania),
    grupy,
    // Wszystko, do czego prowadzi kolumna boczna poza metryką i tagami.
    boczneOdsylacze: slugi(boksy.map((b) => b[2]).join('')),
  };
}

const wychodzace = (strona) => (strona.linki ?? []).filter((slug) => DANE.strony[slug]);
const przychodzace = (strona) => (DANE.backlinki[strona.slug] ?? []).map((b) => b.slug).filter((slug) => DANE.strony[slug]);
const posortowane = (lista) => [...new Set(lista)].sort();

/** Wszystkie strony powiązane z daną: odsyłacz stąd albo odsyłacz tutaj. */
const wszystkieRelacje = (strona) => posortowane([...wychodzace(strona), ...przychodzace(strona)].filter((slug) => slug !== strona.slug));
/** Relacje wyświetlane w „Powiązaniach” strony encji (ADR 0040: tylko sceny i hasła). */
const powiazane = (strona) => wszystkieRelacje(strona).filter((slug) => TYPY_POWIAZAN.includes(DANE.strony[slug].typ));

test('kolumna boczna ma jeden boks relacji: „Powiązania”', () => {
  let zBoksem = 0;
  for (const strona of ENCJE) {
    const m = miejsca(strona);
    assert.doesNotMatch(m.html, /Wymienione w/, `${strona.slug}: osobny boks „Wymienione w” nie istnieje (ADR 0038)`);
    assert.ok(m.tytulyBoksow.length <= 1, `${strona.slug}: w kolumnie bocznej stoi jeden boks relacji, a są: ${m.tytulyBoksow.join(', ')}`);
    assert.deepEqual(m.boczneOdsylacze, m.powiazania, `${strona.slug}: odsyłacze kolumny bocznej stoją w „Powiązaniach”`);
    if (m.tytulyBoksow.length) zBoksem += 1;
  }
  assert.ok(zBoksem > 0, 'żadna strona nie ma „Powiązań” — test niczego nie sprawdza');
});

test('„Powiązania” nie powtarzają metryki ani własnych list strony', () => {
  let wMetryceLubListach = 0;
  let pozaTypamiPowiazan = 0;
  for (const strona of ENCJE) {
    const m = miejsca(strona);
    const pokazane = new Set([...m.metryka, ...m.naListach]);

    assert.deepEqual(m.powiazania.filter((slug) => pokazane.has(slug)), [],
      `${strona.slug}: „Powiązania” powtarzają metrykę albo własną listę strony`);
    assert.deepEqual(m.powiazania.filter((slug) => !TYPY_POWIAZAN.includes(DANE.strony[slug]?.typ)), [],
      `${strona.slug}: „Powiązania” pokazują wyłącznie typy ${TYPY_POWIAZAN.join(', ')} (ADR 0040)`);
    assert.ok(!m.powiazania.includes(strona.slug), `${strona.slug}: strona nie jest powiązana sama ze sobą`);
    for (const [nazwa, lista] of [['Powiązania', m.powiazania], ['własne listy', m.naListach]]) {
      assert.equal(new Set(lista).size, lista.length, `${strona.slug}: ${nazwa} — pozycja stoi dwa razy`);
    }
    wMetryceLubListach += wszystkieRelacje(strona).filter((slug) => pokazane.has(slug)).length;
    pozaTypamiPowiazan += wszystkieRelacje(strona).filter((slug) => !TYPY_POWIAZAN.includes(DANE.strony[slug].typ)).length;
  }
  assert.ok(wMetryceLubListach > 0, 'żadna strona nie miała odsyłacza w metryce albo własnej liście — test niczego nie sprawdza');
  assert.ok(pozaTypamiPowiazan > 0, 'żadna strona nie miała relacji poza scenami i hasłami — test niczego nie sprawdza');
});

test('„Powiązania” pokazują komplet powiązanych scen i haseł, łącząc oba kierunki', () => {
  let tylkoStad = 0;
  let tylkoTutaj = 0;
  let wObieStrony = 0;
  for (const strona of ENCJE) {
    const m = miejsca(strona);
    const pokazane = new Set([...m.metryka, ...m.naListach]);

    assert.deepEqual(posortowane(m.powiazania), powiazane(strona).filter((slug) => !pokazane.has(slug)),
      `${strona.slug}: „Powiązania” = powiązane sceny i hasła z obu kierunków, bez metryki i własnych list`);
    assert.deepEqual(posortowane([...m.metryka, ...m.naListach, ...m.powiazania].filter((slug) => powiazane(strona).includes(slug))),
      powiazane(strona), `${strona.slug}: każda powiązana scena i hasło są osiągalne ze strony`);

    const stad = new Set(wychodzace(strona));
    const tutaj = new Set(przychodzace(strona));
    for (const slug of m.powiazania) {
      if (stad.has(slug) && tutaj.has(slug)) wObieStrony += 1;
      else if (stad.has(slug)) tylkoStad += 1;
      else tylkoTutaj += 1;
    }
  }
  // Boks naprawdę łączy oba kierunki, a wzajemne odsyłacze liczy raz.
  assert.ok(tylkoStad > 0, 'brak relacji wynikających tylko z odsyłaczy strony');
  assert.ok(tylkoTutaj > 0, 'brak relacji wynikających tylko z odsyłaczy do strony');
  assert.ok(wObieStrony > 0, 'brak stron odsyłających do siebie nawzajem — scalenie nie jest sprawdzone');
});

test('„Powiązania”: grupy w stałej kolejności typów, licznik zgodny z listą, fabuła w kolejności rozgrywki', () => {
  const KOLEJNOSC = ['Sceny', 'Hasła'];
  const epizody = Object.values(DANE.strony).filter((p) => p.typ === 'epizod')
    .sort((a, b) => String(a.gra ?? '').localeCompare(String(b.gra ?? ''), 'pl') || (a.numer ?? 0) - (b.numer ?? 0))
    .map((p) => p.slug);
  const numery = new Intl.Collator('pl', { numeric: true, sensitivity: 'base' }).compare;
  let fabularnych = 0;
  let zKilkuGier = 0;

  for (const strona of ENCJE) {
    const { grupy } = miejsca(strona);
    const nazwy = grupy.map((g) => g.nazwa);
    for (const nazwa of nazwy) assert.ok(KOLEJNOSC.includes(nazwa), `${strona.slug}: nieznana grupa „${nazwa}”`);
    assert.deepEqual(nazwy, KOLEJNOSC.filter((n) => nazwy.includes(n)), `${strona.slug}: kolejność grup`);

    for (const g of grupy) {
      assert.ok(g.slugi.length > 0, `${strona.slug}: grupa „${g.nazwa}” jest pusta`);
      assert.equal(g.licznik, g.slugi.length, `${strona.slug}: licznik grupy „${g.nazwa}”`);
      const strony = g.slugi.map((slug) => DANE.strony[slug]);
      let oczekiwane;
      if (g.nazwa === 'Sceny') {
        oczekiwane = [...strony].sort((a, b) => epizody.indexOf(a.epizod) - epizody.indexOf(b.epizod)
          || numery(String(a.numer_sceny ?? ''), String(b.numer_sceny ?? '')));
      } else {
        oczekiwane = [...strony].sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));
      }
      assert.deepEqual(g.slugi, oczekiwane.map((p) => p.slug), `${strona.slug}: porządek grupy „${g.nazwa}”`);

      const fabula = g.nazwa === 'Sceny';
      const gry = fabula
        ? [...new Set(strony.map((p) => DANE.strony[p.epizod]?.gra))]
        : [];
      assert.deepEqual(g.podpisyGier, gry.length > 1 ? gry.map((slug) => DANE.strony[slug].tytul) : [],
        `${strona.slug}: podpisy gier w grupie „${g.nazwa}”`);
      if (fabula) fabularnych += g.slugi.length;
      if (gry.length > 1) zKilkuGier += 1;
    }
  }
  assert.ok(fabularnych > 0, 'żadna strona nie ma w „Powiązaniach” scen');
  assert.ok(zKilkuGier > 0, 'żadna lista scen nie obejmuje dwóch gier — podpisy nie są sprawdzone');
});

test('lista „Z tej serii” pochodzi z pola seria, nie powtarza podnagłówków i nie trafia do „Powiązań”', () => {
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
    if (zPola.length > 0) {
      zObsada += 1;
      const blokSerii = m.html.match(/<section class="blok-powiazan">\s*<h2>Z tej serii:[^<]*<\/h2>([\s\S]*?)<\/section>/)?.[1] ?? '';
      assert.doesNotMatch(blokSerii, /<h3>/, `${seria.slug}: lista „Z tej serii” nie dubluje nagłówka podtypu`);
    }

    // Odsyłacz do postaci albo mecha spoza serii nie trafia do „Powiązań” (ADR 0040).
    const obce = wychodzace(seria).filter((slug) => ['postac', 'mech'].includes(DANE.strony[slug].typ) && !zPola.includes(slug));
    for (const slug of obce) {
      assert.ok(!m.powiazania.includes(slug), `${seria.slug}: ${slug} jest postacią/mechem — nie trafia do „Powiązań”`);
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
