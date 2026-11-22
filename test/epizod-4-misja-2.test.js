/**
 * Dostawa 4-2: „Szpony Invaderów” — Keroro i jego wiedza o mobile suitach,
 * promienie Gettera rozpoznane na Marsie, brama [[mucus-gate-s-in|Mucus Gate]]
 * rozbita przez desant [[white-base|White Base]] i raport floty na
 * [[macross-quarter|Macross Quarterze]].
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_4_2.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const delivered = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0]
  .replace('## Szpony Invaderów', '## Ep. 4-2: Szpony Invaderów')
  .replace(/^#### Dialogi warunkowe[^\n]*\n\n?/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const archive = fs.readFileSync('episodes/srw-oe/ep004.md', 'utf8');
const episode = bySlug.get('srw-oe-ep4');
const scene = bySlug.get('srw-oe-ep4-szpony-invaderow');

test('dostawa 4-2 jest zachowana bajt w bajt i zamyka archiwum epizodu 4', () => {
  assert.equal(bytes.length, 35649);
  assert.equal(createHash('md5').update(bytes).digest('hex'), '4033ed3f2c07c44674c86bf79cb2a23d');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '9fc1084917c3b4a5920b44f3a01eb5bbe8c8fb2d0b55221c455f23356c75ff97');
  assert.equal(fs.existsSync('google_drive'), false, 'katalog roboczy z Drive usunięty');
  assert.match(raw, /^### Odcinek 4 — Szpony Invaderów \(`DL104_20`\)$/m);
  assert.match(raw, /eventP01\.EDAT\/DL104_20_Entry\.dat/);
  assert.ok(archive.includes(delivered), 'skrypt misji jest w archiwum epizodu');
  assert.ok(archive.endsWith(`${delivered}\n`), 'misja 4-2 zamyka archiwum epizodu 4');
  assert.ok(delivered.endsWith('**Jeffrey:** Owszem.'), 'ostatnia kwestia misji');
  assert.ok(archive.indexOf('## Ep. 4-1:') < archive.indexOf('## Ep. 4-2:'), 'misje w kolejności');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL104/);
});

test('scena 4-2 cytuje cały skrypt i mapuje każdy etap analizy', () => {
  assert.equal(scene.numer_sceny, '4-2');
  assert.equal(scene.epizod, 'srw-oe-ep4');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 7, 'intro i sześć miejsc mają osobne bloki skryptu');
  assert.equal(normalizujTekst(bloki.join('\n\n')), normalizujTekst(delivered));
  assert.equal(scene.sekcje_analizy.length, 6);
  assert.equal(scene.sekcje_analizy[0], 'Hangar White Base → White Base / Hangar');
  assert.equal(scene.sekcje_analizy.at(-1), 'Raport floty → Macross Quarter / Mostek');
  // Każda podsekcja analizy ma odpowiednik w treści sceny, a nagłówki skryptu
  // pozostają nietknięte.
  const podsekcje = [...scene.body.split('## Analiza')[1].split('\n## ')[0].matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(podsekcje, ['Hangar White Base', 'Keroro strzeże historii', 'Odprawa na stacji',
    'Lądowanie na Marsie', 'Brama zniszczona', 'Raport floty']);
  assert.match(scene.body, /## Analiza[\s\S]*## Nawiązania do oryginalnych odcinków[\s\S]*## Wątki w scenie/);
  assert.doesNotMatch(scene.body, /Dialogi warunkowe/);
});

test('obsada misji 4-2 obejmuje Getter, Gundam, Keroro, Raijin-Oh i flotę Frontier', () => {
  for (const slug of ['sergeant-keroro', 'kai-shiden', 'hayato-kobayashi', 'himari-yaegaki', 'suol',
    'go', 'kei', 'gai', 'seishiro', 'tsutomu-kojima', 'maria-shiratori', 'jin-hyuga',
    'asuka-tsukishiro', 'koji-hoshiyama', 'akira-imamura', 'alan-igor', 'bright-noa',
    'mirai-yashima', 'oscar-dublin', 'marker', 'alto-saotome', 'bobby-margot',
    'catherine-glass', 'monica-lang', 'mucus']) {
    assert.ok(bySlug.has(slug), `brak postaci ${slug}`);
    assert.ok(scene.postacie.includes(slug), `obsada sceny: ${slug}`);
    assert.ok(episode.postacie.includes(slug), `obsada epizodu: ${slug}`);
  }
  for (const slug of ['shin-getter-1', 'white-base', 'invader-air', 'invader-ground',
    'mucus-gate-s-in', 'macross-quarter']) {
    assert.ok(scene.mechy.includes(slug), `sprzęt sceny: ${slug}`);
    assert.ok(episode.mechy.includes(slug), `sprzęt epizodu: ${slug}`);
  }
  for (const slug of ['invaderzy', 'promienie-gettera', 'stacja-connect', 'brama-warp', 'connect-force']) {
    assert.ok(scene.pojecia.includes(slug), `hasło sceny: ${slug}`);
    assert.ok(episode.pojecia.includes(slug), `hasło epizodu: ${slug}`);
  }
  assert.equal(bySlug.get('mucus').typ, 'postac', 'Mucus jest pilotem, nie pojęciem');
  assert.ok(episode.serie.includes('sgt-frog'));
  assert.ok(episode.serie.includes('getter-robo-armageddon'));
  assert.ok(episode.zrodla.includes('https://en.wikipedia.org/wiki/Sgt._Frog'));
});

test('skład misji z listy uczestników trafia do sceny i do jednostek', () => {
  // Jednostki sojusznicze dostawy: Shin Getter-1 z Go, Kei i Gaiem oraz White
  // Base z Brightem i Mirai.
  assert.deepEqual(bySlug.get('shin-getter-1').piloci, ['go', 'kei', 'gai']);
  assert.deepEqual(bySlug.get('white-base').piloci, ['bright-noa', 'mirai-yashima']);
  // Wrogowie: Invaderzy i Mucus sterują swoimi formami; brama jest celem, nie maszyną załogową.
  assert.deepEqual(bySlug.get('invader-air').piloci, ['invader']);
  assert.deepEqual(bySlug.get('invader-ground').piloci, ['invader']);
  assert.deepEqual(bySlug.get('mucus-gate-s-in').piloci, []);
  for (const mech of ['shin-getter-1', 'white-base']) {
    const strona = bySlug.get(mech);
    assert.ok(strona.piloci.every((p) => scene.postacie.includes(p)), `${mech}: załoga w obsadzie sceny`);
  }
});

test('druga misja odsłania drugie Komendy Ducha pilotom wspierającym z dostawy 4-2', () => {
  const duchy = {
    'asuka-tsukishiro': 'Przebł.', 'koji-hoshiyama': 'Doping', 'mirai-yashima': 'Skupienie',
    'himari-yaegaki': 'Przebł.', 'catherine-glass': 'Skupienie', 'bobby-margot': 'Hart',
    'alan-igor': 'Wiatr',
  };
  for (const [slug, duch] of Object.entries(duchy)) {
    // Sekcja tabeli kończy się pustym wierszem albo zamknięciem bloku (`\n}}`).
    const sekcja = /### Komendy Ducha\n([\s\S]*?)(?:\n\n|\n\}\})/.exec(bySlug.get(slug).body)[1];
    assert.match(sekcja, new RegExp(`\\|\\s*2\\s*\\|\\s*\\*\\*${duch.replace('.', '\\.')}\\*\\*\\s*\\|`),
      `${slug}: druga Komenda Ducha z dostawy 4-2`);
  }
  // Pule SP podpilotów i parametry bojowe wchodzą z tego samego bloku.
  assert.match(bySlug.get('asuka-tsukishiro').body, /Pula SP.*50/);
  assert.match(bySlug.get('himari-yaegaki').body, /Pula SP.*60/);
  assert.match(bySlug.get('alto-saotome').body, /\|\s*\*\*Celność\*\*\s*\|\s*137\s*\|/);
  assert.match(bySlug.get('jeffrey-wilder').body, /\|\s*\*\*Obrona\*\*\s*\|\s*90\s*\|/);
});

test('hasła misji 4-2 mówią o bramach Mucus i Invaderach na Marsie', () => {
  const invaderzy = bySlug.get('invaderzy');
  assert.match(invaderzy.body, /srw-oe-ep4-szpony-invaderow/, 'najazd na Marsa trafia do hasła');
  assert.match(bySlug.get('invader').body, /srw-oe-ep4-szpony-invaderow/);
  const promienie = bySlug.get('promienie-gettera');
  assert.match(promienie.body, /srw-oe-ep4-szpony-invaderow|Mars/);
  assert.match(bySlug.get('sgt-frog').body, /Keroro/);
});
