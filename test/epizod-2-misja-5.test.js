/** Dostawa 2-5: finał projektu Apsalusa, oddział Ramby Rala i wylot w kosmos. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_2_5.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const script = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const archive = fs.readFileSync('episodes/srw-oe/ep002.md', 'utf8');
const scene = bySlug.get('srw-oe-ep2-szturm-apsalusa');
const episode = bySlug.get('srw-oe-ep2');

test('dostawa 2-5 zachowuje wszystkie bajty, a skrypt zamyka archiwum epizodu', () => {
  assert.equal(bytes.length, 60870);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '1ce104011d86c594d2828d4724dc895a57ed42e2de415bd434424a8a34f9f624');
  assert.ok(archive.includes(script + '\n'));
  assert.equal(archive.split(script).length - 1, 1, 'skrypt misji 2-5 występuje w archiwum raz');
  assert.equal((archive.match(/^## Szturm Apsalusa$/gm) ?? []).length, 1);
  assert.ok(archive.includes('## Bitwa o Jaburo'), 'wcześniejsze misje zostają w archiwum');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL102_50|eventP01/);
  assert.ok(fs.existsSync('dostawy/srw-oe/epizod-2-misja-5-pl.md'));
  assert.ok(script.endsWith('by ścigać White Base.'), 'narracja zamyka skrypt misji');
});

test('scena 2-5 cytuje dwadzieścia sześć bloków skryptu i ma tyle samo kotwic analizy', async () => {
  assert.equal(scene.numer_sceny, '2-5');
  assert.equal(scene.epizod, 'srw-oe-ep2');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const blocks = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(blocks.length, 26);
  assert.equal(normalizujTekst(blocks.join('\n')), normalizujTekst(script));
  assert.equal(scene.sekcje_analizy.length, 26);
  globalThis.SRW_DATA = await zbudujDane();
  const { renderScena } = await import('../src/srw/render-scene.js');
  assert.equal((renderScena(scene.slug).match(/class="skok-do-tresci"/g) ?? []).length, 26);
  for (const tytul of ['Jaburo / Dowództwo', 'Determinacja Giniasa', 'Upadek Apsalusa', 'Opuszczenie Ziemi']) {
    assert.ok(scene.body.includes(tytul), tytul);
  }
});

test('nawiązania prowadzą do finału OVA i do odcinka ze śmiercią Ramby Rala', () => {
  assert.match(scene.body, /## Nawiązania do oryginalnych odcinków/);
  assert.match(scene.body, /dziesiątego i jedenastego odcinka/);
  assert.match(scene.body, /The Shuddering Mountain/);
  assert.match(scene.body, /dwudziestym odcinku „Hand-to-Hand Combat”/);
  for (const adres of [
    'https://gundam.fandom.com/wiki/Apsaras_III',
    'https://gundam.fandom.com/wiki/Ginias_Sahalin',
    'https://gundam.fandom.com/wiki/Ramba_Ral',
    'https://gundam.fandom.com/wiki/Hand-to-Hand_Combat',
  ]) {
    assert.ok(scene.zrodla.includes(adres), `${adres} w frontmatterze`);
    assert.ok(scene.body.includes(adres), `${adres} przy twierdzeniu`);
  }
  assert.match(scene.body, /sprawdzono 2026-11-07/);
});

test('obsada sceny obejmuje załogę White Base, ród Sahalinów i oddział Ramby Rala', () => {
  const obsada = ['bright-noa', 'general-revil', 'shiro-amada', 'karen-joshua', 'amuro-ray',
    'terry-sanders-jr', 'mirai-yashima', 'eledore-massis', 'michel-ninorich', 'hayato-kobayashi',
    'kai-shiden', 'sayla-mass', 'fraw-bow', 'marker', 'oscar-dublin', 'ginias-sahalin',
    'ramba-ral', 'crowley-hamon', 'acous', 'cozun-graham', 'char-aznable', 'zolnierz-zeonu'];
  assert.deepEqual(scene.postacie, obsada);
  const jednostki = ['white-base', 'g-fighter', 'guncannon', 'rx-78-2-gundam', 'gundam-ez8',
    'gundam-ground-type', 'gundam-ground-type-glowa-gm', 'guntank', 'hover-truck',
    'rx-78nt-1-gundam-alex', 'apsalus-iii', 'gouf-ramba-ral', 'dom-zolnierz-zeonu',
    'zaku-ii-kai', 'zaku-ii-karabin-maszynowy', 'zanzibar'];
  assert.deepEqual(scene.mechy, jednostki);
  for (const key of ['postacie', 'mechy', 'pojecia']) {
    for (const slug of scene[key]) assert.ok(episode[key].includes(slug), `${key}: ${slug}`);
  }
  // Nowe strony tej dostawy trzymają dane z menu i odwrotne przypisania.
  assert.deepEqual(bySlug.get('apsalus-iii').piloci, ['ginias-sahalin']);
  assert.deepEqual(bySlug.get('gouf-ramba-ral').piloci, ['ramba-ral']);
  assert.deepEqual(bySlug.get('ginias-sahalin').mechy, ['apsalus-iii']);
  assert.deepEqual(bySlug.get('ramba-ral').mechy, ['gouf-ramba-ral']);
  assert.deepEqual(bySlug.get('crowley-hamon').mechy, ['zanzibar']);
  assert.deepEqual(bySlug.get('zanzibar').piloci, ['oficer-zeonu', 'crowley-hamon']);
  assert.deepEqual(bySlug.get('zaku-ii-kai').piloci,
    ['gabriel-ramirez-garcia', 'hardy-steiner', 'cozun-graham', 'zolnierz-zeonu']);
  assert.deepEqual(bySlug.get('zaku-ii-karabin-maszynowy').piloci, ['slender', 'acous', 'zolnierz-zeonu']);
  assert.equal(bySlug.get('apsalus-iii').pochodzenie, 'menu');
  assert.equal(bySlug.get('ginias-sahalin').pochodzenie, 'skrypt');
});

const czysc = (s) => s.replaceAll('**', '').replace(/<br>/g, ' ').replace(/[,;„”"]/g, ' ').replace(/\s+/g, ' ').trim();

function attacks(text) {
  const out = [];
  for (const l of text.split('\n')) {
    if (!l.trim().startsWith('|')) continue;
    const cells = l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c)) || cells[0] === 'Miejsce') continue;
    if (cells[0] === '') {
      if (!out.length) continue;
      cells.forEach((c, i) => { if (c && i < out.at(-1).length) out.at(-1)[i] = out.at(-1)[i] ? `${out.at(-1)[i]} ${c}` : c; });
    } else out.push(cells);
  }
  return out.map((r) => r.map(czysc).join('|'));
}

test('piętnaście profili maszyn zachowuje wartości uzbrojenia z dostawy', () => {
  const names = {
    'Apsalus III': 'apsalus-iii', 'Dom': 'dom-zolnierz-zeonu', 'G-Fighter': 'g-fighter',
    'Gouf (Gouf (Ramba Ral))': 'gouf-ramba-ral', 'Guncannon': 'guncannon',
    'Gundam': 'rx-78-2-gundam', 'Gundam Ez8': 'gundam-ez8',
    'Ground Gundam (Gundam Ground Type)': 'gundam-ground-type',
    'Grd Gundam/GM (Gundam Ground Type/głowa GM)': 'gundam-ground-type-glowa-gm',
    'Guntank': 'guntank', 'Hover Truck': 'hover-truck', 'White Base': 'white-base',
    'Zaku II Kai': 'zaku-ii-kai',
    'Zaku II (Zaku II/Karabin maszynowy)': 'zaku-ii-karabin-maszynowy', 'Zanzibar': 'zanzibar',
  };
  const text = raw.split('#### Domyślne mechy i jednostki w misji')[1].split('#### Piloci i postacie')[0];
  let count = 0;
  for (const m of text.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
    count++;
    const unit = bySlug.get(names[m[1]]);
    assert.ok(unit, m[1]);
    const data = JSON.parse(unit.w_gre['srw-oe']);
    assert.deepEqual(attacks(data.dane), attacks(m[2]), unit.slug);
    assert.deepEqual(attacks(unit.body), attacks(m[2]), `${unit.slug}: tabela widoczna`);
  }
  assert.equal(count, 15);
  assert.equal(attacks(bySlug.get('apsalus-iii').body).length, 3);
  assert.equal(attacks(bySlug.get('gouf-ramba-ral').body).length, 4);
  assert.match(bySlug.get('apsalus-iii').body, /Ciężki panc\. \(poziom bazowy 1\)/);
  assert.match(bySlug.get('gouf-ramba-ral').body, /Heat Rod\/Rzut/);
});

test('siedemnastu pilotów ma statystyki z dostawy, a podpiloci pozostają bez tabeli walki', () => {
  const names = {
    'Amuro Ray': 'amuro-ray', 'Kai Shiden': 'kai-shiden', 'Hayato Kobayashi': 'hayato-kobayashi',
    'Bright Noa': 'bright-noa', 'Sayla Mass': 'sayla-mass', 'Shiro Amada': 'shiro-amada',
    'Terry Sanders Jr.': 'terry-sanders-jr', 'Karen Joshua': 'karen-joshua',
    'Michel Ninorich': 'michel-ninorich', 'Mirai Yashima': 'mirai-yashima',
    'Eledore Massis': 'eledore-massis', 'Żołnierz Zeonu': 'zolnierz-zeonu',
    'Ramba Ral': 'ramba-ral', 'Crowley Hamon': 'crowley-hamon', 'Acous': 'acous',
    'Cozun Graham': 'cozun-graham', 'Ginias Sahalin': 'ginias-sahalin',
  };
  const text = raw.split('#### Piloci i postacie w misji oraz skrypcie sceny')[1].split('##### Postacie niebojowe')[0];
  let count = 0;
  for (const m of text.matchAll(/^#### ([^\n]+)\n([\s\S]*?)(?=^#### |$(?![\s\S]))/gm)) {
    count++;
    const pilot = bySlug.get(names[m[1]]);
    assert.ok(pilot, m[1]);
    assert.equal((pilot.body.match(/^## Parametry$/gm) ?? []).length, 1, pilot.slug);
    const rows = pilot.body.split('\n').filter((l) => l.startsWith('|'))
      .map((l) => l.split('|').slice(1, -1).map(czysc).join('|'));
    for (const row of m[2].split('\n').filter((l) => /^\|\s*(\d+|\*\*(SP|Atak|Obrona|Celność|Unik)\*\*)\s*\|/.test(l))) {
      assert.ok(rows.includes(row.split('|').slice(1, -1).map(czysc).join('|')), `${pilot.slug}: ${row}`);
    }
    if (m[2].includes('podpilot korzysta')) {
      assert.match(pilot.body, /Pula SP/);
      assert.doesNotMatch(pilot.body, /\|\s*(?:\*\*)?(Atak|Obrona|Celność|Unik)(?:\*\*)?\s*\|/);
    }
  }
  assert.equal(count, 17);
  assert.match(bySlug.get('ramba-ral').body, /\*\*Dwa ataki\*\*/);
  assert.match(bySlug.get('ginias-sahalin').body, /\*\*Dow\. Atk\/Cel\*\*/);
});

