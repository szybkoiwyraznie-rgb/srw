/**
 * Test integralności bazy — te same reguły, których pilnuje build.
 *
 * Jeśli ten test jest czerwony, build też byłby czerwony: cała różnica
 * polega na tym, że tu widać nazwę reguły, a nie tylko komunikat.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { renderMarkdown } from '../src/srw/markdown.js';
import {
  zbudujRejestr, resolverLinkow, walidujStrone, policzStatystyki, TYPY_STRON,
} from '../src/srw/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const surowe = wczytajStrony({ root: ROOT });
const strony = surowe.filter((s) => !s.problem);
const { bySlug, duplikaty } = zbudujRejestr(strony);

test('każdy plik treści parsuje się bez problemów', () => {
  assert.deepEqual(surowe.filter((s) => s.problem).map((s) => s.problem), []);
  assert.ok(strony.length > 0, 'baza nie może być pusta');
});

test('slugi są unikalne w całej bazie', () => {
  assert.deepEqual(duplikaty, []);
});

test('każda strona przechodzi walidację schematu', () => {
  const problemy = strony.flatMap((s) => walidujStrone(s, { bySlug }));
  assert.deepEqual(problemy, []);
});

test('wszystkie wikilinki prowadzą do istniejących stron', () => {
  const resolver = resolverLinkow(bySlug);
  const problemy = [];
  for (const s of strony) {
    const { problemy: mdProblemy } = renderMarkdown(s.body, { resolveLink: resolver, wymagajPoziomu: true });
    for (const p of mdProblemy) problemy.push(`${s.slug}: ${p}`);
  }
  assert.deepEqual(problemy, []);
});

test('baza zawiera dostawę: grę, epizod, scenę i postacie', () => {
  const statystyki = policzStatystyki(strony);
  for (const typ of ['gra', 'epizod', 'scena', 'postac']) {
    assert.ok(statystyki[typ] > 0, `brak wpisów typu "${typ}"`);
  }
});

test('baza ma realny graf, nie zbiór wysp', () => {
  const statystyki = policzStatystyki(strony);
  assert.ok(statystyki.relacje >= strony.length, 'średnio mniej niż jedno powiązanie na stronę');
});

test('każde źródło zadeklarowane w zrodla jest linkiem przy danych w treści', () => {
  // ADR 0012: źródło stoi przy informacji, którą potwierdza, a nie w osobnej sekcji.
  for (const s of strony) {
    for (const url of s.zrodla ?? []) {
      assert.ok(s.body.includes(url), `${s.slug}: źródło ${url} nie jest podane przy żadnej informacji w treści`);
    }
  }
});

test('każdy link w bloku zrodlo jest zadeklarowany w zrodla', () => {
  // Pilnujemy też kierunku odwrotnego: metadane nie mogą pomijać źródła
  // faktycznie użytego przy danych. Wystarczy sprawdzić początek każdego URL-a,
  // dzięki czemu ścieżki zawierające nawiasy nie wymagają osobnego parsera Markdown.
  const problemy = [];
  for (const s of strony) {
    const deklarowane = s.zrodla ?? [];
    const bloki = s.body.match(/^\{\{zrodlo(?:\s+[^\n]*)?\n[\s\S]*?^\}\}$/gm) ?? [];
    for (const blok of bloki) {
      for (const m of blok.matchAll(/https?:\/\//g)) {
        const zadeklarowane = deklarowane.some((url) => {
          if (!blok.startsWith(url, m.index)) return false;
          const nastepnyZnak = blok[m.index + url.length];
          return nastepnyZnak === ')' || nastepnyZnak === undefined || /\s/.test(nastepnyZnak);
        });
        if (!zadeklarowane) {
          const fragment = blok.slice(m.index, m.index + 80).split(/\s/)[0];
          problemy.push(`${s.slug}: niezadeklarowane źródło ${fragment}`);
        }
      }
    }
  }
  assert.deepEqual(problemy, []);
});

test('epizod wymienia całą obsadę i wszystkie maszyny swoich scen', () => {
  // Scena jest częścią epizodu, więc kto gra w scenie, ten gra w epizodzie.
  // Bez tej reguły postać znika z list i filtrów epizodu (tak wypadł Control AI
  // z misji 1-4, choć sterował stojącymi tam Brockenami).
  const sceny = strony.filter((s) => s.typ === 'scena');
  const braki = [];
  for (const e of strony.filter((s) => s.typ === 'epizod')) {
    const moje = sceny.filter((s) => s.epizod === e.slug);
    for (const pole of ['postacie', 'mechy']) {
      const wEpizodzie = new Set(e[pole] ?? []);
      for (const slug of new Set(moje.flatMap((s) => s[pole] ?? []))) {
        if (!wEpizodzie.has(slug)) braki.push(`${e.slug}: brak ${slug} w polu ${pole}`);
      }
    }
  }
  assert.deepEqual(braki, []);
});
