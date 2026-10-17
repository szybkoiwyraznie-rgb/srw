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
