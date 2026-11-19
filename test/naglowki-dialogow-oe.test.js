import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { bezEtykietDialogow } from './helpers/skrypt-oe.js';

test('logi i strony scen OE nie publikują etykiet dialogów z dostaw', () => {
  for (const [folder, pliki] of [['episodes/srw-oe', /^ep\d+\.md$/], ['content/sceny', /^srw-oe-.*\.md$/]]) {
    for (const nazwa of readdirSync(folder).filter(x => pliki.test(x))) {
      const tekst = readFileSync(`${folder}/${nazwa}`, 'utf8');
      assert.ok(tekst === bezEtykietDialogow(tekst), `${nazwa}: nagłówek dialogów z dostawy`);
    }
  }
});
