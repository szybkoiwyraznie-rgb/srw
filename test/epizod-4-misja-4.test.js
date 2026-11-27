/**
 * Dostawa 4-4: „Lelouch buntownik” — rebelianci Pentagony z bazy Little Sei,
 * Lelouch i C.C. w obcym świecie oraz przełamanie okrążenia armii Posaydala.
 *
 * Zero nie ma własnej strony: w SRW OE to pseudonim Leloucha (decyzja właściciela,
 * 2026-11-27; ADR 0047), więc mówca „Zero” rozstrzyga się do `lelouch-vi-britannia`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst, pseudonimWGrze } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_4_4.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const delivered = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0]
  .replace('## Lelouch buntownik', '## Ep. 4-4: Lelouch buntownik')
  .replace(/^#### (?:Dialogi (?:warunkowe|sytuacyjne)|Warunkowe rozstrzygnięcie)[^\n]*\n\n?/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const archive = fs.readFileSync('episodes/srw-oe/ep004.md', 'utf8');
const episode = bySlug.get('srw-oe-ep4');
const scene = bySlug.get('srw-oe-ep4-lelouch-buntownik');

const ETAPY = [
  'Baza rebeliantów / Little Sei', 'Mizun / Pustkowie', 'Armia regularna się przegrupowuje',
  'Zero oferuje pomoc', 'Baza rebeliantów', 'Baza rebeliantów / Korytarz',
  'Początek operacji Zero', 'Przełamanie okrążenia', 'Zero i rebelianci Pentagony',
];

test('dostawa 4-4 jest zachowana bajt w bajt i zamyka archiwum epizodu 4', () => {
  assert.equal(bytes.length, 32250);
  assert.equal(createHash('md5').update(bytes).digest('hex'), 'cf283dedf9f1b3fd008af02a4908defb');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '6eb04f4fa2142b30907c0433df1d40e66dcc0fb84a235938fda1ae5a024d70b9');
  assert.equal(fs.existsSync('google_drive'), false, 'katalog roboczy z Drive usunięty');
  assert.match(raw, /^### Odcinek 4 — Lelouch buntownik \(`DL104_40`\)$/m);
  assert.ok(archive.includes(delivered), 'skrypt misji jest w archiwum epizodu');
  assert.ok(archive.endsWith(`${delivered}\n`), 'misja 4-4 zamyka archiwum epizodu');
  assert.ok(delivered.endsWith('zaczęli coraz energiczniej zbliżać rebeliantów do Connect.'));
  assert.ok(archive.indexOf('## Ep. 4-3:') < archive.indexOf('## Ep. 4-4:'), 'misja 4-4 jest ostatnia');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL104/);
  assert.doesNotMatch(archive.slice(archive.indexOf('## Ep. 4-4:')), /^####/m, 'bez nagłówków dialogów warunkowych');
});

test('scena 4-4 cytuje cały skrypt i mapuje każdy etap analizy', () => {
  assert.equal(scene.numer_sceny, '4-4');
  assert.equal(scene.epizod, 'srw-oe-ep4');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 10, 'intro i dziewięć etapów mają osobne bloki skryptu');
  assert.equal(normalizujTekst(bloki.join('\n\n')), normalizujTekst(delivered));
  assert.deepEqual(scene.sekcje_analizy, ETAPY.map((e) => `${e} → ${e}`));
  const podsekcje = [...scene.body.split('## Analiza')[1].split('\n## Wątki')[0].matchAll(/^### (.+)$/gm)]
    .map((m) => m[1]);
  assert.deepEqual(podsekcje, ETAPY);
  assert.match(scene.body, /## Analiza[\s\S]*## Wątki w scenie/);
  assert.doesNotMatch(scene.body, /Dialogi (?:warunkowe|sytuacyjne)|Warunkowe rozstrzygnięcie/);
});

test('obsada 4-4: Zero to Lelouch, a Amm mówi bez maszyny', () => {
  const postacie = [
    'daba-myroad', 'mirawoo-kyao', 'fannaria-amm', 'lilis-faw', 'gaw-ha-leccee',
    'lelouch-vi-britannia', 'c-c', 'zolnierz-posaydala',
  ];
  for (const slug of postacie) {
    assert.ok(bySlug.has(slug), `brak postaci ${slug}`);
    assert.equal(bySlug.get(slug).typ, 'postac', `${slug}: mówca jest postacią (ADR 0013)`);
    assert.ok(scene.postacie.includes(slug), `obsada sceny: ${slug}`);
    assert.ok(episode.postacie.includes(slug), `obsada epizodu: ${slug}`);
    assert.ok(bySlug.get(slug).body.includes('srw-oe-ep4-lelouch-buntownik'), `${slug}: strona opisuje misję 4-4`);
  }
  assert.equal(bySlug.has('zero'), false, 'Zero nie ma osobnej strony');
  const lelouch = bySlug.get('lelouch-vi-britannia');
  assert.equal(pseudonimWGrze(lelouch, 'srw-oe'), 'Zero');
  // Nazwisko z pierwowzoru, pod którym ukrywał się w Japonii, stoi w bloku źródłowym z cytowaniem.
  const zrodlo = lelouch.body.slice(lelouch.body.indexOf('{{zrodlo'), lelouch.body.indexOf('}}', lelouch.body.indexOf('{{zrodlo')));
  assert.match(zrodlo, /Lelouch Lamperouge.*\(\[Geass Wiki, „Lelouch vi Britannia”\]\(https:\/\/geass\.miraheze\.org\/wiki\/Lelouch_Lamperouge\)/);
  assert.deepEqual(lelouch.gry, ['srw-oe', 'srw-y']);
  assert.equal(lelouch.seria, 'code-geass');
  assert.equal(bySlug.get('c-c').seria, 'code-geass');
  for (const slug of ['daba-myroad', 'mirawoo-kyao', 'fannaria-amm', 'lilis-faw', 'gaw-ha-leccee']) {
    assert.equal(bySlug.get(slug).seria, 'heavy-metal-l-gaim', `${slug}: seria z dostawy`);
  }
  assert.equal(bySlug.get('zolnierz-posaydala').seria, undefined, 'dostawa: brak wpisu w słowniku postaci');
  assert.equal(bySlug.get('fannaria-amm').mechy, undefined, 'Amm nie ma przydziału w składzie misji');
});

test('skład misji 4-4 trafia do sceny, epizodu i pól pilotów', () => {
  const zalogi = {
    gawain: ['lelouch-vi-britannia', 'c-c'],
    'l-gaim': ['daba-myroad', 'lilis-faw'],
    'novel-d-sserd': ['gaw-ha-leccee'],
    turner: ['mirawoo-kyao'],
    'bat-shu': ['zolnierz-posaydala'],
  };
  for (const [mech, pilots] of Object.entries(zalogi)) {
    const strona = bySlug.get(mech);
    assert.ok(strona, `brak mecha ${mech}`);
    assert.ok(scene.mechy.includes(mech), `mech sceny: ${mech}`);
    assert.ok(episode.mechy.includes(mech), `mech epizodu: ${mech}`);
    assert.deepEqual(strona.piloci, pilots, `${mech}: piloci według dostawy`);
    for (const pilot of pilots) assert.ok(bySlug.get(pilot).mechy.includes(mech), `${pilot}: relacja mechy`);
    const profil = JSON.parse(strona.w_gre['srw-oe']);
    assert.equal(profil.dostawa, 'dostawy/srw-oe/dostawa_4_4.txt', `${mech}: profil z dostawy 4-4`);
    assert.equal(profil.profil, strona.tytul);
  }
  assert.equal(bySlug.get('gawain').seria, 'code-geass');
  for (const mech of ['l-gaim', 'novel-d-sserd', 'turner', 'bat-shu']) {
    assert.equal(bySlug.get(mech).seria, 'heavy-metal-l-gaim', `${mech}: seria z dostawy`);
  }
  assert.match(JSON.parse(bySlug.get('gawain').w_gre['srw-oe']).dane, /Druid System/);
  assert.match(JSON.parse(bySlug.get('l-gaim').w_gre['srw-oe']).dane, /Power Launcher[\s\S]*Szabla[\s\S]*Buster Launcher/);
  for (const slug of ['pentagona', 'mizun', 'oldna-posaydal', 'trzynastka-posaydala', 'heavy-metal', 'geass', 'czarni-rycerze']) {
    assert.equal(bySlug.get(slug).typ, 'pojecie', `${slug}: wspominane, nie mówca`);
    assert.ok(scene.pojecia.includes(slug), `hasło sceny: ${slug}`);
    assert.ok(episode.pojecia.includes(slug), `hasło epizodu: ${slug}`);
  }
  for (const slug of ['code-geass', 'heavy-metal-l-gaim']) {
    assert.ok(episode.serie.includes(slug), `seria epizodu: ${slug}`);
  }
});

test('Misja 4-4: dostawa ilustracji (2026-11-27) przypisuje dziewięć plików jednostek i siedem portretów', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  // Klucze zachowują pisownię właściciela: „C. C.” to C.C., a „Lelouch Lamperouge”
  // (nazwisko, pod którym ukrywał się w Japonii) i „Zero (Lelouch Lamperouge)” (portret
  // w masce) to strona Leloucha vi Britannii; „characters/Zero.png” zostaje przy Suzaku.
  const oczekiwane = {
    'bat-shu': ['Bat-Shu.png', 'Bat-Shu 2.png'],
    gawain: ['Gawain.png', 'Gawain 2.png'],
    'l-gaim': ['L-Gaim.png', 'L-Gaim 2.png'],
    'novel-d-sserd': ['Novel D-Sserd.png', 'Novel D-Sserd 2.png'],
    turner: ['Turner.png'],
    'c-c': ['characters/C. C..png'],
    'daba-myroad': ['characters/Daba Myroad.png'],
    'fannaria-amm': ['characters/Fannaria Amm.png'],
    'gaw-ha-leccee': ['characters/Gaw Ha Leccee.png'],
    'lelouch-vi-britannia': ['characters/Lelouch Lamperouge.png', 'characters/Zero (Lelouch Lamperouge).png'],
    'lilis-faw': ['characters/Lilis Faw.png'],
    'mirawoo-kyao': ['characters/Mirawoo Kyao.png'],
  };
  assert.ok(manifest.dostarczono >= '2026-11-27', 'manifest nie jest starszy od tej dostawy');
  for (const [slug, pliki] of Object.entries(oczekiwane)) {
    assert.deepEqual(manifest.encje[slug], pliki, `${slug}: manifest`);
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria srw-oe`);
    pliki.forEach((plik, i) => {
      const encoded = plik.split('/').map(encodeURIComponent).join('/');
      assert.ok(body.includes(`${manifest.baseUrl}/${encoded}`), `${slug}: brak URL dla ${plik}`);
      assert.ok(body.includes(`ilustracja ${i + 1} z ${pliki.length}`), `${slug}: podpis ilustracji ${i + 1}`);
    });
    // Galeria stoi przed parametrami (kolejność boksów strony).
    if (body.includes('## Parametry')) {
      assert.ok(body.indexOf('## Ilustracje') < body.indexOf('## Parametry'), `${slug}: galeria przed parametrami`);
    }
  }
  assert.deepEqual(manifest.encje['suzaku-kururugi'], ['characters/Zero.png'], 'Zero z SRW Y zostaje przy Suzaku');
  // Żołnierz Posaydala nie ma portretu w tej dostawie.
  assert.equal(manifest.encje['zolnierz-posaydala'], undefined);
});
