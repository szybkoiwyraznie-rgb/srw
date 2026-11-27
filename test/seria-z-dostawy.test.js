/**
 * Postacie i jednostki z dostawy: seria i tożsamość (ADR 0037).
 *
 * Dostawa misji podaje postacie w dwóch miejscach: jako mówców skryptu i na
 * liście uczestników, gdzie każda nazwa ma na twardo wpisaną serię. Testy
 * wyprowadzają oba zestawy z samych plików (`dostawy/`, `episodes/`) i pilnują:
 *
 * - każdy uczestnik ma stronę o nazwie z dostawy, a jej pole `seria` jest tym,
 *   co wpisała dostawa — także wtedy, gdy dostawa serii nie podaje,
 * - załoga z listy jednostek misji (pilot główny i piloci wspierający) stoi
 *   w polu `piloci` mecha, a mech w polu `mechy` każdego z nich,
 * - każdy mówca skryptu prowadzi do strony postaci: przez tytuł, przez imię
 *   albo nazwisko z tytułu, albo przez pole `pseudonim`,
 * - przezwisko jest polem strony pod imieniem i nazwiskiem, a nie osobną stroną.
 *
 * Błąd, przed którym to chroni: mówca „Potato” dostał własną stronę bez serii,
 * choć lista uczestników tej samej dostawy podaje „Orie Ishizuka — Matchless
 * Raijin-Oh”.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony, wczytajSkrypty } from '../tools/content-loader.mjs';
import { serieStrony, pseudonimWGrze, pseudonimyStrony } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';
import {
  porownajZBaza, przypisaniaDostaw, przypisaniaZPliku, normalizujNazwe, RODZAJE_ROZBIEZNOSCI,
  porownajZalogi, zalogiZPliku, zalogiDostaw, rekordBezOsoby, RODZAJE_ROZBIEZNOSCI_ZALOG,
} from '../tools/uczestnicy-dostaw.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strony = wczytajStrony({ root: ROOT });
const postacie = strony.filter((s) => s.typ === 'postac');
const epizody = strony.filter((s) => s.typ === 'epizod');

/** Głosy bez imienia: nie są postaciami i nie mają stron (ADR 0013). */
// Głosy bez imienia: nie są postaciami i nie mają stron (ADR 0013).
// „Obywatel” i „Żołnierz oddziału D2” to zbiorowe role w tłumie i w armii —
// tak samo bezimienne jak transmisja prezenterki.
const GLOSY_BEZIMIENNE = new Set(['???', 'Łączność / Głośnik', 'Prezenter',
  'Obywatel', 'Żołnierz oddziału D2']);

/** Mówcy jednego skryptu: etykiety `**Imię:**`, także w dialogach warunkowych (`> **Imię:**`). */
function mowcySkryptu(tekst) {
  return new Set([...tekst.matchAll(/^\s*>?\s*\*\*([^*\n]+?):\*\*/gm)].map((m) => m[1].trim()));
}

/** Strony postaci danej gry, do których prowadzi etykieta mówcy. */
function stronyMowcy(etykieta, gra) {
  const szukana = normalizujNazwe(etykieta);
  const wGrze = postacie.filter((p) => (p.gry ?? []).includes(gra));
  const poTytule = wGrze.filter((p) => normalizujNazwe(p.tytul) === szukana);
  if (poTytule.length) return poTytule;
  const poPseudonimie = wGrze.filter((p) => {
    const pseudonim = pseudonimWGrze(p, gra);
    return pseudonim && normalizujNazwe(pseudonim) === szukana;
  });
  if (poPseudonimie.length) return poPseudonimie;
  return wGrze.filter((p) => normalizujNazwe(p.tytul).split(' ').includes(szukana));
}

const skrypty = [...wczytajSkrypty({ root: ROOT })].map(([plik, tekst]) => ({
  plik,
  gra: epizody.find((e) => e.skrypt === plik)?.gra,
  mowcy: mowcySkryptu(tekst),
}));

