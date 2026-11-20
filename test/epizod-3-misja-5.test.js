/**
 * Dostawa 3-5: „Napaść na bazę marsjańską” — brama warp, atak Gradosu na bazę
 * Federacji, przybycie Eijiego Asuki, Eskadry Skull i Macross Quartera oraz
 * wstąpienie dezertera i floty Frontier do Connect Force.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_3_5.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const delivered = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0]
  .replace('## Napaść na bazę marsjańską', '## Ep. 3-5: Napaść na bazę marsjańską').trim();
const archive = fs.readFileSync('episodes/srw-oe/ep003.md', 'utf8');
const episode = bySlug.get('srw-oe-ep3');
const scene = bySlug.get('srw-oe-ep3-napasc-na-baze-marsjanska');

test('dostawa 3-5 jest zachowana w archiwum i zamyka epizod 3', () => {
  assert.equal(bytes.length, 71165);
  assert.equal(createHash('md5').update(bytes).digest('hex'), 'a01fb808a115f58d6806c3f7fbd5486e');
  assert.ok(archive.includes(delivered), 'skrypt misji jest w archiwum epizodu');
  assert.ok(archive.endsWith(delivered + '\n'), 'piąta misja kończy archiwum epizodu 3');
  assert.ok(delivered.endsWith('okręt-matkę awangardy armii Gradosu.'));
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL103_40/);
});

test('scena 3-5 cytuje cały skrypt i mapuje każdy etap analizy', () => {
  assert.equal(scene.numer_sceny, '3-5');
  assert.equal(scene.epizod, 'srw-oe-ep3');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 14, 'trzynaście etapów i intro mają osobne bloki skryptu');
  assert.equal(normalizujTekst(bloki.join('\n')), normalizujTekst(delivered));
  assert.equal(scene.sekcje_analizy.length, 13);
  assert.equal(scene.sekcje_analizy[0], 'Mostek White Base → White Base / Mostek');
  assert.equal(scene.sekcje_analizy.at(-1), 'Nowa flota → Sala odpraw');
  assert.match(scene.body, /## Analiza[\s\S]*## Wątki w scenie/);
  assert.match(scene.body, /\|\s*Motyw w scenie\s*\|\s*Źródło\s*\|\s*Odcinek w źródle\s*\|\s*Różnice\s*\|/);
  assert.ok(episode.body.includes('[[srw-oe-ep3-napasc-na-baze-marsjanska|Misja 5: Napaść na bazę marsjańską]]'));
});

test('obsada misji 3-5 obejmuje Grados, bazę Federacji i flotę Frontier', () => {
  for (const slug of ['albatro-null-eiji-asuka', 'gosterro', 'alto-saotome', 'michael-blanc',
    'luca-angeloni', 'jeffrey-wilder', 'catherine-glass', 'bobby-margot',
    'oficer-federacji', 'zolnierz-federacji', 'zolnierz-gradosu']) {
    assert.ok(scene.postacie.includes(slug), `obsada sceny: ${slug}`);
    assert.ok(episode.postacie.includes(slug), `obsada epizodu: ${slug}`);
  }
  for (const slug of ['enh-layzner', 'braver', 'daljan', 'macross-quarter',
    'vf-25f-messiah', 'vf-25g-messiah', 'rvf-25-messiah']) {
    assert.ok(scene.mechy.includes(slug), `sprzęt sceny: ${slug}`);
    assert.ok(episode.mechy.includes(slug), `sprzęt epizodu: ${slug}`);
  }
  for (const slug of ['brama-warp', 'ark-ship', 'grados', 'eskadra-skull']) {
    assert.ok(scene.pojecia.includes(slug), `hasło sceny: ${slug}`);
    assert.ok(episode.pojecia.includes(slug), `hasło epizodu: ${slug}`);
  }
  assert.ok(episode.serie.includes('blue-comet-spt-layzner'));
  assert.ok(episode.serie.includes('macross-frontier'));
});

test('nowe maszyny i piloci mają dane z dostawy, a nie z domysłu', () => {
  const eiji = bySlug.get('albatro-null-eiji-asuka');
  assert.equal(eiji.rola, 'pilot');
  assert.deepEqual(eiji.mechy, ['enh-layzner']);
  assert.match(eiji.body, /\*\*Atak\*\*\s*\|\s*110/);
  assert.doesNotMatch(eiji.body, /Spirit Commands/, 'podpisy sekcji zgodne z resztą bazy');

  const gosterro = bySlug.get('gosterro');
  assert.equal(gosterro.rola, 'antagonista');
  assert.match(gosterro.body, /Dwa ataki/);

  const quarter = bySlug.get('macross-quarter');
  const profil = JSON.parse(quarter.w_gre['srw-oe']);
  assert.equal(profil.profil, 'M.Quarter/Fort');
  assert.match(quarter.body, /Macross Cannon/);
  assert.match(quarter.body, /Bariera punktowa/);

  for (const slug of ['vf-25f-messiah', 'vf-25g-messiah', 'rvf-25-messiah']) {
    const mech = bySlug.get(slug);
    assert.match(JSON.parse(mech.w_gre['srw-oe']).dane, /Eskadra Skull \/ F/, `${slug}: skład grupy z dostawy`);
    assert.ok(mech.body.includes('## Parametry'), `${slug}: uzbrojenie w parametrach`);
  }
  // Seweryn: maszyny spoza katalogu OE nie dostają zgadywanej klasy jednostki.
  assert.ok(bySlug.get('braver').tagi.includes('layzner'));
  assert.equal(bySlug.get('braver').tagi.includes('mobile-suit'), false);
});
