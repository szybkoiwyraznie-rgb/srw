/**
 * Parzystość dostawy (ADR 0005): każdy skrypt w episodes/ ma wpis epizodu,
 * a każdy wpis epizodu wskazuje istniejący plik.
 *
 * Ten test celowo nie daje się „naprawić" przez rozluźnienie walidacji:
 * czerwony wynik oznacza materiał czekający na przetworzenie.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony, wczytajSkrypty } from '../tools/content-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strony = wczytajStrony({ root: ROOT }).filter((s) => !s.problem);
const skrypty = wczytajSkrypty({ root: ROOT });
const epizody = strony.filter((s) => s.typ === 'epizod');

test('każdy wpis epizodu wskazuje istniejący plik skryptu', () => {
  const problemy = [];
  for (const e of epizody) {
    if (!e.skrypt) { problemy.push(`${e.slug}: brak pola "skrypt"`); continue; }
    if (!skrypty.has(e.skrypt)) problemy.push(`${e.slug}: plik "${e.skrypt}" nie istnieje`);
  }
  assert.deepEqual(problemy, []);
});

test('każdy skrypt ma swój wpis epizodu', () => {
  const uzyte = new Set(epizody.map((e) => e.skrypt).filter(Boolean));
  const sieroty = [...skrypty.keys()].filter((p) => !uzyte.has(p));
  assert.deepEqual(sieroty, [], 'te skrypty czekają na przetworzenie przez agenta');
});

test('skrypty nie są modyfikowane w treści wpisu (rozłączne źródła)', () => {
  for (const e of epizody) {
    const tekst = skrypty.get(e.skrypt);
    if (!tekst) continue;
    assert.ok(tekst.length > 200, `${e.skrypt}: podejrzanie krótki skrypt`);
  }
});