test('parser dostaw czyta przypisania serii z każdej dostawy, która je podaje', () => {
  const katalog = path.join(ROOT, 'dostawy');
  let pliki = 0;
  for (const gra of fs.readdirSync(katalog)) {
    for (const plik of fs.readdirSync(path.join(katalog, gra))) {
      const sciezka = path.join(katalog, gra, plik);
      const tekst = fs.readFileSync(sciezka, 'utf8');
      if (!/\*\*Seria:\*\*/.test(tekst)) continue;
      pliki += 1;
      const wSekcjach = (tekst.match(/\*\*Seria:\*\*/g) ?? []).length;
      const odczytane = przypisaniaZPliku(sciezka).filter((u) => u.rodzaj === 'sekcja').length;
      assert.equal(odczytane, wSekcjach, `${gra}/${plik}: każde „**Seria:**” musi trafić do zestawienia`);
    }
  }
  assert.ok(pliki > 0, 'w dostawach są listy uczestników z serią');
  assert.ok(przypisaniaDostaw({ root: ROOT }).length >= pliki, 'zestawienie nie jest puste');
});

test('seria wpisana w dostawie jest serią strony — dla każdego uczestnika', () => {
  const raport = porownajZBaza({ root: ROOT, strony });
  const opisy = {
    sprzeczne: 'ta sama nazwa ma w dostawach dwie serie',
    nieznanaSeria: 'seria z dostawy nie ma strony',
    brakStrony: 'uczestnik bez strony — załóż ją pod nazwą z dostawy; przezwisko ze skryptu to pole `pseudonim`',
    niejednoznaczne: 'nazwa z dostawy pasuje do kilku stron',
    zlaSeria: 'seria strony różni się od serii z dostawy',
    brakGry: 'strona nie ma gry, której dostawa ją wymienia',
  };
  for (const rodzaj of RODZAJE_ROZBIEZNOSCI) {
    assert.deepEqual(raport[rodzaj], [], `${opisy[rodzaj]} (ADR 0037)`);
  }
  assert.equal(raport.zgodnych, raport.przypisan);
});

test('parser dostaw czyta załogę z każdego wiersza „pilot główny”', () => {
  const katalog = path.join(ROOT, 'dostawy');
  let wierszy = 0;
  let wspierajacych = 0;
  for (const gra of fs.readdirSync(katalog)) {
    for (const plik of fs.readdirSync(path.join(katalog, gra))) {
      const sciezka = path.join(katalog, gra, plik);
      const linie = fs.readFileSync(sciezka, 'utf8').replace(/\r/g, '').split('\n');
      const zalogi = zalogiZPliku(sciezka);
      linie.forEach((linia, i) => {
        if (!/pilot główny:/.test(linia)) return;
        wierszy += 1;
        const zWiersza = zalogi.filter((z) => z.wiersz === i + 1);
        // Wiersz bez osoby („brak”, „???”) nie daje pary; każdy inny daje pilota głównego.
        const bezOsoby = /pilot główny: (?:brak|Brak przypisanego klucza pilota[^—]*|\?+)\s*(?:—|$)/.test(linia);
        assert.equal(zWiersza.filter((z) => z.rola === 'główny').length, bezOsoby ? 0 : 1,
          `${gra}/${plik}:${i + 1}: pilot główny`);
        const lista = linia.match(/piloci wspierający w (?:misji|presecie): ([^—]+)/)?.[1];
        const oczekiwani = lista
          ? lista.split(',').map((x) => x.trim()).filter((x) => x && !/^brak$/i.test(x))
          : [];
        assert.deepEqual(zWiersza.filter((z) => z.rola === 'wspierający').map((z) => z.pilot), oczekiwani,
          `${gra}/${plik}:${i + 1}: piloci wspierający`);
        wspierajacych += oczekiwani.length;
      });
    }
  }
  assert.ok(wierszy > 0, 'dostawy mają listy jednostek z pilotami');
  assert.ok(wspierajacych > 0, 'dostawy mają pilotów wspierających');
});

test('załoga z listy jednostek misji jest załogą strony — pilot główny i piloci wspierający', () => {
  const raport = porownajZalogi({ root: ROOT, strony });
  const opisy = {
    nieznanaJednostka: 'jednostka z listy misji nie ma (jednej) strony mecha',
    nieznanyPilot: 'pilot z listy misji nie ma (jednej) strony postaci',
    brakWPilotach: 'pole `piloci` mecha pomija pilota z dostawy — dopisz także pilotów wspierających',
    brakWMechach: 'pole `mechy` postaci pomija maszynę, którą dostawa jej przypisuje',
    zalogaCelu: 'cel skryptowy („nie jest pilotowanym mechem”) nie ma załogi',
  };
  for (const rodzaj of RODZAJE_ROZBIEZNOSCI_ZALOG) {
    assert.deepEqual(raport[rodzaj], [], `${opisy[rodzaj]} (ADR 0037 pkt 7)`);
  }
  assert.ok(raport.par > 0);
  assert.equal(raport.zgodnych, raport.par);
});