test('strony misji nie ujawniają etykiet technicznych ani przyszłych losów', () => {
  for (const slug of [scene.slug, 'apsalus-iii', 'gouf-ramba-ral', 'ginias-sahalin', 'ramba-ral', 'crowley-hamon']) {
    assert.doesNotMatch(bySlug.get(slug).body, /Entry ID|eventP01|DL102_50|charalist00/);
  }
  assert.match(episode.body, /Misja 5: Szturm Apsalusa/);
  assert.match(episode.body, /odc\. 11 „The Shuddering Mountain, Part 2”/);
  // Zapowiedzi kolejnych starć zostają zapowiedziami.
  assert.doesNotMatch(scene.body, /A Baoa Qu|Solar Ray|Kolonia Axis/);
});

test('każda z siedmiu nowych stron ma galerię ilustracji z dokładnym kluczem R2', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const dostawa = {
    'apsalus-iii': ['Apsalus III.png'],
    'gouf-ramba-ral': ['Gouf.png', 'Gouf 2.png'],
    acous: ['characters/Acous.png'],
    'cozun-graham': ['characters/Cozun Graham.png'],
    'crowley-hamon': ['characters/Crowley Hamon.png'],
    'ginias-sahalin': ['characters/Ginias Sahalin.png'],
    'ramba-ral': ['characters/Ramba Ral.png'],
  };
  for (const [slug, pliki] of Object.entries(dostawa)) {
    assert.deepEqual(manifest.encje[slug], pliki, slug);
    const page = bySlug.get(slug);
    assert.equal((page.body.match(/^## Ilustracje$/gm) ?? []).length, 1, slug);
    assert.equal((page.body.match(/^### Ilustracja \d+$/gm) ?? []).length, pliki.length, slug);
    assert.equal((page.body.match(/!\[/g) ?? []).length, pliki.length, slug);
    assert.ok(page.body.indexOf('## Ilustracje') < page.body.indexOf('## Parametry'), `${slug}: galeria przed parametrami`);
    assert.match(page.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/);
    pliki.forEach((plik, i) => {
      const podpis = `${page.tytul} — ilustracja ${i + 1} z ${pliki.length}`;
      const adres = plik.split('/').map(encodeURIComponent).join('/');
      assert.ok(page.body.includes(`![${podpis}](${manifest.baseUrl}/${adres})`), `${slug}: ${plik}`);
    });
  }
  assert.equal(manifest.weryfikacjaZdalna, false, 'lista R2 nie jest obejrzeniem obrazów');
  assert.equal(manifest.dostarczono, '2026-11-09');
  assert.match(manifest.podstawa, /Dostawa ilustracji misji 5 \(2026-11-07\)/);
  assert.match(manifest.uwaga, /99 portretów w characters\/ i 107 plików jednostek w korzeniu, razem 206 obrazów przy 162 encjach/);
  assert.match(manifest.uwaga, /Actions 42376859248, check-run 128416119853/);
});
