/**
 * Układ dwukolumnowy stron (3/4 + 1/4) — decyzja właściciela 2026-10-22.
 *
 * Scena: analiza i treść w lewej kolumnie, obsada, nawiązania i wątki w prawej.
 * Ten sam układ mają epizody i encje: treść w lewej, metryka i powiązania w prawej.
 * Podsekcje analizy prowadzą do miejsc treści sceny przez kotwice `tresc-…`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';
import { renderMarkdown } from '../src/srw/markdown.js';
import { podzielScene, zaplanujScene, kotwiceSekcji } from '../src/srw/scena-sekcje.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });

const { renderScena } = await import('../src/srw/render-scene.js');
const { renderEncja } = await import('../src/srw/render-entity.js');
const { renderEpizod } = await import('../src/srw/render-episode.js');

const css = fs.readFileSync(path.join(ROOT, 'src/srw/style.css'), 'utf8');

const scena = (slug) => renderScena(slug);
const kolejnosc = (html, wzorce) => wzorce.map((w) => {
  const i = html.indexOf(w);
  assert.ok(i >= 0, `brak ${w}`);
  return i;
});

test('dane stron przechowują jedną wyrenderowaną reprezentację treści', () => {
  const strony = Object.values(globalThis.SRW_DATA.strony);
  for (const s of strony) {
    if (s.typ === 'scena') {
      assert.ok(Array.isArray(s.sekcje) && s.sekcje.length > 0, `${s.slug}: sekcje sceny`);
      assert.equal(Object.hasOwn(s, 'html'), false, `${s.slug}: bez powtórzonego pełnego HTML`);
    } else if (s.typ === 'epizod') {
      assert.ok(Array.isArray(s.boksy) && s.boksy.length > 0, `${s.slug}: boksy epizodu`);
      assert.equal(Object.hasOwn(s, 'html'), false, `${s.slug}: bez powtórzonego pełnego HTML`);
    } else {
      assert.equal(typeof s.html, 'string', `${s.slug}: encja zachowuje pojedynczy HTML`);
    }
  }
});

test('renderery scen i epizodów zachowują zgodność ze starszym pełnym HTML', (t) => {
  const strony = globalThis.SRW_DATA.strony;
  const scenaSlug = 'srw-oe-ep1-black-tri-stars';
  const epizodSlug = 'srw-oe-ep1';
  const staraScena = strony[scenaSlug];
  const staryEpizod = strony[epizodSlug];
  strony[scenaSlug] = { ...staraScena, sekcje: undefined, html: '<p>Starsza treść sceny</p>' };
  strony[epizodSlug] = { ...staryEpizod, boksy: undefined, html: '<p>Starsza treść epizodu</p>' };
  t.after(() => {
    strony[scenaSlug] = staraScena;
    strony[epizodSlug] = staryEpizod;
  });

  assert.match(renderScena(scenaSlug), /Starsza treść sceny/);
  assert.match(renderEpizod(epizodSlug), /Starsza treść epizodu/);
});

test('scena: analiza i treść w lewej kolumnie, obsada i nawiązania w prawej', () => {
  const html = scena('srw-oe-ep1-black-tri-stars');
  assert.match(html, /class="uklad-strona"/);
  assert.match(html, /class="kolumna-glowna/);
  assert.match(html, /class="kolumna-boczna"/);

  const [glowna, analiza, trescS, boczna, obsada, nawiazania, watki] = kolejnosc(html, [
    'class="kolumna-glowna', 'id="sekcja-analiza"', 'id="sekcja-tresc"',
    'class="kolumna-boczna"', 'class="panel-boczny"', 'id="sekcja-nawiazania"', 'id="sekcja-watki"',
  ]);
  assert.ok(glowna < analiza && analiza < trescS, 'w lewej kolumnie analiza przed treścią');
  assert.ok(trescS < boczna, 'prawa kolumna zaczyna się po lewej');
  assert.ok(boczna < obsada && obsada < nawiazania && nawiazania < watki,
    'w prawej kolumnie: obsada, nawiązania, wątki');

  // Obsada to lista linków, tak jak wcześniej na górze strony.
  assert.match(html.slice(obsada, nawiazania), /<dt>Postacie<\/dt>/);
  assert.match(html.slice(obsada, nawiazania), /<dt>Mechy<\/dt>/);
  assert.match(html.slice(obsada, nawiazania), /<dt>Hasła<\/dt>/);
});

test('scena: każda podsekcja analizy linkuje do istniejącej kotwicy w treści', () => {
  const oczekiwane = [
    ['srw-oe-ep1-black-tri-stars', 8],
    ['srw-oe-ep1-szalejacy-prototyp-labora', 8],
    ['prolog-i-trening-w-connect', 5],
    ['srw-oe-ep0-na-ratunek-white-base', 6],
  ];
  for (const [slug, ile] of oczekiwane) {
    const html = scena(slug);
    const linki = [...html.matchAll(/class="skok-do-tresci" href="([^"]+)" data-cel="([^"]+)"/g)];
    assert.equal(linki.length, ile, `${slug}: ${ile} podsekcji analizy z odsyłaczem`);
    for (const [, href, cel] of linki) {
      assert.equal(href, `#/scena/${slug}`, `${slug}: odsyłacz wskazuje stronę sceny, nie trasę kotwicy`);
      assert.ok(html.includes(`id="${cel}"`), `${slug}: brak kotwicy ${cel}`);
    }
    const idki = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(idki).size, idki.length, `${slug}: identyfikatory unikalne`);
  }
});

test('scena: podsekcje treści mają własne nagłówki-kotwice', () => {
  const html = scena('srw-oe-ep1-szalejacy-prototyp-labora');
  for (const id of ['tresc-stacja-connect-okolice-ziemi', 'tresc-patlabor', 'tresc-ostra-amunicja', 'tresc-nastepstwa']) {
    assert.match(html, new RegExp(`<h3 id="${id}">`), `kotwica ${id}`);
  }
});

test('scena z podsekcją analizy wymaga kompletnej mapy', () => {
  const ciało = `{{skrypt gra=srw-oe\n\n## Treść sceny\n\n### Alfa\n\ntekst\n\n## Analiza\n\n### Beta\n\nopis\n\n## Wątki w scenie\n\n- x\n}}\n`;
  const plan = zaplanujScene(podzielScene(ciało));
  assert.equal(plan.problemy.length, 1);
  assert.match(plan.problemy[0], /„Beta”.*nie ma mapowania/);
  assert.equal(plan.linkiAnalizy.size, 0);

  const html = scena('srw-oe-ep1-szalejacy-prototyp-labora');
  assert.match(html, /id="sekcja-analiza"/, 'analiza jest w lewej kolumnie');
  assert.match(html, /id="sekcja-tresc"/);
});

test('powtórzone sekcje i tytuły analizy dostają odrębne kotwice', () => {
  const ciało = `{{skrypt gra=srw-oe\n\n## Treść sceny\n\n### Etap\n\npierwszy\n\n## Treść sceny\n\n### Etap\n\ndrugi\n\n## Analiza\n\n### Powtórka\n\npierwsza\n\n## Analiza\n\n### Powtórka\n\ndruga\n}}\n`;
  const czesci = podzielScene(ciało);
  const plan = zaplanujScene(czesci, [
    'Powtórka → Etap',
    'Powtórka → Etap',
  ]);
  assert.deepEqual(plan.problemy, []);
  assert.equal(plan.kotwiceAnalizy.size, 2, 'każde wystąpienie analizy ma własną kotwicę');
  assert.equal(plan.linkiAnalizy.size, 2, 'każde wystąpienie analizy ma własny cel');
  assert.equal(new Set(plan.kotwiceAnalizy.values()).size, 2, 'identyfikatory analizy są unikalne');
  assert.equal(new Set(plan.linkiAnalizy.values()).size, 2, 'cele w treści są unikalne');

  const stan = {};
  const html = czesci.map((cz) => renderMarkdown(
    `${cz.otwarcie}\n\n## ${cz.tytul}\n\n${cz.tresc}\n\n}}`,
    { atrybutyNaglowka: kotwiceSekcji(cz.tytul, plan, { stan }) },
  ).html).join('\n');
  for (const id of ['analiza-powtorka', 'analiza-powtorka-2', 'tresc-etap', 'tresc-etap-2']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) ?? []).length, 1, `${id}: dokładnie raz`);
  }
  assert.match(html, /data-cel="tresc-etap"/);
  assert.match(html, /data-cel="tresc-etap-2"/);
});

test('scena zachowuje dodatkowe i powtórzone sekcje zamiast je nadpisywać', (t) => {
  const strony = globalThis.SRW_DATA.strony;
  const slug = 'srw-oe-ep1-black-tri-stars';
  const oryginal = strony[slug];
  strony[slug] = {
    ...oryginal,
    sekcje: [
      { tytul: 'Treść sceny', html: '<h2>Treść sceny</h2><p>Treść główna</p>' },
      { tytul: 'Analiza', html: '<h2>Analiza</h2><p>Analiza główna</p>' },
      { tytul: 'Dodatkowe uwagi', html: '<h2>Dodatkowe uwagi</h2><p>Pierwsza uwaga</p>' },
      { tytul: 'Dodatkowe uwagi', html: '<h2>Dodatkowe uwagi</h2><p>Druga uwaga</p>' },
      { tytul: 'Wątki w scenie', html: '<h2>Wątki w scenie</h2><p>Wątek</p>' },
    ],
  };
  t.after(() => { strony[slug] = oryginal; });

  const html = scena(slug);
  assert.match(html, /Pierwsza uwaga/);
  assert.match(html, /Druga uwaga/);
  assert.match(html, /id="sekcja-dodatkowe-uwagi"/);
  assert.match(html, /id="sekcja-dodatkowe-uwagi-2"/);
  const lewa = html.slice(html.indexOf('class="kolumna-glowna'), html.indexOf('class="kolumna-boczna"'));
  assert.match(lewa, /Pierwsza uwaga/);
  assert.match(lewa, /Druga uwaga/);
});

test('podział sceny: nagłówki wewnątrz bloku skryptu nie zaczynają sekcji', () => {
  const body = fs.readFileSync(path.join(ROOT, 'content/sceny/srw-oe-ep0-na-ratunek-white-base.md'), 'utf8')
    .split('\n---\n').slice(1).join('\n---\n');
  const sekcje = podzielScene(body).map((s) => s.tytul);
  assert.deepEqual(sekcje, ['Treść sceny', 'Analiza', 'Nawiązania do oryginalnych odcinków', 'Wątki w scenie']);
});

test('plan kotwic zgłasza nieistniejący cel i nadmiar mapowań zamiast je zgadywać', () => {
  const ciało = `{{skrypt gra=srw-oe\n\n## Treść sceny\n\n### Alfa\n\ntekst\n\n## Analiza\n\n### Beta\n\nopis\n\n## Wątki w scenie\n\n- x\n}}\n`;
  const czesci = podzielScene(ciało);
  const zlyCel = zaplanujScene(czesci, ['Beta → Gamma']);
  assert.equal(zlyCel.problemy.length, 1);
  assert.match(zlyCel.problemy[0], /nie jest podsekcją treści sceny/);
  assert.equal(zlyCel.linkiAnalizy.size, 0);

  const nadmiar = zaplanujScene(czesci, ['Beta → Alfa', 'Beta → Alfa']);
  assert.equal(nadmiar.problemy.length, 1);
  assert.match(nadmiar.problemy[0], /wskazano częściej, niż występuje w analizie/);
});

test('encje i epizody mają ten sam układ dwukolumnowy', () => {
  const postac = renderEncja('seishiro');
  const [glowna, boczna] = kolejnosc(postac, ['class="kolumna-glowna', 'class="kolumna-boczna']);
  assert.ok(glowna < boczna);
  assert.match(postac, /class="panel-boczny"/, 'metryka w prawym boksie');
  assert.match(postac.slice(boczna), /Powiązania/);
  assert.match(postac.slice(boczna), /Wymienione w/);
  assert.doesNotMatch(postac.slice(0, boczna), /<h2>Powiązania<\/h2>/, 'powiązania nie dublują się w treści');

  const epizod = renderEpizod('srw-oe-ep1');
  const [glownaE, bocznaE] = kolejnosc(epizod, ['class="kolumna-glowna', 'class="kolumna-boczna']);
  assert.ok(glownaE < bocznaE);
  const prawa = epizod.slice(bocznaE);
  assert.match(prawa, /W tym epizodzie/, 'obsada zostaje w prawej kolumnie');
  assert.doesNotMatch(prawa, /<h2>Sceny<\/h2>/, 'lista scen nie wraca do wąskiej kolumny');
});

test('epizod: sceny stoją na górze, na pełną szerokość', () => {
  const epizod = renderEpizod('srw-oe-ep1');
  const [sceny, uklad] = kolejnosc(epizod, ['blok-sceny-pelna', 'class="uklad-strona"']);
  assert.ok(sceny < uklad, 'sekcja scen jest przed układem dwukolumnowym');
  assert.match(epizod, /lista-scen-siatka/, 'sceny układają się w siatkę, nie w słupek');
  assert.equal((epizod.match(/<h2>Sceny<\/h2>/g) ?? []).length, 1, 'jedna lista scen na stronie');
  assert.match(css, /\.blok-sceny-pelna \{/, 'styl pełnej szerokości istnieje');

  // Boks „Treść epizodu” zniknął razem z kopią skryptu w danych strony.
  assert.doesNotMatch(epizod, /panel-skryptu/);
  for (const s of Object.values(globalThis.SRW_DATA.strony)) {
    assert.equal(Object.hasOwn(s, 'skryptTekst'), false, `${s.slug}: artefakt bez kopii skryptu`);
  }
});

test('epizod 1: nagłówki misji prowadzą do stron scen', () => {
  const epizod = renderEpizod('srw-oe-ep1');
  const oczekiwane = [
    ['srw-oe-ep1-szalejacy-prototyp-labora', 'Misja 1: Szalejący prototyp Labora'],
    ['srw-oe-ep1-black-tri-stars', 'Misja 2: Black Tri-Stars'],
    ['srw-oe-ep1-powstrzymaj-pocisk-termojadrowy', 'Misja 3: Powstrzymaj pocisk termojądrowy'],
    ['srw-oe-ep1-trening-klasy-obrony', 'Misja 4: Trening Klasy Obrony'],
    ['srw-oe-ep1-start-alexa', 'Misja 5: Start Alexa'],
  ];
  for (const [slug, tytul] of oczekiwane) {
    const wzor = new RegExp(`<h3><a href="#/scena/${slug}"[^>]*>${tytul.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</a></h3>`);
    assert.match(epizod, wzor, `nagłówek „${tytul}” prowadzi do sceny`);
  }
});

test('epizod: streszczenie, wątki i komentarz mają osobne boksy', () => {
  const html = renderEpizod('srw-oe-ep0');
  const boksy = [...html.matchAll(/<section class="sekcja-strony">\s*<div class="fragment[^"]*"[^>]*>\s*<div class="naglowek-fragmentu"><h2>([^<]+)<\/h2>/g)]
    .map((m) => m[1]);
  assert.deepEqual(boksy, ['Streszczenie', 'Wątki fabularne', 'Komentarz', 'Postacie i maszyny', 'Inne źródła i rozbieżności']);

  // Blok wiedzy bez nagłówka też jest własnym boksem — nie dokleja się do sąsiada.
  assert.equal((html.match(/class="sekcja-strony"/g) ?? []).length, 6);

  // Tabela wątków ma cztery kolumny, tak jak nagłówek — pionek w wikilinku nie dzieli wiersza.
  const tabela = html.slice(html.indexOf('<table'), html.indexOf('</table>'));
  assert.equal((tabela.match(/<th>/g) ?? []).length, 4);
  const wiersz = tabela.split('</tr>')[1] ?? '';
  assert.equal((wiersz.match(/<td>/g) ?? []).length, 4, 'wiersz tabeli nie rozjeżdża się');
});

test('epizod: nawiązania są częścią boksy „Postacie i maszyny”, nie osobna', () => {
  const html = renderEpizod('srw-oe-ep0');
  assert.equal((html.match(/<h2>Nawiązania<\/h2>/g) ?? []).length, 0, 'brak osobnego boksy');
  assert.equal((html.match(/<h2>Postacie i maszyny<\/h2>/g) ?? []).length, 1);
  assert.match(html, /<h3>Nawiązania<\/h3>/, 'nawiązania jako podsekcja w boksie');
});

test('encje: opis, ilustracje i parametry w osobnych boksach, we właściwej kolejności', () => {
  const encje = Object.values(globalThis.SRW_DATA.strony).filter((s) => s.typ === 'mech' || s.typ === 'postac');
  assert.ok(encje.length > 40, 'baza ma encje obu typów');
  for (const p of encje) {
    const html = renderEncja(p.slug);
    const kawalki = html.split('<div class="fragment');
    const boks = (tytul) => kawalki.findIndex((k) => k.includes(`<h2>${tytul}</h2>`));
    const [opis, ilustracje, parametry] = ['Opis', 'Ilustracje', 'Parametry'].map(boks);
    assert.ok(opis >= 0, `${p.slug}: brak opisu`);
    assert.notEqual(opis, parametry, `${p.slug}: opis i parametry nie dzielą boksy`);
    if (ilustracje >= 0 && parametry >= 0) {
      assert.ok(opis < ilustracje && ilustracje < parametry,
        `${p.slug}: kolejność opis → ilustracje → parametry`);
    }
  }
});

test('arkusz stylów: 3/4 + 1/4, brak pustego pasa nad stopką', () => {
  const uklad = css.match(/\.uklad-strona \{[^}]*\}/)[0];
  assert.match(uklad, /grid-template-columns:\s*minmax\(0,\s*3fr\)\s*minmax\(0,\s*1fr\)/);
  const tresc = css.match(/^\.tresc \{[^}]*\}/m)[0];
  const dol = Number(tresc.match(/padding:[^;]*?(\d+)px;/)?.[1]);
  assert.ok(dol <= 32, `dolny padding treści ${dol}px nie tworzy pustego pasa`);
  const stopka = css.match(/\.stopka \{[^}]*\}/)[0];
  const margines = Number(stopka.match(/margin-top:\s*(\d+)px/)?.[1]);
  assert.ok(margines <= 30, `margines stopki ${margines}px jest niewielki`);
});

test('plakietka zakresu gry stoi w wierszu tytułu sekcji, nie nad nim', () => {
  const epizod = renderEpizod('srw-oe-ep0');
  assert.match(
    epizod,
    /<div class="naglowek-fragmentu"><h2>Streszczenie<\/h2><p class="zakres-gry"><a href="#\/gra\/srw-oe">Super Robot Wars OE<\/a><\/p><\/div>/,
    'tytuł i plakietka w jednym wierszu',
  );

  // Żaden boks z nagłówkiem nie zaczyna się już od samotnej plakietki.
  const encja = renderEncja('cybuster');
  const scena = renderScena('prolog-i-trening-w-connect');
  for (const html of [epizod, encja, scena]) {
    assert.doesNotMatch(html, /<p class="zakres-gry">[\s\S]{0,160}?<\/p>\n<h[234]/, 'plakietka nie zajmuje osobnego wiersza nad tytułem');
  }

  // Fragment bez nagłówka nie ma z czym zestawić etykiety — zostaje nad treścią.
  assert.match(epizod, /<div class="fragment poziom poziom-wiedza"[^>]*>\n<p class="zakres-gry">/);

  assert.match(css, /\.naglowek-fragmentu \{/, 'styl wspólnego wiersza istnieje');
  assert.match(css, /\.naglowek-fragmentu > \.zakres-gry \{/);
});