test('rekord pilota o nazwie jednostki (także z przydomkiem) nie daje strony pilota', () => {
  // W SRW Y wrogie maszyny mają w silniku techniczny rekord pilota, którego nazwa
  // powtarza jednostkę: „Insector — pilot główny: Insector”, a dla kaiju podtytuł
  // dokłada się do nazwy — „Shalbandes — pilot główny: Hard Fall Kaiju Shalbandes”.
  // Takie wpisy nie są osobami: mech zostaje z pustym `piloci`, a strona postaci
  // o nazwie rekordu nie powstaje (ADR 0037 pkt 7, L24).
  const rekordy = zalogiDostaw({ root: ROOT }).filter((z) => rekordBezOsoby(z.jednostka, z.pilot));
  assert.ok(rekordy.length > 0, 'dostawy mają rekordy pilota o nazwie jednostki');
  const zPrzydomkiem = rekordy.filter((z) => normalizujNazwe(z.jednostka) !== normalizujNazwe(z.pilot));
  assert.ok(zPrzydomkiem.length > 0, 'wśród nich jest rekord „jednostka + przydomek”');
  for (const rekord of rekordy) {
    const trafione = strony.filter((s) => s.typ === 'postac'
      && normalizujNazwe(s.tytul) === normalizujNazwe(rekord.pilot));
    assert.deepEqual(trafione.map((s) => s.slug), [],
      `„${rekord.pilot}” (${rekord.plik}:${rekord.wiersz}) to techniczny rekord pilota, nie osoba — strony postaci nie zakładamy`);
  }
  assert.deepEqual(strony.find((s) => s.slug === 'shalbandes').piloci, [],
    'Shalbandes: kaiju bez osobowego pilota');
});

test('pilot wpisany w polu piloci ma tę maszynę w polu mechy', () => {
  // Kierunek bez wyjątków: skoro strona mecha podaje pilota, strona pilota podaje mecha.
  // (Odwrotnie nie zawsze: Kuro i Shiro wiążą się z Cybusterem, nie będąc jego załogą.)
  const poSlugu = new Map(strony.map((s) => [s.slug, s]));
  const braki = [];
  for (const mech of strony.filter((s) => s.typ === 'mech')) {
    for (const pilot of mech.piloci ?? []) {
      if (!(poSlugu.get(pilot)?.mechy ?? []).includes(mech.slug)) braki.push(`${pilot}: pole mechy pomija ${mech.slug}`);
    }
  }
  assert.deepEqual(braki, []);
});

test('forma połączona ma załogę maszyny, z której powstaje', () => {
  // Właściciel (2026-11-10): formy połączone mają tę samą załogę, z wyjątkiem
  // God Raijin-Oha, gdzie dochodzi jeszcze Bakuryu-Oh.
  const poSlugu = new Map(strony.map((s) => [s.slug, s]));
  const formy = {
    'god-raijin-oh': { baza: 'raijin-oh', dochodzi: ['bakuryu-oh'] },
    'king-go-saurer': { baza: 'go-saurer', dochodzi: [] },
    'perfect-daiteioh': { baza: 'daiteioh', dochodzi: [] },
    'great-ganbaruger': { baza: 'ganbaruger', dochodzi: [] },
  };
  for (const [forma, { baza, dochodzi }] of Object.entries(formy)) {
    assert.ok(poSlugu.get(baza).piloci.length > 0, `${baza}: załoga`);
    assert.deepEqual(poSlugu.get(forma).piloci, [...poSlugu.get(baza).piloci, ...dochodzi], forma);
  }
  // Każda maszyna ze zdolnością „Połączenie” (nazwa z gry, wielką literą) jest na liście powyżej.
  const zPolaczeniem = strony
    .filter((s) => s.typ === 'mech' && /Połączeni[ae]/.test(`${s.body} ${JSON.stringify(s.w_gre ?? {})}`))
    .map((s) => s.slug);
  const znane = new Set([...Object.keys(formy), ...Object.values(formy).map((f) => f.baza)]);
  assert.ok(zPolaczeniem.length >= 4, 'test rozpoznaje maszyny ze zdolnością Połączenia');
  assert.deepEqual(zPolaczeniem.filter((slug) => !znane.has(slug)), [],
    'maszyna ze zdolnością Połączenia spoza listy form — dopisz ją do testu');
});

