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
import { podzielScene, zaplanujScene } from '../src/srw/scena-sekcje.js';

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
  for (const slug of ['srw-oe-ep1-black-tri-stars', 'srw-oe-ep1-szalejacy-prototyp-labora']) {
    const html = scena(slug);
    const linki = [...html.matchAll(/class="skok-do-tresci" href="([^"]+)" data-cel="([^"]+)"/g)];
    assert.equal(linki.length, 8, `${slug}: osiem podsekcji analizy z odsyłaczem`);
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

test('scena bez podsekcji analizy nie dostaje odsyłaczy', () => {
  const html = scena('srw-oe-ep0-na-ratunek-white-base');
  assert.doesNotMatch(html, /skok-do-tresci/);
  assert.match(html, /id="sekcja-analiza"/, 'analiza nadal jest w lewej kolumnie');
  assert.match(html, /id="sekcja-tresc"/);
});

test('podział sceny: nagłówki wewnątrz bloku skryptu nie zaczynają sekcji', () => {
  const body = fs.readFileSync(path.join(ROOT, 'content/sceny/srw-oe-ep0-na-ratunek-white-base.md'), 'utf8')
    .split('\n---\n').slice(1).join('\n---\n');
  const sekcje = podzielScene(body).map((s) => s.tytul);
  assert.deepEqual(sekcje, ['Treść sceny', 'Analiza', 'Nawiązania do oryginalnych odcinków', 'Wątki w scenie']);
});

test('plan kotwic zgłasza nieistniejącą podsekcję zamiast ją zgadywać', () => {
  const ciało = `{{skrypt gra=srw-oe\n\n## Treść sceny\n\n### Alfa\n\ntekst\n\n## Analiza\n\n### Beta\n\nopis\n\n## Wątki w scenie\n\n- x\n}}\n`;
  const plan = zaplanujScene(podzielScene(ciało), ['Beta → Gamma']);
  assert.equal(plan.problemy.length, 1);
  assert.match(plan.problemy[0], /nie jest podsekcją treści sceny/);
  assert.equal(plan.linkiAnalizy.size, 0);
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
  const lewa = epizod.slice(glownaE, bocznaE);
  const prawa = epizod.slice(bocznaE);
  assert.match(lewa, /Sceny/, 'lista scen w lewej kolumnie');
  assert.match(prawa, /W tym epizodzie/, 'obsada epizodu w prawej kolumnie');
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
