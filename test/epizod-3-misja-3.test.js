/** Dostawa 3-3: „Zielony najeźdźca” — incydenty szalejących Laborów na kolonii i dołączenie Keroro do Connect Force. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_3_3.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const deliveredScript = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const script = deliveredScript.replace('## Zielony najeźdźca', '## Ep. 3-3: Zielony najeźdźca');
const archive = fs.readFileSync('episodes/srw-oe/ep003.md', 'utf8');
const episode = bySlug.get('srw-oe-ep3');
const scene = bySlug.get('srw-oe-ep3-zielony-najezdzca');

test('dostawa 3-3 jest archiwizowana w całości jako trzecia misja epizodu 3', () => {
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'c2958e91adf4174caa3b6d275d4e403e2a8ed68902c410613e1edede5d3bbace');
  assert.ok(archive.includes('## Ep. 3-3: Zielony najeźdźca\n'));
  assert.equal(archive.split(script).length - 1, 1, 'pełny skrypt misji znajduje się w archiwum dokładnie raz');
  assert.ok(archive.endsWith(script + '\n'), 'misja 3-3 kończy archiwum epizodu');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL103_20|eventP01/);
});

test('scena 3-3 cytuje cały skrypt dosłownie i wskazuje epizod oraz kolejny numer misji', () => {
  assert.equal(scene.numer_sceny, '3-3');
  assert.equal(scene.epizod, 'srw-oe-ep3');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const blocks = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(blocks.length, 13, 'każdy etap sceny ma osobny blok skryptu');
  assert.equal(normalizujTekst(blocks.join('\n')), normalizujTekst(script));
  assert.equal(scene.sekcje_analizy.length, 13);
  assert.equal(scene.sekcje_analizy[0], 'Przybycie na kolonię → Zbliżenie do kolonii kosmicznej');
  assert.equal(scene.sekcje_analizy.at(-1), 'Nowy program ochronny → Śledztwo w sprawie Laborów');
  // Analiza nie wymienia nagłówków skryptu jako tematów — opisuje świat.
  assert.doesNotMatch(scene.body.split('## Analiza')[1].split('\n## ')[0], /^###\s+(?:Dialogi|Warunkowe dialogi)/m);
  assert.match(scene.body, /## Analiza[\s\S]*## Wątki w scenie/);
  assert.ok(episode.body.includes('[[srw-oe-ep3-zielony-najezdzca|Misja 3: Zielony najeźdźca]]'));
});

test('Keroro, formy robota i piloci misji mają właściwe serie, składy i dane gry', () => {
  const keroro = bySlug.get('sergeant-keroro');
  const robot = bySlug.get('keroro-robo-mk-ii');
  const jet = bySlug.get('keroro-jet');
  assert.equal(keroro.tytul, 'Sierżant Keroro');
  assert.equal(keroro.seria, 'sgt-frog');
  assert.equal(keroro.pseudonim, undefined);
  assert.deepEqual(robot.piloci, ['sergeant-keroro']);
  assert.deepEqual(jet.piloci, ['sergeant-keroro']);
  assert.ok(keroro.mechy.includes(robot.slug));
  assert.ok(keroro.mechy.includes(jet.slug));
  for (const unit of [robot, jet]) {
    const data = JSON.parse(unit.w_gre['srw-oe']);
    assert.equal(data.dostawa, 'dostawy/srw-oe/dostawa_3_3.txt');
    assert.match(data.dane, /Działko Vulcan/);
    assert.equal(unit.seria, 'sgt-frog');
  }
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  assert.deepEqual(manifest.encje['keroro-robo-mk-ii'], ['Keroro Robo II.png', 'Keroro Robo II 2.png']);
  assert.deepEqual(manifest.encje['keroro-jet'], ['Keroro Jet.png']);
  assert.deepEqual(manifest.encje['sergeant-keroro'], ['characters/Sierżant Keroro.png']);
  assert.match(robot.body, /## Ilustracje[\s\S]*Keroro%20Robo%20II\.png[\s\S]*Keroro%20Robo%20II%202\.png/);
  assert.match(jet.body, /## Ilustracje[\s\S]*Keroro%20Jet\.png/);
  assert.match(keroro.body, /## Ilustracje[\s\S]*characters\/Sier%C5%BCant%20Keroro\.png/);
  assert.ok(scene.postacie.includes('sergeant-keroro'));
  assert.ok(scene.postacie.includes('control-ai'));
  assert.ok(scene.mechy.includes('keroro-robo-mk-ii'));
  assert.ok(!scene.mechy.includes('keroro-jet'), 'Jet jest wymienioną formą transformacji, ale nie osobną jednostką tej misji');
  assert.ok(episode.serie.includes('sgt-frog'));
});
