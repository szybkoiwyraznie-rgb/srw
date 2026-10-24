/**
 * Nawiązania scen do oryginalnych odcinków (decyzja właściciela 2026-10-22).
 *
 * Scena, która odwołuje się do konkretnego odcinka serialu albo rozdziału mangi,
 * trzyma to odwołanie w osobnym bloku `## Nawiązania do oryginalnych odcinków`
 * między `## Analiza` a `## Wątki w scenie`. Blok jest fragmentem `{{zrodlo}}`,
 * a użyte adresy są zadeklarowane we frontmatterze `zrodla` (ADR 0009).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const sceny = pages.filter((p) => p.typ === 'scena');
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const NAGLOWEK = '## Nawiązania do oryginalnych odcinków';

/**
 * Sekcje h2 ciała strony wraz z poziomem bloku, w którym stoją.
 * Linie wewnątrz `:::skrypt` są dosłownym skryptem — nie liczą się jako sekcje.
 */
function sekcje(body) {
  const out = [];
  let poziom = null;
  let wSkrypcie = false;
  let biezaca = null;
  for (const linia of body.split('\n')) {
    if (/^:::/.test(linia.trim())) {
      wSkrypcie = !wSkrypcie;
      continue;
    }
    if (wSkrypcie) continue;
    const otwarcie = linia.trim().match(/^\{\{(\w+)/);
    if (otwarcie) {
      poziom = otwarcie[1];
      continue;
    }
    if (linia.trim() === '}}') {
      poziom = null;
      continue;
    }
    const h = linia.match(/^##\s+(.+)$/);
    if (h) {
      biezaca = { tytul: h[1].trim(), poziom, tresc: [] };
      out.push(biezaca);
      continue;
    }
    if (biezaca) biezaca.tresc.push(linia);
  }
  return out;
}

const zNawiazaniami = sceny.filter((s) => s.body.includes(NAGLOWEK));

test('nawiązania stoją w osobnym bloku źródła między analizą a wątkami sceny', () => {
  assert.ok(zNawiazaniami.length >= 6, 'sceny odwołujące się do odcinków mają blok nawiązań');
  // Żadna scena nie może użyć wariantowego nagłówka (np. „Nawiązania do pierwowzoru”),
  // bo render-scene.js przenosi do prawej kolumny wyłącznie dokładny tytuł sekcji.
  for (const s of sceny) {
    for (const sekcja of sekcje(s.body)) {
      if (sekcja.poziom === 'zrodlo' || /^Nawiązania\b/i.test(sekcja.tytul)) {
        assert.equal(sekcja.tytul, 'Nawiązania do oryginalnych odcinków',
          `${s.slug}: sekcja źródłowa w scenie musi nosić tytuł „Nawiązania do oryginalnych odcinków”`);
      }
    }
  }
  for (const s of zNawiazaniami) {
    const lista = sekcje(s.body);
    const tytuly = lista.map((x) => x.tytul);
    const sekcja = lista.find((x) => x.tytul === 'Nawiązania do oryginalnych odcinków');
    assert.ok(sekcja, `${s.slug}: brak sekcji h2 z nawiązaniami`);
    assert.ok(tytuly.indexOf('Analiza') < tytuly.indexOf('Nawiązania do oryginalnych odcinków'),
      `${s.slug}: nawiązania muszą stać po analizie`);
    assert.ok(tytuly.indexOf('Nawiązania do oryginalnych odcinków') < tytuly.indexOf('Wątki w scenie'),
      `${s.slug}: nawiązania muszą stać przed wątkami`);
    assert.equal(sekcja.poziom, 'zrodlo', `${s.slug}: blok nawiązań musi być fragmentem {{zrodlo}}`);
    assert.match(sekcja.tresc.join('\n'), /^Wydarzenia z tej sceny/m,
      `${s.slug}: blok zaczyna się od zdania wiążącego scenę z odcinkiem`);
  }
});

test('każdy adres z bloku nawiązań jest zadeklarowany w zrodla', () => {
  for (const s of zNawiazaniami) {
    const tresc = sekcje(s.body).find((x) => x.tytul === 'Nawiązania do oryginalnych odcinków').tresc.join('\n');
    const adresy = [...tresc.matchAll(/\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
    assert.ok(adresy.length > 0, `${s.slug}: blok nawiązań podaje adres źródła`);
    for (const url of adresy) {
      assert.ok((s.zrodla ?? []).includes(url), `${s.slug}: ${url} poza frontmatterem zrodla (ADR 0009)`);
    }
  }
});

test('sceny z nawiązaniami wskazują właściwe odcinki oryginałów', () => {
  const oczekiwane = [
    ['srw-oe-ep0-na-ratunek-white-base', /pierwszego odcinka/, /Gundam Rising/, 'https://gundam.fandom.com/wiki/Gundam_Rising'],
    ['srw-oe-ep1-szalejacy-prototyp-labora', /piątego odcinka/, /Runaway Labor X-10/, 'https://patlabor.fandom.com/wiki/Runaway_Labor_X-10!'],
    ['srw-oe-ep1-black-tri-stars', /dwudziestego czwartego odcinka/, /Black Tri-Star/, 'https://gundam.fandom.com/wiki/Black_Tri-Star'],
    ['srw-oe-ep1-szalejacy-labor-powraca', /dwudziestego ósmego odcinka/, /Suspicious Duo/, 'https://patlabor.fandom.com/wiki/Suspicious_Duo'],
  ];
  for (const [slug, odcinek, tytul, url] of oczekiwane) {
    const s = bySlug.get(slug);
    assert.ok(s, `${slug}: brak sceny`);
    assert.match(s.body, odcinek, `${slug}: numer odcinka`);
    assert.match(s.body, tytul, `${slug}: tytuł odcinka`);
    assert.ok((s.zrodla ?? []).includes(url), `${slug}: źródło odcinka w zrodla`);
  }

  const scenaPoczatkowa = bySlug.get('srw-oe-ep0-na-ratunek-white-base');
  assert.match(scenaPoczatkowa.body, /drugiego odcinka/, 'scena 0-2: również odcinek 2');
  assert.match(scenaPoczatkowa.body, /Destroy Gundam/, 'scena 0-2: tytuł odcinka 2');
  assert.ok(scenaPoczatkowa.zrodla.includes('https://gundam.fandom.com/wiki/Destroy_Gundam'),
    'scena 0-2: źródło odcinka 2 w zrodla');
});

test('scena bez nawiązań nie dostaje pustego bloku', () => {
  const prolog = bySlug.get('prolog-i-trening-w-connect');
  assert.ok(prolog, 'brak sceny prologu');
  assert.ok(!prolog.body.includes(NAGLOWEK), 'prolog nie odtwarza konkretnych odcinków — bez bloku nawiązań');
  assert.equal(prolog.zrodla, undefined, 'prolog nie deklaruje źródeł zewnętrznych');
});
