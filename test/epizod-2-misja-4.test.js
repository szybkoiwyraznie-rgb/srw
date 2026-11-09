/** Dostawa 2-4: desant Zeonu na Jaburo, pełne dialogi i dane jednostek. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_2_4.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const script = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const archive = fs.readFileSync('episodes/srw-oe/ep002.md', 'utf8');
const scene = bySlug.get('srw-oe-ep2-bitwa-o-jaburo');
const episode = bySlug.get('srw-oe-ep2');

test('dostawa 2-4 zachowuje wszystkie bajty, a skrypt jest dopisany dokładnie raz', () => {
  assert.equal(bytes.length, 45504);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'b6fd34dcbe1ca960e302000bb1d459951ffb24d911cd257d47308b79daceddca');
  assert.ok(archive.includes(script + '\n'));
  assert.equal(archive.split(script).length - 1, 1, 'skrypt misji 2-4 występuje w archiwum raz');
  assert.equal((archive.match(/^## Bitwa o Jaburo$/gm) ?? []).length, 1);
  assert.ok(archive.includes('## Ryk dziczy'), 'wcześniejsze misje zostają w archiwum');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL102_40|eventP01/);
  assert.ok(fs.existsSync('dostawy/srw-oe/epizod-2-misja-4-pl.md'));
  assert.ok(script.trimEnd().endsWith('Federacji...'), 'narracja zamyka skrypt misji');
});

test('scena 2-4 cytuje czternaście bloków skryptu i ma tyle samo kotwic analizy', async () => {
  assert.equal(scene.numer_sceny, '2-4');
  assert.equal(scene.epizod, 'srw-oe-ep2');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const blocks = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(blocks.length, 14);
  assert.equal(normalizujTekst(blocks.join('\n')), normalizujTekst(script));
  assert.equal(scene.sekcje_analizy.length, 14);
  globalThis.SRW_DATA = await zbudujDane();
  const { renderScena } = await import('../src/srw/render-scene.js');
  assert.equal((renderScena(scene.slug).match(/class="skok-do-tresci"/g) ?? []).length, 14);
  for (const tytul of ['White Base / Mostek', 'Desant Zeonu', 'Atak odparty', 'Wojna przenosi się w kosmos']) {
    assert.ok(scene.body.includes(tytul), tytul);
  }
  assert.equal((scene.body.match(/^### Wojna przenosi się w kosmos$/gm) ?? []).length, 1,
    'nagłówek występuje raz, w cytacie skryptu');
  assert.ok(scene.sekcje_analizy.includes('Zmiana strategii po Jaburo → Wojna przenosi się w kosmos'));
  assert.match(scene.body, /^### Zmiana strategii po Jaburo$/m);
  assert.match(scene.body, /wojny partyzanckiej/);
});

test('nawiązania prowadzą do odcinka o Jaburo i nie zdradzają maszyn późniejszych walk', () => {
  assert.match(scene.body, /## Nawiązania do oryginalnych odcinków/);
  assert.match(scene.body, /dwudziestego dziewiątego odcinka/);
  assert.match(scene.body, /Tragedy in Jaburo/);
  assert.match(scene.body, /\[\[mobile-suit-gundam-1979\|/);
  assert.ok(scene.zrodla.includes('https://en.wikipedia.org/wiki/List_of_Mobile_Suit_Gundam_episodes'));
  assert.ok(scene.body.includes('https://en.wikipedia.org/wiki/List_of_Mobile_Suit_Gundam_episodes'));
  // Wodne maszyny desantu nie mają jeszcze stron w bazie, więc zostają poza opisem.
  assert.doesNotMatch(scene.body, /Z'Gok|Acguy|Zgok/);
});

test('obsada sceny to załoga White Base, 08. Pluton MS i siły desantu Zeonu', () => {
  const obsada = ['bright-noa', 'kai-shiden', 'hayato-kobayashi', 'amuro-ray', 'mirai-yashima',
    'sayla-mass', 'shiro-amada', 'terry-sanders-jr', 'karen-joshua', 'michel-ninorich',
    'eledore-massis', 'fraw-bow', 'char-aznable', 'oficer-zeonu', 'zolnierz-zeonu', 'slender', 'crown'];
  assert.deepEqual(scene.postacie, obsada);
  const jednostki = ['white-base', 'g-fighter', 'guncannon', 'rx-78-2-gundam', 'gundam-ez8',
    'gundam-ground-type', 'gundam-ground-type-glowa-gm', 'guntank', 'hover-truck',
    'zaku-ii-char', 'zaku-ii-bazooka', 'zaku-ii-karabin-maszynowy', 'dom-zolnierz-zeonu', 'zanzibar'];
  assert.deepEqual(scene.mechy, jednostki);
  for (const key of ['postacie', 'mechy', 'pojecia']) {
    for (const slug of scene[key]) assert.ok(episode[key].includes(slug), `${key}: ${slug}`);
  }
  // Okręt desantu dowodzony przez oficera Zeonu jest nową stroną tej dostawy.
  assert.deepEqual(bySlug.get('zanzibar').piloci, ['oficer-zeonu', 'crowley-hamon']);
  assert.ok(bySlug.get('oficer-zeonu').mechy.includes('zanzibar'));
  assert.equal(bySlug.get('zanzibar').seria, 'mobile-suit-gundam-1979');
  assert.equal(bySlug.get('zanzibar').pochodzenie, 'menu');
});

function attacks(text) {
  return text.split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => l.split('|').slice(1, 9).map((c) => c.trim()));
}

test('trzynaście profili maszyn zachowuje wartości uzbrojenia z dostawy', () => {
  const names = {
    'Dom': 'dom-zolnierz-zeonu', 'G-Fighter': 'g-fighter', 'Guncannon': 'guncannon',
    'Gundam': 'rx-78-2-gundam', 'Gundam Ez8': 'gundam-ez8',
    'Ground Gundam (Gundam Ground Type)': 'gundam-ground-type',
    'Grd Gundam/GM (Gundam Ground Type/głowa GM)': 'gundam-ground-type-glowa-gm',
    'Guntank': 'guntank', 'Hover Truck': 'hover-truck',
    'Zaku II (Zaku II (Char))': 'zaku-ii-char',
    'Zaku II (Zaku II/Bazooka)': 'zaku-ii-bazooka',
    'Zaku II (Zaku II/Karabin maszynowy)': 'zaku-ii-karabin-maszynowy',
    'Zanzibar': 'zanzibar',
  };
  const text = raw.split('#### Domyślne mechy')[1].split('#### Piloci i postacie')[0];
  let count = 0;
  for (const m of text.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
    count++;
    const unit = bySlug.get(names[m[1]]);
    assert.ok(unit, m[1]);
    const data = JSON.parse(unit.w_gre['srw-oe']);
    assert.deepEqual(attacks(data.dane), attacks(m[2]), unit.slug);
    assert.deepEqual(attacks(unit.body), attacks(m[2]), `${unit.slug}: tabela widoczna`);
  }
  assert.equal(count, 13);
  assert.equal(attacks(bySlug.get('zanzibar').body).length, 4);
  assert.match(bySlug.get('zanzibar').body, /Okręt \(poziom bazowy 1\)/);
});

const clean = (s) => s.replaceAll('**', '').replace(/\s+/g, ' ').trim();

test('piętnaście profili pilotów ma statystyki z dostawy, a podpiloci pozostają bez tabeli walki', () => {
  const names = {
    'Amuro Ray': 'amuro-ray', 'Kai Shiden': 'kai-shiden', 'Hayato Kobayashi': 'hayato-kobayashi',
    'Bright Noa': 'bright-noa', 'Sayla Mass': 'sayla-mass', 'Shiro Amada': 'shiro-amada',
    'Terry Sanders Jr.': 'terry-sanders-jr', 'Karen Joshua': 'karen-joshua',
    'Michel Ninorich': 'michel-ninorich', 'Mirai Yashima': 'mirai-yashima',
    'Eledore Massis': 'eledore-massis', 'Oficer Zeonu': 'oficer-zeonu',
    'Żołnierz Zeonu': 'zolnierz-zeonu', 'Char Aznable': 'char-aznable',
    'Slender': 'slender', 'Crown': 'crown',
  };
  const text = raw.split('#### Piloci i postacie')[1].split('##### Postacie niebojowe')[0];
  let count = 0;
  for (const m of text.matchAll(/^#### ([^\n]+)\n([\s\S]*?)(?=^#### |$(?![\s\S]))/gm)) {
    count++;
    const pilot = bySlug.get(names[m[1]]);
    assert.ok(pilot, m[1]);
    assert.equal((pilot.body.match(/^## Parametry$/gm) ?? []).length, 1, pilot.slug);
    const rows = pilot.body.split('\n').filter((l) => l.startsWith('|'))
      .map((l) => l.split('|').slice(1, -1).map(clean).join('|'));
    for (const row of m[2].split('\n').filter((l) => /^\|\s*(\d+|\*\*(SP|Atak|Obrona|Celność|Unik)\*\*)\s*\|/.test(l))) {
      assert.ok(rows.includes(row.split('|').slice(1, -1).map(clean).join('|')), `${pilot.slug}: ${row}`);
    }
    if (m[2].includes('podpilot korzysta')) {
      assert.match(pilot.body, /Pula SP/);
      assert.doesNotMatch(pilot.body, /\|\s*(?:\*\*)?(Atak|Obrona|Celność|Unik)(?:\*\*)?\s*\|/);
    }
  }
  assert.equal(count, 16);
});

test('strony misji nie ujawniają etykiet technicznych ani przyszłych losów', () => {
  for (const slug of [scene.slug, 'zanzibar', 'white-base', 'char-aznable', 'shiro-amada']) {
    assert.doesNotMatch(bySlug.get(slug).body, /Entry ID|eventP01|DL102_40|charalist00/);
  }
  assert.match(episode.body, /Misja 4: Bitwa o Jaburo/);
  assert.match(episode.body, /wojny partyzanckiej/);
  assert.match(episode.body, /odc\. 29 „Tragedy in Jaburo”/);
});
