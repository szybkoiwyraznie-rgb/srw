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
import { zbudujDane } from '../tools/build.mjs';
import {
  porownajZBaza, przypisaniaDostaw, przypisaniaZPliku, normalizujNazwe, RODZAJE_ROZBIEZNOSCI,
  porownajZalogi, zalogiZPliku, RODZAJE_ROZBIEZNOSCI_ZALOG,
} from '../tools/uczestnicy-dostaw.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strony = wczytajStrony({ root: ROOT });
const postacie = strony.filter((s) => s.typ === 'postac');
const epizody = strony.filter((s) => s.typ === 'epizod');

/** Głosy bez imienia: nie są postaciami i nie mają stron (ADR 0013). */
const GLOSY_BEZIMIENNE = new Set(['???', 'Łączność / Głośnik', 'Prezenter']);

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
  const poPseudonimie = wGrze.filter((p) => p.pseudonim && normalizujNazwe(p.pseudonim) === szukana);
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

test('pseudonim jest polem strony pod imieniem i nazwiskiem, nie osobną stroną', () => {
  const zPseudonimem = postacie.filter((p) => p.pseudonim !== undefined);
  assert.ok(zPseudonimem.length > 0);
  for (const p of zPseudonimem) {
    const gry = p.gry ?? [];
    // Pseudonim pochodzi ze skryptu: pod nim postać mówi w którejś ze swoich gier.
    assert.ok(skrypty.some((s) => gry.includes(s.gra) && s.mowcy.has(p.pseudonim)),
      `${p.slug}: pseudonim „${p.pseudonim}” nie jest mówcą w żadnym skrypcie gier [${gry.join(', ')}]`);
    // Tytułem jest pełna nazwa, więc pseudonim nie może być jej częścią ani nią samą.
    assert.ok(!normalizujNazwe(p.tytul).split(' ').includes(normalizujNazwe(p.pseudonim)),
      `${p.slug}: „${p.pseudonim}” to część tytułu „${p.tytul}”, nie pseudonim`);
    for (const gra of gry) {
      const sobowtory = postacie.filter((x) => x.slug !== p.slug && (x.gry ?? []).includes(gra)
        && [x.tytul, x.pseudonim].some((n) => n && normalizujNazwe(n) === normalizujNazwe(p.pseudonim)));
      assert.deepEqual(sobowtory.map((x) => x.slug), [],
        `${p.slug}: „${p.pseudonim}” ma w grze ${gra} drugą stronę — jedna osoba, jedna strona`);
    }
  }
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

  for (const p of postacie.filter((x) => x.pseudonim !== undefined)) {
    const html = renderEncja(p.slug);
    const cytat = `„${p.pseudonim}”`;
    assert.ok(html.slice(0, html.indexOf('uklad-strona')).includes(cytat), `${p.slug}: pseudonim w podtytule`);
    assert.match(html, new RegExp(`<dt>Pseudonim</dt>\\s*<dd>${escapeRe(p.pseudonim)}</dd>`), `${p.slug}: pseudonim w metryce`);
    const karta = listaGry(p.gry[0]).split('<article').find((k) => k.includes(`href="#/postac/${p.slug}"`));
    assert.ok(karta, `${p.slug}: karta na liście postaci gry ${p.gry[0]}`);
    assert.ok(karta.includes(cytat), `${p.slug}: pseudonim na karcie listy postaci`);
    const wyniki = szukaj(p.pseudonim);
    const pierwszy = wyniki[0]?.strona?.slug ?? wyniki[0]?.slug;
    assert.equal(pierwszy, p.slug, `szukanie „${p.pseudonim}” zaczyna się od strony ${p.slug}`);
    assert.match(renderSzukanie(p.pseudonim), new RegExp(`„<mark>${escapeRe(p.pseudonim)}</mark>”`),
      `${p.slug}: pseudonim w wynikach wyszukiwania`);
  }
});
