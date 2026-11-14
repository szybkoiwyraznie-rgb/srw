/** Dostawa 3-1: misja „Interwencja Gundamów” — obrona obserwatorium na Wyspach
 *  Kurylskich przed Garmą Zabi, odsiecz Zanzibara z M'Quve'em i Black Tri-Stars
 *  oraz zniszczenie placówki przez Gundam Exia i Wing Gundam Zero. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_3_1.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const script = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const archive = fs.readFileSync('episodes/srw-oe/ep003.md', 'utf8');
const scene = bySlug.get('srw-oe-ep3-interwencja-gundamow');
const episode = bySlug.get('srw-oe-ep3');

test('dostawa 3-1 jest zarchiwizowana, a jej skrypt otwiera archiwum epizodu', () => {
  assert.equal(bytes.length, 63290);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'af7d97acd4bbe92a4652f3328692027ca47d6387047ecd96d287491d0bd8457a');
  assert.ok(archive.startsWith('# Super Robot Wars OE — Epizod 3\n\n---\n\n## Ep. 3-1: Interwencja Gundamów\n'));
  assert.ok(archive.includes(script + '\n'));
  assert.equal(archive.split(script).length - 1, 1, 'skrypt misji 3-1 występuje w archiwum raz');
  assert.equal((archive.match(/^## Ep\. 3-1: Interwencja Gundamów$/gm) ?? []).length, 1);
  assert.ok(script.endsWith('Kim są tajemnicze mobile suity? Przez zamarznięte śnieżne pole przebiega dreszcz...'));
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL103_11|eventP01/);
});

test('scena 3-1 cytuje jedenaście bloków skryptu i ma tyle samo kotwic analizy', () => {
  assert.equal(scene.numer_sceny, '3-1');
  assert.equal(scene.epizod, 'srw-oe-ep3');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 11);
  assert.equal(normalizujTekst(bloki.join('\n')), normalizujTekst(script));
  assert.equal(scene.sekcje_analizy.length, 11);
  assert.equal(scene.sekcje_analizy[0], 'Neutralna strefa i obserwatorium → Ep. 3-1: Interwencja Gundamów');
  assert.equal(scene.sekcje_analizy.at(-1), 'Dwa Gundamy z nieba → Dwa niezidentyfikowane Gundamy');
  // Blok nawiązań stoi w osobnym źródle między analizą a wątkami sceny.
  assert.match(scene.body, /\{\{zrodlo gra=wspolne\n\n## Nawiązania do oryginalnych odcinków/);
});

test('obsada misji 3-1 wnosi Garmę, M’Quve’a i dwie nowe serie', () => {
  assert.equal(episode.gra, 'srw-oe');
  assert.equal(episode.numer, 3);
  for (const slug of ['garma-zabi', 'mquve', 'uragan', 'setsuna-f-seiei', 'heero-yuy']) {
    assert.ok(episode.postacie.includes(slug), `obsada epizodu: ${slug}`);
    assert.ok(bySlug.has(slug), `strona istnieje: ${slug}`);
  }
  for (const slug of ['gundam-exia', 'wing-gundam-zero', 'zanzibar', 'dom', 'gelgoog-char']) {
    assert.ok(episode.mechy.includes(slug), `sprzęt epizodu: ${slug}`);
    assert.ok(bySlug.has(slug), `strona istnieje: ${slug}`);
  }
  // Załoga Zanzibara z listy jednostek misji: dwóch dowódców i dwóch dotychczasowych oficerów.
  for (const pilot of ['oficer-zeonu', 'crowley-hamon', 'garma-zabi', 'mquve']) {
    assert.ok(bySlug.get('zanzibar').piloci.includes(pilot), `Zanzibar: ${pilot}`);
    assert.ok(bySlug.get(pilot).mechy.includes('zanzibar'), `${pilot}: Zanzibar`);
  }
  assert.equal(bySlug.get('garma-zabi').seria, 'mobile-suit-gundam-1979');
  assert.equal(bySlug.get('setsuna-f-seiei').seria, 'mobile-suit-gundam-00');
  assert.equal(bySlug.get('wing-gundam-zero').seria, 'mobile-suit-gundam-wing');
  for (const slug of ['mobile-suit-gundam-00', 'mobile-suit-gundam-wing']) {
    assert.ok(bySlug.has(slug), `strona serii: ${slug}`);
  }
  assert.deepEqual(bySlug.get('gundam-exia').piloci, ['setsuna-f-seiei']);
  assert.deepEqual(bySlug.get('wing-gundam-zero').piloci, ['heero-yuy']);
});