test('Szef Suol to pseudonim Suola Douglasa, nie osobna etykieta w teście', () => {
  const suol = postacie.find((p) => p.slug === 'suol');
  assert.equal(suol.tytul, 'Suol Douglas');
  assert.equal(suol.pseudonim, 'Szef Suol');
  assert.deepEqual(stronyMowcy('Szef Suol', 'srw-oe').map((p) => p.slug), ['suol']);
});

test('każdy mówca skryptu prowadzi do strony postaci swojej gry', () => {
  assert.ok(skrypty.length > 0);
  for (const { plik, gra, mowcy } of skrypty) {
    assert.ok(gra, `${plik}: skrypt bez epizodu`);
    for (const etykieta of mowcy) {
      if (GLOSY_BEZIMIENNE.has(etykieta)) continue;
      assert.ok(stronyMowcy(etykieta, gra).length > 0,
        `${plik}: mówca „${etykieta}” nie prowadzi do żadnej strony postaci — strona ma nosić imię i nazwisko z listy uczestników, a przezwisko pole \`pseudonim\` (ADR 0037)`);
    }
  }
});

/** Mówcy, którzy w tej samej dostawie mają też pełną etykietę („Kamui” obok „Show Kamui”). */
function skrotyImion(mowcy) {
  return [...mowcy].filter((etykieta) => !etykieta.includes(' ')
    && [...mowcy].some((inna) => inna !== etykieta && inna.split(' ').includes(etykieta)));
}

test('skrót imienia w skrypcie należy do tej samej postaci co pełna etykieta', () => {
  // L29: w misji 1-3A ta sama osoba mówi jako „Show Kamui” (17 kwestii) i „Kamui” (18).
  // Skrót nie jest pseudonimem ani nową postacią — musi wskazywać tę samą stronę.
  let sprawdzone = 0;
  for (const { plik, gra, mowcy } of skrypty) {
    for (const skrot of skrotyImion(mowcy)) {
      const pelne = [...mowcy].filter((inna) => inna.split(' ').includes(skrot));
      const celSkrotu = stronyMowcy(skrot, gra);
      assert.ok(celSkrotu.length > 0, `${plik}: skrót „${skrot}” nie prowadzi do strony postaci`);
      for (const etykieta of pelne) {
        const cel = stronyMowcy(etykieta, gra);
        assert.deepEqual(cel.map((p) => p.slug), celSkrotu.map((p) => p.slug),
          `${plik}: „${skrot}” i „${etykieta}” muszą wskazywać tę samą postać (L29)`);
        sprawdzone += 1;
      }
    }
  }
  assert.ok(sprawdzone > 0, 'test musi realnie sprawdzać skróty imion');
});

test('bezosobowa rola zbiorowa nie dostaje strony postaci', () => {
  // ADR 0013: „Obywatel” to głos tłumu, nie osoba — mówi w scenach, ale nie ma wpisu.
  for (const etykieta of GLOSY_BEZIMIENNE) {
    const strony = postacie.filter((p) => normalizujNazwe(p.tytul) === normalizujNazwe(etykieta));
    assert.deepEqual(strony.map((p) => p.slug), [],
      `„${etykieta}” to rola zbiorowa — bez strony i bez pseudonimu`);
  }
});

