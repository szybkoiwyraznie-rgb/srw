/**
 * Testy podglądu ilustracji: obraz w treści ma być przyciskiem, a szkielet
 * witryny — zawierać okno, które wypełnia ekran po kliknięciu.
 *
 * Zachowanie okna (otwieranie, nawigacja, zamykanie) zależy od DOM, którego
 * testy w Node nie mają. Sprawdzamy więc kontrakt znaczników oraz czyste
 * funkcje licznika i nawigacji; resztę pokrywa przeglądarka.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });

const { renderEncja } = await import('../src/srw/render-entity.js');
const { podepnijPodglad, opisLicznika, przesunIndeks } = await import('../src/srw/podglad.js');

test('licznik podglądu pokazuje pozycję tylko przy wielu ilustracjach', () => {
  assert.equal(opisLicznika(0, 1), '');
  assert.equal(opisLicznika(0, 0), '');
  assert.equal(opisLicznika(0, 3), '1 z 3');
  assert.equal(opisLicznika(2, 3), '3 z 3');
});

test('nawigacja podglądu zawija się na obu końcach', () => {
  assert.equal(przesunIndeks(0, 3, -1), 2);
  assert.equal(przesunIndeks(2, 3, 1), 0);
  assert.equal(przesunIndeks(1, 3, 1), 2);
  assert.equal(przesunIndeks(0, 0, 1), 0);
});

test('każdy obraz w treści jest przyciskiem otwierającym pełny ekran', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'media/ilustracje.json'), 'utf8'));
  for (const slug of Object.keys(manifest.encje)) {
    const html = renderEncja(slug);
    const obrazow = (html.match(/<img /g) ?? []).length;
    const otwieraczy = (html.match(/<button[^>]*data-pelny-ekran[^>]*><img /g) ?? []).length;
    assert.ok(obrazow > 0, `${slug}: brak ilustracji w treści`);
    assert.equal(otwieraczy, obrazow, `${slug}: każdy obraz ma otwieracz, żaden nie stoi sam`);
    assert.match(html, /class="ilustracja-otworz"/);
    assert.match(html, /loading="lazy"/);
    assert.match(html, /alt="[^"]+"/, `${slug}: obraz ma tekst alternatywny dla podpisu`);
  }
});

test('szkielet witryny zawiera okno podglądu bez wczytanego obrazu', () => {
  const shell = fs.readFileSync(path.join(ROOT, 'src/srw/index.html'), 'utf8');
  assert.match(shell, /<dialog class="podglad" id="podglad" aria-label="Podgląd ilustracji">/);
  for (const hook of [
    'data-licznik', 'data-pelny', 'data-zamknij', 'data-scena',
    'data-poprzednia', 'data-obraz', 'data-nastepna', 'data-podpis',
  ]) {
    assert.ok(shell.includes(hook), `brak haka ${hook} w oknie podglądu`);
  }
  assert.match(shell, /<img class="podglad-obraz" data-obraz alt="">/);
  assert.ok(!/<img[^>]*data-obraz[^>]*\ssrc=/.test(shell), 'okno nie może wczytywać obrazu przed otwarciem');
});

test('podpięcie podglądu jest bezpieczne bez dokumentu i bez okna', () => {
  assert.equal(podepnijPodglad(null), null);
  assert.equal(podepnijPodglad({ getElementById: () => null }), null);
});
