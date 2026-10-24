/**
 * ADR 0009: zewnętrzny odsyłacz w treści to źródło sprawdzone, więc linia,
 * która go niesie, musi mieć znacznik „sprawdzono RRRR-MM-DD”. Adresy ilustracji
 * z bucketu R2 to zasoby graficzne, nie źródła — nie podlegają tej regule.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony } from '../tools/content-loader.mjs';

const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
const hostIlustracji = new URL(manifest.baseUrl).host;

test('każdy tekstowy odsyłacz zewnętrzny ma na swojej linii datę sprawdzenia (ADR 0009)', () => {
  const problemy = [];
  for (const page of wczytajStrony()) {
    page.body.split('\n').forEach((linia, indeks) => {
      const linki = [...linia.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
      const zrodlowe = linki.filter((url) => new URL(url).host !== hostIlustracji);
      if (zrodlowe.length && !/sprawdzono \d{4}-\d{2}-\d{2}/.test(linia)) {
        problemy.push(`${page.slug}:${indeks + 1} -> ${zrodlowe.join(', ')}`);
      }
    });
  }
  assert.deepEqual(problemy, []);
});
