/**
 * Dostawa 4-3: „Przybysz z innego czasu” — przybycie drużyny Good Thunder,
 * walka z mechabestiami i Dark Go-Saurerem oraz zniszczenie Mucus Gate S MC.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_4_3.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const delivered = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0]
  .replace('## Przybysz z innego czasu', '## Ep. 4-3: Przybysz z innego czasu')
  .replace(/^#### Dialogi (?:warunkowe|sytuacyjne)[^\n]*\n\n?/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const archive = fs.readFileSync('episodes/srw-oe/ep004.md', 'utf8');
const episode = bySlug.get('srw-oe-ep4');
const scene = bySlug.get('srw-oe-ep4-przybysz-z-innego-czasu');

test('dostawa 4-3 jest zachowana bajt w bajt i stoi w archiwum epizodu 4 po misji 4-2', () => {
  assert.equal(bytes.length, 43462);
  assert.equal(createHash('md5').update(bytes).digest('hex'), 'db9917f6fc4ea60022221ffdb0399d01');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'd29cc19855e1a5ae0a74cdd5fdc7d63a3336c15f49c594bd23ac6b9062c86b87');
  assert.equal(fs.existsSync('google_drive'), false, 'katalog roboczy z Drive usunięty');
  assert.match(raw, /^### Odcinek 4 — Przybysz z innego czasu \(`DL104_30`\)$/m);
  assert.ok(archive.includes(delivered), 'skrypt misji jest w archiwum epizodu');
  assert.ok(archive.includes(`${delivered}\n\n## Ep. 4-4:`), 'po misji 4-3 archiwum kontynuuje misja 4-4');
  assert.ok(delivered.endsWith('Aby poszerzyć współpracę z rozmaitymi siłami, Connect Force musiał doprowadzić ekspedycję do sukcesu i udowodnić im swoją wartość.'));
  assert.ok(archive.indexOf('## Ep. 4-1:') < archive.indexOf('## Ep. 4-2:'), 'misje 4-1 i 4-2 zachowują kolejność');
  assert.ok(archive.indexOf('## Ep. 4-2:') < archive.indexOf('## Ep. 4-3:'), 'misja 4-3 następuje po 4-2');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL104/);
});

test('scena 4-3 cytuje cały skrypt i mapuje każdy etap analizy', () => {
  assert.equal(scene.numer_sceny, '4-3');
  assert.equal(scene.epizod, 'srw-oe-ep4');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 9, 'intro i osiem etapów mają osobne bloki skryptu');
  assert.equal(normalizujTekst(bloki.join('\n\n')), normalizujTekst(delivered));
  assert.equal(scene.sekcje_analizy.length, 8);
  assert.deepEqual(scene.sekcje_analizy, [
    'Stacja Connect / Stołówka → Stacja Connect / Stołówka',
    'Stacja Connect / Sala operacyjna → Stacja Connect / Sala operacyjna',
    'Oddział Good Thunder → Oddział Good Thunder',
    'Nadciąga Connect Force → Nadciąga Connect Force',
    'Kontakt z GoShogunem → Kontakt z GoShogunem',
    'Po bitwie → Po bitwie',
    'Macross Quarter / Wnętrze okrętu → Macross Quarter / Wnętrze okrętu',
    'Przygotowania do ekspedycji → Przygotowania do ekspedycji',
  ]);
  const podsekcje = [...scene.body.split('## Analiza')[1].split('\n## Wątki')[0].matchAll(/^### (.+)$/gm)]
    .map((m) => m[1]);
  assert.deepEqual(podsekcje, [
    'Stacja Connect / Stołówka', 'Stacja Connect / Sala operacyjna', 'Oddział Good Thunder',
    'Nadciąga Connect Force', 'Kontakt z GoShogunem', 'Po bitwie',
    'Macross Quarter / Wnętrze okrętu', 'Przygotowania do ekspedycji',
  ]);
  assert.match(scene.body, /## Analiza[\s\S]*## Wątki w scenie/);
  assert.doesNotMatch(scene.body, /Dialogi (?:warunkowe|sytuacyjne)/);
});

test('obsada misji 4-3 rozstrzyga Cookie jako Yoko Kuriki i obejmuje załogi obu okrętów', () => {
  const postacie = [
    'seishiro', 'sergeant-keroro', 'himari-yaegaki', 'jin-hyuga', 'koji-hoshiyama',
    'asuka-tsukishiro', 'bright-noa', 'suol', 'catherine-glass', 'bobby-margot',
    'jeffrey-wilder', 'alto-saotome', 'shingo-hojo', 'killy-gagley', 'remy-shimada',
    'yoko-kuriki', 'akira-imamura', 'tsutomu-kojima', 'mina-roshan', 'ram-hoa',
    'monica-lang', 'maria-shiratori', 'karen-joshua', 'mechabestia', 'mucus',
  ];
  for (const slug of postacie) {
    assert.ok(bySlug.has(slug), `brak postaci ${slug}`);
    assert.ok(scene.postacie.includes(slug), `obsada sceny: ${slug}`);
    assert.ok(episode.postacie.includes(slug), `obsada epizodu: ${slug}`);
  }
  assert.equal(bySlug.get('yoko-kuriki').pseudonim, 'Cookie');
  assert.ok(!scene.postacie.includes('cookie'), 'nie mylić z pokojówką ze SRW Y');
  assert.equal(bySlug.get('cookie').gry.includes('srw-y'), true);
  assert.equal(bySlug.get('mina-roshan').seria, 'macross-frontier');
  assert.equal(bySlug.get('ram-hoa').seria, 'macross-frontier');
  assert.ok(bySlug.get('yoko-kuriki').body.includes('srw-oe-ep4-przybysz-z-innego-czasu'));
});

test('skład misji 4-3 trafia do sceny, epizodu i pól pilotów', () => {
  const mechy = [
    'exart', 'goshogun-robo', 'macross-quarter', 'raijin-oh', 'bolt-robo-anti-air',
    'bolt-robo-long-range', 'bolt-robo-melee', 'bolt-robo-standard', 'dark-go-saurer',
    'mucus-gate-s-mc', 'keroro-robo-mk-ii', 'go-saurer', 'king-go-saurer',
  ];
  for (const slug of mechy) {
    assert.ok(bySlug.has(slug), `brak mecha ${slug}`);
    assert.ok(scene.mechy.includes(slug), `mech sceny: ${slug}`);
    assert.ok(episode.mechy.includes(slug), `mech epizodu: ${slug}`);
  }
  for (const slug of ['connect-force', 'stacja-mars', 'brama-warp', 'mechanization-empire']) {
    assert.ok(scene.pojecia.includes(slug), `hasło sceny: ${slug}`);
    assert.ok(episode.pojecia.includes(slug), `hasło epizodu: ${slug}`);
  }
  for (const slug of ['goshogun', 'nekketsu-saikyo-go-saurer', 'macross-frontier', 'matchless-raijin-oh']) {
    assert.ok(episode.serie.includes(slug), `seria epizodu: ${slug}`);
  }

  const zalogi = {
    exart: ['seishiro', 'himari-yaegaki'],
    'goshogun-robo': ['shingo-hojo', 'killy-gagley', 'remy-shimada'],
    'macross-quarter': ['jeffrey-wilder', 'bobby-margot', 'catherine-glass'],
    'raijin-oh': ['jin-hyuga', 'asuka-tsukishiro', 'koji-hoshiyama'],
    'bolt-robo-anti-air': ['mechabestia'],
    'bolt-robo-long-range': ['mechabestia'],
    'bolt-robo-melee': ['mechabestia'],
    'bolt-robo-standard': ['mechabestia'],
    'dark-go-saurer': ['mechabestia'],
    'mucus-gate-s-mc': [],
  };
  for (const [mech, pilots] of Object.entries(zalogi)) {
    assert.deepEqual(bySlug.get(mech).piloci, pilots, `${mech}: piloci według dostawy`);
    for (const pilot of pilots) {
      assert.ok(scene.postacie.includes(pilot), `${pilot}: pilot w obsadzie sceny`);
      assert.ok(bySlug.get(pilot).mechy.includes(mech), `${pilot}: relacja mechy`);
    }
  }
  assert.ok(bySlug.get('mechabestia').mechy.includes('dark-go-saurer'));
  assert.deepEqual(bySlug.get('mucus-gate-s-mc').piloci, [], 'Mucus Gate S MC jest celem misji, nie pilotowanym mechem');
  assert.ok(bySlug.get('mucus-gate-s-mc').body.includes('srw-oe-ep4-przybysz-z-innego-czasu'));
  assert.ok(bySlug.get('macross-quarter').body.includes('srw-oe-ep4-przybysz-z-innego-czasu'));
});

test('nowe profile GoShoguna i Dark Go-Saurera pochodzą z dostawy 4-3', () => {
  const goshogun = bySlug.get('goshogun-robo');
  assert.equal(goshogun.seria, 'goshogun');
  const profileGo = JSON.parse(goshogun.w_gre['srw-oe']);
  assert.equal(profileGo.dostawa, 'dostawy/srw-oe/dostawa_4_3.txt');
  assert.equal(profileGo.profil, 'GoShogun');
  assert.match(profileGo.dane, /Cosmo Beam/);
  assert.match(profileGo.dane, /Go Flasher Special/);

  const dark = bySlug.get('dark-go-saurer');
  assert.equal(dark.seria, 'nekketsu-saikyo-go-saurer');
  const profileDark = JSON.parse(dark.w_gre['srw-oe']);
  assert.equal(profileDark.dostawa, 'dostawy/srw-oe/dostawa_4_3.txt');
  assert.equal(profileDark.profil, 'Dark Go-Saurer');
  assert.match(profileDark.dane, /Dark Launcher/);
  assert.match(profileDark.dane, /Dark Spartan/);
});

test('Misja 4-3: dostawa ilustracji (2026-11-25) przypisuje cztery pliki jednostek i pięć portretów', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const oczekiwane = {
    'goshogun-robo': ['GoShogun.png', 'GoShogun 2.png'],
    'dark-go-saurer': ['Dark Go-Saurer.png', 'Dark Go-Saurer 2.png'],
    'killy-gagley': ['characters/Killy Gagley.png'],
    'mina-roshan': ['characters/Mina Roshan.png'],
    'ram-hoa': ['characters/Ram Hoa.png'],
    'remy-shimada': ['characters/Remy Shimada.png'],
    'shingo-hojo': ['characters/Shingo Hojo.png'],
  };
  assert.ok(manifest.dostarczono >= '2026-11-25', 'manifest nie jest starszy od tej dostawy');
  for (const [slug, pliki] of Object.entries(oczekiwane)) {
    assert.deepEqual(manifest.encje[slug], pliki, `${slug}: manifest`);
    const body = bySlug.get(slug).body;
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria srw-oe`);
    pliki.forEach((plik, i) => {
      const encoded = plik.split('/').map(encodeURIComponent).join('/');
      assert.ok(body.includes(`${manifest.baseUrl}/${encoded}`), `${slug}: brak URL dla ${plik}`);
      assert.ok(body.includes(`ilustracja ${i + 1} z ${pliki.length}`), `${slug}: podpis ilustracji ${i + 1}`);
    });
  }
});
