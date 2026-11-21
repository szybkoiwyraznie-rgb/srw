/**
 * Dostawa 4-1: „Atak na okręt Gradosu” — okręt Gradosu ukryty w marsjańskiej
 * dolinie, ruiny pradawnej cywilizacji jako brama inwazji, wysadzenie własnej
 * jednostki przez [[oficer-gradosu|Oficera Gradosu]] i rozmowa o Sojuszu
 * Balarantu, Pentagonie oraz Związku Gilgamesh.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_4_1.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const delivered = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0]
  .replace('## Ep. 4 Atak na okręt Gradosu', '## Ep. 4-1: Atak na okręt Gradosu')
  .replace(/^#### Dialogi warunkowe[^\n]*\n\n?/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const archive = fs.readFileSync('episodes/srw-oe/ep004.md', 'utf8');
const episode = bySlug.get('srw-oe-ep4');
const scene = bySlug.get('srw-oe-ep4-atak-na-okret-gradosu');

test('dostawa 4-1 jest zachowana w archiwum i otwiera epizod 4', () => {
  assert.equal(bytes.length, 50564);
  assert.equal(createHash('md5').update(bytes).digest('hex'), 'bc2014260ec5b4797675af20de42d5c8');
  assert.ok(archive.includes(delivered), 'skrypt misji jest w archiwum epizodu');
  assert.ok(archive.endsWith(`${delivered}\n`), 'misja zamyka archiwum epizodu 4');
  assert.ok(delivered.endsWith('Właśnie tak. To trudna droga, ale musimy dojść do celu.'));
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL104/);
  assert.equal(episode.numer, 4);
  assert.equal(episode.skrypt, 'episodes/srw-oe/ep004.md');
  assert.ok(episode.zrodla.includes('https://en.wikipedia.org/wiki/Armored_Trooper_VOTOMS'));
});

test('scena 4-1 cytuje cały skrypt i mapuje każdy etap analizy', () => {
  assert.equal(scene.numer_sceny, '4-1');
  assert.equal(scene.epizod, 'srw-oe-ep4');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 9, 'osiem etapów i intro mają osobne bloki skryptu');
  assert.equal(normalizujTekst(bloki.join('\n\n')), normalizujTekst(delivered));
  assert.equal(scene.sekcje_analizy.length, 8);
  assert.equal(scene.sekcje_analizy[0], 'Przed odprawą → White Base / Wnętrze okrętu');
  assert.equal(scene.sekcje_analizy.at(-1), 'Cena za bramę warp → Stacja Connect / Centrum dowodzenia');
  assert.match(scene.body, /## Analiza[\s\S]*## Nawiązania do oryginalnych odcinków[\s\S]*## Wątki w scenie/);
  assert.match(scene.body, /\|\s*Motyw w scenie\s*\|\s*Źródło\s*\|\s*Odcinek w źródle\s*\|\s*Różnice\s*\|/);
  // Nagłówki dialogów warunkowych z dostawy nie trafiają do sceny ani do archiwum.
  assert.doesNotMatch(scene.body, /Dialogi warunkowe/);
});

test('obsada misji 4-1 obejmuje Grados, Connect, flotę Frontier i drużynę Gurren', () => {
  for (const slug of ['albatro-null-eiji-asuka', 'gosterro', 'oficer-gradosu', 'zolnierz-gradosu',
    'bright-noa', 'mirai-yashima', 'fraw-bow', 'oscar-dublin', 'marker', 'suol',
    'jeffrey-wilder', 'catherine-glass', 'alto-saotome', 'koji-kabuto', 'ryo-shiba',
    'masato-shikibu', 'alan-igor', 'kei', 'gai', 'shinobu-fujiwara', 'rei']) {
    assert.ok(bySlug.has(slug), `brak postaci ${slug}`);
    assert.ok(scene.postacie.includes(slug), `obsada sceny: ${slug}`);
    assert.ok(episode.postacie.includes(slug), `obsada epizodu: ${slug}`);
  }
  for (const slug of ['enh-layzner', 'braver', 'daljan', 'lotniskowiec-gradosu', 'white-base']) {
    assert.ok(scene.mechy.includes(slug), `sprzęt sceny: ${slug}`);
    assert.ok(episode.mechy.includes(slug), `sprzęt epizodu: ${slug}`);
  }
  for (const slug of ['balarant', 'pentagona', 'apollo-x', 'zwiazek-gilgamesh', 'brama-warp']) {
    assert.ok(scene.pojecia.includes(slug), `hasło sceny: ${slug}`);
    assert.ok(episode.pojecia.includes(slug), `hasło epizodu: ${slug}`);
  }
  assert.ok(episode.serie.includes('blue-comet-spt-layzner'));
  assert.ok(episode.serie.includes('macross-frontier'));
});

test('nowe jednostki i postacie misji 4-1 mają dane z dostawy, a nie z domysłu', () => {
  const lotniskowiec = bySlug.get('lotniskowiec-gradosu');
  assert.equal(lotniskowiec.typ, 'mech');
  assert.equal(lotniskowiec.seria, 'blue-comet-spt-layzner');
  assert.deepEqual(lotniskowiec.piloci, ['oficer-gradosu']);
  const profil = JSON.parse(lotniskowiec.w_gre['srw-oe']);
  assert.equal(profil.dostawa, 'dostawy/srw-oe/dostawa_4_1.txt');
  assert.equal(profil.profil, 'Lotniskowiec (Nowy gigantyczny lotniskowiec Grados)');
  assert.match(profil.dane, /Przeciwlotnicze działo laserowe/);
  assert.match(profil.dane, /\*\*Okręt \(poziom bazowy 1\):\*\*/);
  assert.match(lotniskowiec.body, /## Parametry/);
  assert.match(lotniskowiec.body, /Działo wiązkowe/);

  const oficer = bySlug.get('oficer-gradosu');
  assert.equal(oficer.rola, 'dowodztwo');
  assert.deepEqual(oficer.mechy, ['lotniskowiec-gradosu']);
  assert.match(oficer.body, /\| Obrona \| 79 \|/);
  assert.doesNotMatch(oficer.body, /### Komendy Ducha/, 'dostawa nie daje mu Komend Ducha');
});

