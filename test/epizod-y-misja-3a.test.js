import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';

const plik = 'dostawy/srw-y/dostawa_1_3a.txt';
const bajty = fs.readFileSync(plik);
const tekst = bajty.toString('utf8').replace(/\r\n/g, '\n');
const strony = new Map(wczytajStrony().map(s => [s.slug, s]));
const scena = strony.get('srw-y-ep1-misja-3a-smok-z-polaczenia');

test('1-3A: oryginał Drive i cały dialog od bułki Yomogiego do myśli Echiki', () => {
  assert.equal(createHash('md5').update(bajty).digest('hex'), '944b80dcc34e8b851592d6f11203de85');
  const dialog = tekst.slice(tekst.indexOf('**Gauma:**'), tekst.indexOf('\n---\nUCZESTNICY')).trimEnd();
  const archiwum = fs.readFileSync('episodes/srw-y/ep001.md', 'utf8');
  assert.equal(archiwum.split(dialog).length, 2);
  assert.equal(scena.body.match(/:::skrypt\n([\s\S]*?)\n:::/)[1], dialog);
  assert.equal(scena.numer_sceny, '1-3A');
});

test('1-3A: siedem pełnych profili jednostek z najnowszej misji', () => {
  const bloki = [...tekst.matchAll(/^## (.+?)\n\n\*\*Seria:\*\*[^\n]+\n\n[^\n]+\n\n(\| Parametr[\s\S]*?)\n\n---/gm)];
  assert.equal(bloki.length, 7);
  for (const [, naglowek, dane] of bloki) {
    const nazwa = naglowek.split(' — ')[0];
    const mech = [...strony.values()].find(s => s.typ === 'mech' && s.tytul === nazwa);
    assert.ok(scena.mechy.includes(mech.slug));
    const rekord = JSON.parse(mech.w_gre['srw-y']);
    assert.equal(rekord.dostawa, plik);
    assert.equal(rekord.dane.replaceAll("''", "'"), dane + '\n\n---');
    assert.ok(mech.body.includes(dane));
  }
});

test('1-3A: załoga Dynazenona bez rezerwowej i aktualny poziom Dzieci Gettera', () => {
  const zaloga = ['gauma', 'koyomi-yamanaka', 'yomogi-asanaka', 'yume-minami'];
  assert.deepEqual(strony.get('dynazenon').piloci, zaloga);
  for (const slug of zaloga) assert.ok(strony.get(slug).mechy.includes('dynazenon'));
  assert.ok(scena.postacie.includes('chise-asukagawa'));
  assert.ok(!strony.get('chise-asukagawa').mechy.includes('dynazenon'));
  for (const slug of ['show-kamui', 'takuma-nagare', 'baku-yamagishi']) {
    assert.match(strony.get(slug).body, /\|\s*1\s*\|\s*Dzieci Gettera\s*\|\s*1\s*\|/);
  }
});
