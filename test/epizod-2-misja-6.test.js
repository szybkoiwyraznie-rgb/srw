/** Dostawa 2-6: przebicie przez Patrolową Flotę Camel i kurs na Connect. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_2_6.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const script = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const archive = fs.readFileSync('episodes/srw-oe/ep002.md', 'utf8');
const scene = bySlug.get('srw-oe-ep2-przebicie-sila');
const episode = bySlug.get('srw-oe-ep2');

test('dostawa 2-6 zachowuje wszystkie bajty, a skrypt zamyka archiwum epizodu', () => {
  assert.equal(bytes.length, 29732);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '2bd2225f2a58a32159260f15854282427663c4ef35ff1b85123dfb48c8f78cf7');
  assert.ok(archive.includes(script + '\n'));
  assert.equal(archive.split(script).length - 1, 1, 'skrypt misji 2-6 występuje w archiwum raz');
  assert.equal((archive.match(/^## Przebicie się siłą$/gm) ?? []).length, 1);
  assert.ok(archive.includes('## Szturm Apsalusa'), 'wcześniejsze misje zostają w archiwum');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL102_60|eventP01/);
  assert.ok(fs.existsSync('dostawy/srw-oe/epizod-2-misja-6-pl.md'));
  assert.ok(script.endsWith('Zanzibar Chara nieubłaganie zbliżał się od tyłu...'));
});

test('scena 2-6 cytuje siedem bloków skryptu i ma tyle samo kotwic analizy', async () => {
  assert.equal(scene.numer_sceny, '2-6');
  assert.equal(scene.epizod, 'srw-oe-ep2');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 7);
  assert.equal(bloki.join('\n\n'), script);
  assert.equal(scene.sekcje_analizy.length, 7);
  globalThis.SRW_DATA = await zbudujDane();
  const { renderScena } = await import('../src/srw/render-scene.js');
  assert.equal((renderScena(scene.slug).match(/class="skok-do-tresci"/g) ?? []).length, 7);
  for (const tytul of ['Zanzibar — po opuszczeniu atmosfery', 'White Base / Mostek',
    'Dialogi bojowe — warunkowe i sytuacyjne', 'Przebicie przez flotę Camel',
    'Zanzibar — w pościgu', 'White Base — w drodze']) {
    assert.ok(scene.body.includes(tytul), tytul);
  }
});

test('nawiązania prowadzą do odcinków o pościgu Zanzibara i o przebiciu', () => {
  assert.match(scene.body, /## Nawiązania do oryginalnych odcinków/);
  assert.match(scene.body, /Wydarzenia z tej sceny/);
  assert.match(scene.body, /trzydziestego\*\* — „A Decoy in Space”/);
  assert.match(scene.body, /trzydziestego pierwszego\*\* — „Breakthrough”/);
  const adres = 'https://en.wikipedia.org/wiki/List_of_Mobile_Suit_Gundam_episodes';
  assert.ok(scene.zrodla.includes(adres));
  assert.ok(scene.body.includes(adres));
  assert.match(scene.body, /sprawdzono 2026-11-07/);
  assert.match(scene.body, /Komusai/);
});

test('obsada sceny obejmuje załogę White Base, Chara i flotę Drena', () => {
  const obsada = ['bright-noa', 'amuro-ray', 'sayla-mass', 'kai-shiden', 'hayato-kobayashi',
    'mirai-yashima', 'shiro-amada', 'marker', 'oscar-dublin', 'char-aznable',
    'oficer-zeonu', 'zolnierz-zeonu', 'dren'];
  assert.deepEqual(scene.postacie, obsada);
  const jednostki = ['white-base', 'g-fighter', 'guncannon', 'rx-78-2-gundam', 'guntank',
    'musai', 'rick-dom', 'zanzibar'];
  assert.deepEqual(scene.mechy, jednostki);
  for (const key of ['postacie', 'mechy', 'pojecia']) {
    for (const slug of scene[key]) assert.ok(episode[key].includes(slug), `${key}: ${slug}`);
  }
  // Nowe strony tej dostawy i odwrotne przypisania.
  assert.deepEqual(bySlug.get('musai').piloci, ['dren', 'oficer-zeonu']);
  assert.deepEqual(bySlug.get('rick-dom').piloci, ['zolnierz-zeonu']);
  assert.deepEqual(bySlug.get('dren').mechy, ['musai']);
  assert.equal(bySlug.get('dren').rola, 'dowodztwo');
  assert.equal(bySlug.get('dren').seria, 'mobile-suit-gundam-1979');
  assert.equal(bySlug.get('musai').typ_mecha, 'okret');
  assert.equal(bySlug.get('rick-dom').typ_mecha, 'mobile-suit');
  assert.equal(bySlug.get('musai').pochodzenie, 'menu');
  assert.equal(bySlug.get('rick-dom').pochodzenie, 'menu');
  assert.equal(bySlug.get('dren').pochodzenie, 'skrypt');
  assert.equal(bySlug.get('patrolowa-flota-camel').typ, 'pojecie');
  assert.ok(bySlug.get('patrolowa-flota-camel').tagi.includes('jednostka-wojskowa'));
  assert.match(bySlug.get('patrolowa-flota-camel').body, /\[\[dren\|Dren\]\]/);
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

test('siedem profili maszyn zachowuje wartości uzbrojenia z dostawy', () => {
  const nazwy = {
    'G-Fighter': 'g-fighter', 'Guncannon': 'guncannon', 'Gundam': 'rx-78-2-gundam',
    'Guntank': 'guntank', 'Musai': 'musai', 'Rick Dom': 'rick-dom', 'White Base': 'white-base',
  };
  const tekst = raw.split('#### Domyślne mechy i jednostki w misji')[1].split('#### Piloci i postacie')[0];
  let ile = 0;
  for (const m of tekst.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
    ile++;
    const maszyna = bySlug.get(nazwy[m[1]]);
    assert.ok(maszyna, m[1]);
    const dane = JSON.parse(maszyna.w_gre['srw-oe']);
    if (['musai', 'rick-dom'].includes(maszyna.slug)) {
      assert.equal(dane.dostawa, 'dostawy/srw-oe/dostawa_2_6.txt');
    }
    assert.deepEqual(attacks(dane.dane), attacks(m[2]), maszyna.slug);
    assert.deepEqual(attacks(maszyna.body), attacks(m[2]), `${maszyna.slug}: tabela widoczna`);
  }
  assert.equal(ile, 7);
  assert.equal(attacks(bySlug.get('musai').body).length, 3);
  assert.equal(attacks(bySlug.get('rick-dom').body).length, 2);
  assert.match(bySlug.get('musai').body, /Małe rakiety klasy C/);
  assert.match(bySlug.get('rick-dom').body, /Wielka bazooka/);
});

test('jedenastu pilotów ma statystyki z dostawy, a podpilot pozostaje bez tabeli walki', () => {
  const nazwy = {
    'Amuro Ray': 'amuro-ray', 'Kai Shiden': 'kai-shiden', 'Hayato Kobayashi': 'hayato-kobayashi',
    'Bright Noa': 'bright-noa', 'Sayla Mass': 'sayla-mass', 'Shiro Amada': 'shiro-amada',
    'Mirai Yashima': 'mirai-yashima', 'Oficer Zeonu': 'oficer-zeonu',
    'Żołnierz Zeonu': 'zolnierz-zeonu', 'Char Aznable': 'char-aznable', 'Dren': 'dren',
  };
  const tekst = raw.split('#### Piloci i postacie w misji oraz skrypcie sceny')[1].split('##### Postacie niebojowe')[0];
  let ile = 0;
  for (const m of tekst.matchAll(/^#### ([^\n]+)\n([\s\S]*?)(?=^#### |$(?![\s\S]))/gm)) {
    ile++;
    const pilot = bySlug.get(nazwy[m[1]]);
    assert.ok(pilot, m[1]);
    assert.equal((pilot.body.match(/^## Parametry$/gm) ?? []).length, 1, pilot.slug);
    const wiersze = pilot.body.split('\n').filter((l) => l.startsWith('|'))
      .map((l) => l.split('|').slice(1, -1).map(czysc).join('|'));
    for (const wiersz of m[2].split('\n').filter((l) => /^\|\s*(\d+|\*\*(SP|Atak|Obrona|Celność|Unik)\*\*)\s*\|/.test(l))) {
      assert.ok(wiersze.includes(wiersz.split('|').slice(1, -1).map(czysc).join('|')), `${pilot.slug}: ${wiersz}`);
    }
    if (m[2].includes('podpilot korzysta')) {
      assert.match(pilot.body, /Pula SP/);
      assert.doesNotMatch(pilot.body, /\|\s*(?:\*\*)?(Atak|Obrona|Celność|Unik)(?:\*\*)?\s*\|/);
    }
  }
  assert.equal(ile, 11);
  assert.match(bySlug.get('dren').body, /\*\*Dow\. Cel\/Unik\*\*/);
  assert.match(bySlug.get('char-aznable').body, /\*\*Dwa ataki\*\*/);
});

