/** Dostawa 2-7: pościg Zanzibara, przerwanie ognia przez Connect i start Bigro. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_2_7.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const script = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const archive = fs.readFileSync('episodes/srw-oe/ep002.md', 'utf8');
const scene = bySlug.get('srw-oe-ep2-w-poscigu-za-zanzibarem');
const episode = bySlug.get('srw-oe-ep2');

test('dostawa 2-7 zachowuje wszystkie bajty, a skrypt zamyka archiwum epizodu', () => {
  assert.equal(bytes.length, 52326);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'ce311ccbd6ffd71e4ec864fc8bd4f9d9ed948e4cc9becc6046dc97ae18a9241b');
  assert.ok(archive.includes(script + '\n'));
  assert.equal(archive.split(script).length - 1, 1, 'skrypt misji 2-7 występuje w archiwum raz');
  assert.equal((archive.match(/^## W pościgu za Zanzibarem$/gm) ?? []).length, 1);
  assert.ok(archive.includes('## Przebicie się siłą'), 'wcześniejsze misje zostają w archiwum');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL102_70|eventP01/);
  assert.ok(fs.existsSync('dostawy/srw-oe/epizod-2-misja-7-pl.md'));
  assert.ok(script.endsWith('Rdzeń oddziału specjalnego, który miał stawić czoła nadchodzącym zagrożeniom, zaczynał nabierać kształtu.'));
});

test('scena 2-7 cytuje dwanaście bloków skryptu i ma tyle samo kotwic analizy', async () => {
  assert.equal(scene.numer_sceny, '2-7');
  assert.equal(scene.epizod, 'srw-oe-ep2');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 12);
  assert.equal(bloki.join('\n\n'), script);
  assert.equal(scene.sekcje_analizy.length, 12);
  globalThis.SRW_DATA = await zbudujDane();
  const { renderScena } = await import('../src/srw/render-scene.js');
  assert.equal((renderScena(scene.slug).match(/class="skok-do-tresci"/g) ?? []).length, 12);
  // „White Base / Mostek” występuje dwa razy: mapa zużywa kolejne wystąpienia.
  assert.equal((scene.body.match(/^### White Base \/ Mostek$/gm) ?? []).length, 2);
  for (const tytul of ['Na pokładzie Zanzibara', 'Dialogi warunkowe — Char i piloci White Base',
    'Dialogi sytuacyjne — zbliżenie do White Base', 'Dialogi warunkowe — odwrót pilotów Zeonu',
    'Spotkanie z Connect', 'Zanzibar / Hangar', 'Samowolny wylot',
    'Dialogi warunkowe — starcie z Bigro', 'Bigro pokonany']) {
    assert.ok(scene.body.includes(tytul), tytul);
  }
});

test('nawiązania prowadzą do odcinka o pościgu Zanzibara i do profilu Bigro', () => {
  assert.match(scene.body, /## Nawiązania do oryginalnych odcinków/);
  assert.match(scene.body, /Wydarzenia z tej sceny/);
  assert.match(scene.body, /trzydziestego pierwszego odcinka\*\* serialu/);
  assert.match(scene.body, /„A Decoy in Space”/);
  for (const adres of ['https://en.wikipedia.org/wiki/List_of_Mobile_Suit_Gundam_episodes',
    'https://gundam.fandom.com/wiki/MA-05_Bigro']) {
    assert.ok(scene.zrodla.includes(adres), adres);
    assert.ok(scene.body.includes(adres), adres);
  }
  assert.match(scene.body, /sprawdzono 2026-11-08/);
});

test('obsada sceny obejmuje załogę White Base, ludzi Chara i pilota Bigro', () => {
  const obsada = ['char-aznable', 'tokwan', 'marker', 'oscar-dublin', 'amuro-ray', 'shiro-amada',
    'michel-ninorich', 'terry-sanders-jr', 'eledore-massis', 'bright-noa', 'karen-joshua',
    'mirai-yashima', 'kai-shiden', 'sayla-mass', 'hayato-kobayashi', 'fraw-bow', 'seishiro',
    'himari-yaegaki', 'slender', 'crown', 'oficer-zeonu', 'zolnierz-zeonu'];
  assert.deepEqual(scene.postacie, obsada);
  const jednostki = ['exart', 'white-base', 'rx-78-2-gundam', 'g-fighter', 'guncannon', 'guntank',
    'zanzibar', 'bigro', 'gelgoog-char', 'rick-dom', 'zaku-ii-kai', 'zaku-ii-bazooka',
    'zaku-ii-karabin-maszynowy'];
  assert.deepEqual(scene.mechy, jednostki);
  for (const key of ['postacie', 'mechy', 'pojecia']) {
    for (const slug of scene[key]) assert.ok(episode[key].includes(slug), `${key}: ${slug}`);
  }
  // Nowe strony tej dostawy i odwrotne przypisania.
  assert.deepEqual(bySlug.get('bigro').piloci, ['tokwan']);
  assert.deepEqual(bySlug.get('gelgoog-char').piloci, ['char-aznable']);
  assert.deepEqual(bySlug.get('tokwan').mechy, ['bigro']);
  assert.equal(bySlug.get('tokwan').rola, 'pilot');
  assert.equal(bySlug.get('tokwan').seria, 'mobile-suit-gundam-1979');
  assert.equal(bySlug.get('bigro').typ_mecha, 'mobile armor');
  assert.equal(bySlug.get('gelgoog-char').typ_mecha, 'mobile-suit');
  for (const slug of ['bigro', 'gelgoog-char', 'tokwan']) {
    assert.equal(bySlug.get(slug).pochodzenie, 'skrypt', slug);
    assert.equal(bySlug.get(slug).seria, 'mobile-suit-gundam-1979', slug);
    assert.ok(bySlug.get('mobile-suit-gundam-1979').body.includes(`[[${slug}`), `seria wymienia ${slug}`);
  }
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

test('trzynaście profili maszyn zachowuje wartości uzbrojenia z dostawy', () => {
  const nazwy = {
    Bigro: 'bigro', Exart: 'exart', 'G-Fighter': 'g-fighter',
    'Gelgoog (Gelgoog (Char))': 'gelgoog-char', Guncannon: 'guncannon', Gundam: 'rx-78-2-gundam',
    Guntank: 'guntank', 'Rick Dom': 'rick-dom', 'White Base': 'white-base',
    'Zaku II Kai': 'zaku-ii-kai', 'Zaku II (Zaku II/Bazooka)': 'zaku-ii-bazooka',
    'Zaku II (Zaku II/Karabin maszynowy)': 'zaku-ii-karabin-maszynowy', Zanzibar: 'zanzibar',
  };
  const tekst = raw.split('#### Domyślne mechy i jednostki w misji')[1].split('#### Piloci i postacie')[0];
  let ile = 0;
  for (const m of tekst.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
    ile++;
    const maszyna = bySlug.get(nazwy[m[1]]);
    assert.ok(maszyna, m[1]);
    const dane = JSON.parse(maszyna.w_gre['srw-oe']);
    if (['bigro', 'gelgoog-char'].includes(maszyna.slug)) {
      assert.equal(dane.dostawa, 'dostawy/srw-oe/dostawa_2_7.txt');
    }
    assert.deepEqual(attacks(dane.dane), attacks(m[2]), maszyna.slug);
    assert.deepEqual(attacks(maszyna.body), attacks(m[2]), `${maszyna.slug}: tabela widoczna`);
  }
  assert.equal(ile, 13);
  assert.equal(attacks(bySlug.get('bigro').body).length, 4);
  assert.equal(attacks(bySlug.get('gelgoog-char').body).length, 3);
  assert.match(bySlug.get('bigro').body, /Ramię-szpon/);
  assert.match(bySlug.get('gelgoog-char').body, /Naginata wiązkowa/);
});

test('dziewiętnastu pilotów ma statystyki z dostawy, w tym nowy pilot Bigro', () => {
  const nazwy = {
    'Amuro Ray': 'amuro-ray', 'Kai Shiden': 'kai-shiden', 'Hayato Kobayashi': 'hayato-kobayashi',
    'Bright Noa': 'bright-noa', 'Sayla Mass': 'sayla-mass', 'Shiro Amada': 'shiro-amada',
    'Terry Sanders Jr.': 'terry-sanders-jr', 'Karen Joshua': 'karen-joshua',
    'Michel Ninorich': 'michel-ninorich', 'Seishiro Kusanagi': 'seishiro',
    'Mirai Yashima': 'mirai-yashima', 'Eledore Massis': 'eledore-massis',
    'Himari Yaegaki': 'himari-yaegaki', 'Oficer Zeonu': 'oficer-zeonu',
    'Żołnierz Zeonu': 'zolnierz-zeonu', 'Char Aznable': 'char-aznable',
    Slender: 'slender', Crown: 'crown', Tokwan: 'tokwan',
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
  }
  assert.equal(ile, 19);
  assert.match(bySlug.get('tokwan').body, /\*\*Blok\*\*/);
});