test('każdy mówca w scenie należy do jej obsady i obsady epizodu', () => {
  // Etykieta z katalogu pilota sama nie rozstrzyga tożsamości imienników;
  // przypisanie w obsadzie trzeba także sprawdzić w kontekście sceny.
  const poSlugu = new Map(strony.map((s) => [s.slug, s]));
  const nazwaSkrocona = (p) => {
    const m = p.body.match(/\*\*Nazwa skrócona:\*\*\s*([^\n]+)/);
    return m ? normalizujNazwe(m[1].trim()) : null;
  };
  const dopasuj = (etykieta, gra) => {
    const cel = normalizujNazwe(etykieta);
    const zGry = postacie.filter((p) => (p.gry ?? []).includes(gra));
    const dokladne = zGry.filter((p) =>
      [p.tytul, pseudonimWGrze(p, gra)].some((n) => n && normalizujNazwe(n) === cel)
      || nazwaSkrocona(p) === cel);
    return dokladne.length > 0
      ? dokladne
      : zGry.filter((p) => normalizujNazwe(p.tytul).split(' ').includes(cel));
  };
  const problemy = [];
  for (const scena of strony.filter((s) => s.typ === 'scena')) {
    const epizod = poSlugu.get(scena.epizod);
    const obsadaSceny = new Set(scena.postacie ?? []);
    const obsadaEpizodu = new Set(epizod.postacie ?? []);
    const tekst = [...scena.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]).join('\n');
    const mowcy = new Set([...tekst.matchAll(/^(?:>\s*)?\*\*([^*\n:]+):\*\*/gm)].map((m) => m[1].trim()));
    for (const etykieta of mowcy) {
      if (GLOSY_BEZIMIENNE.has(etykieta)) continue;
      const kandydaci = dopasuj(etykieta, epizod.gra);
      if (!kandydaci.some((k) => obsadaSceny.has(k.slug))) {
        problemy.push(`${scena.slug}: mówca „${etykieta}” poza postacie sceny (${kandydaci.map((k) => k.slug).join(', ')})`);
      }
      if (!kandydaci.some((k) => obsadaEpizodu.has(k.slug))) {
        problemy.push(`${epizod.slug}: mówca „${etykieta}” ze sceny ${scena.slug} poza postacie epizodu`);
      }
    }
  }
  assert.deepEqual(problemy, []);
});

test('strona serii linkuje każdą przypisaną do niej encję w prozie (L16)', () => {
  const braki = [];
  for (const seria of strony.filter((s) => s.typ === 'seria')) {
    for (const encja of strony.filter((s) => serieStrony(s).includes(seria.slug) && s.slug !== seria.slug)) {
      if (!seria.body.includes(`[[${encja.slug}|`) && !seria.body.includes(`[[${encja.slug}]]`)) {
        braki.push(`${seria.slug}: brak wzmianki o ${encja.typ} „${encja.slug}”`);
      }
    }
  }
  assert.deepEqual(braki, []);
});

// Pary (gra, pseudonim) postaci: ogólny `pseudonim` obowiązuje we wszystkich grach
// strony, `pseudonim_w_grze` tylko w swojej (decyzja właściciela o Zero, 2026-11-27).
const parPseudonimow = (p) => (p.gry ?? []).map((gra) => [gra, pseudonimWGrze(p, gra)]).filter(([, n]) => n);

test('pseudonim jest polem strony pod imieniem i nazwiskiem, nie osobną stroną', () => {
  const zPseudonimem = postacie.filter((p) => parPseudonimow(p).length > 0);
  assert.ok(zPseudonimem.length > 0);
  for (const p of zPseudonimem) {
    const gry = p.gry ?? [];
    for (const nazwa of new Set(parPseudonimow(p).map(([, n]) => n))) {
      // Pseudonim pochodzi ze skryptu: pod nim postać mówi w którejś ze swoich gier.
      const gryPseudonimu = parPseudonimow(p).filter(([, n]) => n === nazwa).map(([g]) => g);
      assert.ok(skrypty.some((s) => gryPseudonimu.includes(s.gra) && s.mowcy.has(nazwa)),
        `${p.slug}: pseudonim „${nazwa}” nie jest mówcą w żadnym skrypcie gier [${gryPseudonimu.join(', ')}]`);
      // Tytułem jest pełna nazwa, więc pseudonim nie może być jej częścią ani nią samą.
      assert.ok(!normalizujNazwe(p.tytul).split(' ').includes(normalizujNazwe(nazwa)),
        `${p.slug}: „${nazwa}” to część tytułu „${p.tytul}”, nie pseudonim`);
    }
    // Ten sam pseudonim może nosić kilka osób, ale w jednej grze należy do jednej strony:
    // Zero to Lelouch w SRW OE i Suzaku w SRW Y.
    for (const [gra, nazwa] of parPseudonimow(p)) {
      const sobowtory = postacie.filter((x) => x.slug !== p.slug && (x.gry ?? []).includes(gra)
        && [x.tytul, pseudonimWGrze(x, gra)].some((n) => n && normalizujNazwe(n) === normalizujNazwe(nazwa)));
      assert.deepEqual(sobowtory.map((x) => x.slug), [],
        `${p.slug}: „${nazwa}” ma w grze ${gra} drugą stronę — jedna osoba, jedna strona`);
    }
    assert.ok(gry.length > 0, `${p.slug}: pseudonim bez gry`);
  }
});