test('strony misji nie ujawniają etykiet technicznych ani przyszłych walk', () => {
  for (const slug of [scene.slug, 'musai', 'rick-dom', 'dren', 'patrolowa-flota-camel']) {
    assert.doesNotMatch(bySlug.get(slug).body, /Entry ID|eventP01|DL102_60|charalist00/);
  }
  assert.match(episode.body, /Misja 6: Przebicie się siłą/);
  assert.match(episode.body, /odc\. 31 „Breakthrough”/);
  assert.doesNotMatch(scene.body, /A Baoa Qu|Solar Ray|Kolonia Axis/);
  // Opis nie przesądza losu Drena: scenariusz kończy się na zniszczeniu jego floty.
  const opisDrena = bySlug.get('dren').body.match(/^## Opis\n([\s\S]*?)(?=^## |^\}\})/m)[1];
  assert.doesNotMatch(opisDrena, /zginął|ginie|śmierć/);
});

test('trzy nowe strony mają galerię ilustracji z dokładnym kluczem R2', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const dostawa = {
    musai: ['Musai.png'],
    'rick-dom': ['Rick Dom.png', 'Rick Dom 2.png'],
    dren: ['characters/Dren.png'],
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
  assert.equal(manifest.dostarczono, '2026-11-07');
  assert.match(manifest.podstawa, /Dostawa ilustracji misji 6 \(2026-11-07\)/);
  assert.match(manifest.uwaga, /82 portretów w characters\/ i 96 plików jednostek w korzeniu, razem 178 obrazów przy 135 encjach/);
  assert.match(manifest.uwaga, /Actions 42406060802, check-run 128503895859/);
});