test('strony misji nie ujawniają etykiet technicznych ani przyszłych walk', () => {
  for (const slug of [scene.slug, 'bigro', 'gelgoog-char', 'tokwan', '13-samodzielny-oddzial']) {
    assert.doesNotMatch(bySlug.get(slug).body, /Entry ID|eventP01|DL102_70|charalist00/);
  }
  assert.match(episode.body, /Misja 7: W pościgu za Zanzibarem/);
  // Numeracja oryginalnej emisji, nie angielskiej (L13).
  assert.match(episode.body, /odc\. 31 „A Decoy in Space”/);
  assert.doesNotMatch(scene.body, /A Baoa Qu|Solar Ray|Kolonia Axis|Zeong/);
  // Los pilota Bigro zostaje otwarty: Char życzy mu ucieczki.
  const opisTokwana = bySlug.get('tokwan').body.match(/^## Opis\n([\s\S]*?)(?=^## |^\}\})/m)[1];
  assert.doesNotMatch(opisTokwana, /zginął|ginie|śmierć/);
});

test('13. Samodzielny Oddział wchodzi pod jurysdykcję Connect Force', () => {
  const trzynasty = bySlug.get('13-samodzielny-oddzial').body;
  assert.match(trzynasty, /jurysdykcj[ęi] \[\[connect-force\|Connect Force\]\]/);
  assert.match(trzynasty, /\[\[bright-noa\|Bright Noa\]\]/);
  const connect = bySlug.get('connect-force').body;
  assert.match(connect, /\[\[srw-oe-ep2-w-poscigu-za-zanzibarem\|/);
  assert.match(connect, /\[\[tokwan\|Tokwan\]\]/);
  assert.deepEqual(bySlug.get('char-aznable').mechy, ['zaku-ii-char', 'gelgoog-char']);
});

test('trzy nowe strony mają galerię ilustracji z dokładnym kluczem R2', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const dostawa = {
    bigro: ['Bigro.png'],
    'gelgoog-char': ['Gelgoog.png', 'Gelgoog 2.png'],
    tokwan: ['characters/Tokwan.png'],
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
  assert.equal(manifest.dostarczono, '2026-11-08');
  assert.match(manifest.podstawa, /Dostawa ilustracji misji 7 \(2026-11-08\)/);
  assert.match(manifest.uwaga, /83 portrety w characters\/ i 99 plików jednostek w korzeniu, razem 182 obrazy przy 138 encjach/);
  assert.match(manifest.uwaga, /Actions 42467707426, check-run 128690959195/);
});