test('pierwsza misja epizodu 4 dokłada drugie Komendy Ducha pilotom z dostawy', () => {
  const duchy = {
    simon: 'Mur', kamina: 'Hart', 'koji-kabuto': 'Pęd', kei: 'Przebł.', gai: 'Mur',
    'isao-ota': 'Hart', 'kanuka-clancy': 'Mur', 'shinobu-fujiwara': 'Zapał', yoko: 'Zagrz.',
    boota: 'Więź', 'ryo-shiba': 'Celny', 'masato-shikibu': 'Fortuna', 'alan-igor': 'Wiatr',
  };
  for (const [slug, duch] of Object.entries(duchy)) {
    const strona = bySlug.get(slug);
    assert.ok(strona, `brak postaci ${slug}`);
    assert.match(strona.body, new RegExp(`\\|\\s*2\\s*\\|\\s*\\*\\*${duch.replace('.', '\\.')}\\*\\*\\s*\\|`),
      `${slug}: druga Komenda Ducha z dostawy 4-1`);
  }
  // Seishiro miał już dwie komendy — dostawa dopisuje trzecią i czwartą.
  assert.match(bySlug.get('seishiro').body, /\|\s*3\s*\|\s*\*\*Duch\*\*\s*\|\s*13\s*\|/);
  assert.match(bySlug.get('seishiro').body, /\|\s*4\s*\|\s*\*\*Zapał\*\*\s*\|\s*22\s*\|/);
});

test('hasła misji 4-1 oddzielają materiał scen od pierwowzorów', () => {
  const balarant = bySlug.get('balarant');
  assert.match(balarant.body, /Galaktyki Astragius/);
  assert.match(balarant.body, /ukraść \[\[brama-warp\|bramę warp\]\]/);
  assert.match(balarant.body, /\[\[zwiazek-gilgamesh\|Związkiem Gilgamesh\]\]/);
  assert.doesNotMatch(balarant.body, /Fyana|Chirico|Scopedog/, 'postacie z VOTOMS poza rozegranym materiałem');

  const pentagona = bySlug.get('pentagona');
  assert.equal(pentagona.zrodla, undefined, 'Pentagona jest autorska — bez źródeł zewnętrznych');
  assert.match(pentagona.body, /sojuszu, który zmusza/);

  const apollo = bySlug.get('apollo-x');
  assert.ok(apollo.tagi.includes('wydarzenie'), 'rodzaj treści jest tagiem (ADR 0033)');
  assert.match(apollo.body, /doktor Asuka/);
});