test('Zero nie ma własnej strony: to pseudonim Leloucha w SRW OE i Suzaku w SRW Y', () => {
  const bySlug = new Map(strony.map((s) => [s.slug, s]));
  assert.equal(bySlug.has('zero'), false, 'brak osobnej strony Zero');
  const lelouch = bySlug.get('lelouch-vi-britannia');
  const suzaku = bySlug.get('suzaku-kururugi');
  assert.equal(lelouch.typ, 'postac');
  assert.equal(suzaku.typ, 'postac');
  assert.equal(pseudonimWGrze(lelouch, 'srw-oe'), 'Zero');
  assert.equal(pseudonimWGrze(lelouch, 'srw-y'), null, 'w SRW Y Zero to ktoś inny');
  assert.equal(pseudonimWGrze(suzaku, 'srw-y'), 'Zero');
  assert.equal(pseudonimWGrze(suzaku, 'srw-oe'), null);
});

test('pseudonim widać na stronie i na liście postaci, a wyszukiwarka prowadzi po nim do osoby', async () => {
  globalThis.SRW_DATA = await zbudujDane({ root: ROOT });
  const { renderEncja } = await import('../src/srw/render-entity.js');
  const { renderListe } = await import('../src/srw/render-lists.js');
  const { szukaj, renderSzukanie } = await import('../src/srw/render-search.js');
  const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Galeria postaci pokazuje karty dopiero po wybraniu filtra, więc pytamy o grę.
  const listy = new Map();
  const listaGry = (gra) => listy.get(gra) ?? listy.set(gra, renderListe('postac', { gra })).get(gra);
  const wlasciciele = (nazwa) => postacie.filter((x) => pseudonimyStrony(x).some((w) => w.nazwa === nazwa)).map((x) => x.slug);

  for (const p of postacie.filter((x) => pseudonimyStrony(x).length > 0)) {
    const html = renderEncja(p.slug);
    for (const { nazwa, gry } of pseudonimyStrony(p)) {
      const cytat = `„${nazwa}”`;
      assert.ok(html.slice(0, html.indexOf('uklad-strona')).includes(cytat), `${p.slug}: pseudonim w podtytule`);
      assert.match(html, new RegExp(`<dt>Pseudonim</dt>\\s*<dd>[^<]*${escapeRe(nazwa)}`), `${p.slug}: pseudonim w metryce`);
      for (const gra of gry) {
        const tytulGry = strony.find((s) => s.slug === gra)?.tytul;
        assert.ok(html.includes(`${nazwa} (${tytulGry}`), `${p.slug}: metryka mówi, w której grze obowiązuje „${nazwa}”`);
      }
      // Kolejność pola `gry` jest przypadkowa, więc karta musi się pojawić na liście
      // każdego tytułu, w którym obowiązuje pseudonim — nie tylko pod pierwszym wpisem.
      for (const gra of (gry.length ? gry : p.gry)) {
        const karta = listaGry(gra).split('<article').find((k) => k.includes(`href="#/postac/${p.slug}"`));
        assert.ok(karta, `${p.slug}: karta na liście postaci gry ${gra}`);
        assert.ok(karta.includes(cytat), `${p.slug}: pseudonim na karcie listy postaci (${gra})`);
      }
      // Wspólny pseudonim (Zero) prowadzi do jednej z osób, które go noszą, a obie są w wynikach.
      const wyniki = szukaj(nazwa).map((w) => w?.strona?.slug ?? w?.slug);
      const nosiciele = wlasciciele(nazwa);
      assert.ok(nosiciele.includes(wyniki[0]), `szukanie „${nazwa}” zaczyna się od osoby o tym pseudonimie (${nosiciele.join(', ')}), a nie od ${wyniki[0]}`);
      assert.ok(wyniki.includes(p.slug), `szukanie „${nazwa}” znajduje ${p.slug}`);
      assert.match(renderSzukanie(nazwa), new RegExp(`„<mark>${escapeRe(nazwa)}</mark>”`),
        `${p.slug}: pseudonim w wynikach wyszukiwania`);
    }
  }
});
