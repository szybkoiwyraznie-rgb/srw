/** Dostawa 2-8: misja „Klasa Obrony leci w kosmos” — narada o odrodzeniu Imperium
 *  Mechanizacji, bitwa w lesie Aokigahara z Laborami pod kontrolą mechabestii, druga
 *  brama Mucus i decyzja o locie Klasy Obrony Ziemi z Gurren Lagannem do Connect Force. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_2_8.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const script = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const archive = fs.readFileSync('episodes/srw-oe/ep002.md', 'utf8');
const scene = bySlug.get('srw-oe-ep2-klasa-obrony-leci-w-kosmos');
const episode = bySlug.get('srw-oe-ep2');

test('dostawa 2-8 zachowuje wszystkie bajty, a skrypt zamyka archiwum epizodu', () => {
  assert.equal(bytes.length, 66282);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '17da77d5a940fba6297f962c32dc65d8d73e7b0b3da5cf0ccf3f7b8c42fe9f22');
  assert.ok(archive.includes(script + '\n'));
  assert.equal(archive.split(script).length - 1, 1, 'skrypt misji 2-8 występuje w archiwum raz');
  assert.equal((archive.match(/^## Klasa Obrony leci w kosmos$/gm) ?? []).length, 1);
  assert.ok(archive.includes('## W pościgu za Zanzibarem'), 'wcześniejsze misje zostają w archiwum');
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL102_90|eventP01/);
  assert.ok(script.endsWith('**Eldran:** Liczę na was... dzieci Ziemi...'));
});

test('scena 2-8 cytuje piętnaście bloków skryptu i ma tyle samo kotwic analizy', () => {
  assert.equal(scene.numer_sceny, '2-8');
  assert.equal(scene.epizod, 'srw-oe-ep2');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const bloki = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(bloki.length, 15);
  assert.equal(normalizujTekst(bloki.join('\n')), normalizujTekst(script));
  assert.equal(scene.sekcje_analizy.length, 15);
  // „Akademia Hinobori / Sala klasy 5-3” występuje trzy razy: mapa zużywa kolejne wystąpienia.
  assert.equal((scene.body.match(/^### Akademia Hinobori \/ Sala klasy 5-3$/gm) ?? []).length, 3);
  for (const tytul of ['Klasa Obrony leci w kosmos', 'Akademia Hinobori / Boisko',
    'Morze Drzew u stóp Fuji', 'Dialogi warunkowe — starcie z Laborami',
    'Dialogi sytuacyjne — ochrona lasu', 'Dialogi sytuacyjne — kolejni wrogowie',
    'Dialogi warunkowe — Gurren Lagann szuka pod ziemią', 'Kolejna Brama Mucus',
    'Po bitwie', 'Drużyna Gurren i zespoły Eldrana', 'Kto poleci w kosmos?',
    'W Akademii Hinobori']) {
    assert.ok(scene.body.includes(tytul), tytul);
  }
  assert.match(episode.body, /Misja 8: Klasa Obrony leci w kosmos/);
});

test('obsada sceny obejmuje drużyny Eldrana, Gurren Team i pilotów wroga', () => {
  const obsada = ['takako-kojima', 'kenichi-minezaki', 'hiromi-tachibana', 'shinobu-asaoka',
    'jin-hyuga', 'maria-shiratori', 'erika-kozu', 'asuka-tsukishiro', 'goro-ishida',
    'tsutomu-kojima', 'shuzo-osada', 'yoji-hiyama', 'kakeru-daichi', 'taro-shirogane',
    'kotaro-kirigakure', 'rikiya-ryuzaki', 'yosuke-kazamatsuri', 'taro-omomo', 'hiryu-tsukishiro',
    'mai-ozora', 'koji-hoshiyama', 'orie-ishizuka', 'kirara-haruno', 'akira-imamura', 'yoko-kuriki',
    'hiroshi-takamori', 'saneyasu-mushanokoji', 'kumiko-tanabe', 'harumi-sato', 'yuka-mizuhara',
    'kamina', 'simon', 'yoko', 'boota', 'masao-fujiyoshi', 'kazutaka-seki', 'ikuyo-oyama',
    'aiko-shimada', 'miki-mano', 'hidenori-kondo', 'yu-izumi',
    'eldran', 'mechabestia', 'mucus', 'control-ai'];
  assert.deepEqual(scene.postacie, obsada);
  const jednostki = ['daiteioh', 'ganbaruger', 'go-saurer', 'gurren-lagann', 'raijin-oh',
    'bolt-robo-anti-air', 'bolt-robo-long-range', 'bolt-robo-melee', 'bolt-robo-standard',
    'brocken-cannon', 'brocken-dzialko-automatyczne', 'brocken', 'gandoppler', 'mucus-gate-s-mc',
    'perfect-daiteioh', 'great-ganbaruger'];
  assert.deepEqual(scene.mechy, jednostki);
  for (const key of ['postacie', 'mechy', 'pojecia']) {
    for (const slug of scene[key]) assert.ok(episode[key].includes(slug), `${key}: ${slug}`);
  }
  // Nowe strony tej dostawy i odwrotne przypisania.
  // Załoga z listy jednostek misji: pilot główny i piloci wspierający (ADR 0037 pkt 7).
  // Hiryu Tsukishiro ma w dostawie kartę podpilota serii Daiteioh, ale nie stoi przy
  // żadnej jednostce — do załogi Daiteioha przypisał go właściciel (2026-11-10).
  const zalogaDaiteioha = ['taro-omomo', 'mai-ozora', 'kakeru-daichi', 'hiryu-tsukishiro'];
  const zalogaGanbarugera = ['kotaro-kirigakure', 'yosuke-kazamatsuri', 'rikiya-ryuzaki'];
  assert.deepEqual(bySlug.get('daiteioh').piloci, zalogaDaiteioha);
  assert.deepEqual(bySlug.get('perfect-daiteioh').piloci, zalogaDaiteioha, 'forma połączona ma tę samą załogę');
  assert.deepEqual(bySlug.get('ganbaruger').piloci, zalogaGanbarugera);
  assert.deepEqual(bySlug.get('great-ganbaruger').piloci, zalogaGanbarugera, 'forma połączona ma tę samą załogę');
  for (const pilot of zalogaDaiteioha) {
    assert.deepEqual(bySlug.get(pilot).mechy, ['daiteioh', 'perfect-daiteioh'], pilot);
  }
  assert.match(bySlug.get('daiteioh').body, /\[\[hiryu-tsukishiro\|/, 'strona Daiteioha wymienia Hiryu');
  assert.deepEqual(bySlug.get('taro-omomo').mechy, ['daiteioh', 'perfect-daiteioh']);
  assert.deepEqual(bySlug.get('kotaro-kirigakure').mechy, ['ganbaruger', 'great-ganbaruger']);
  assert.equal(bySlug.get('taro-omomo').rola, 'pilot');
  assert.equal(bySlug.get('kotaro-kirigakure').seria, 'genki-bakuhatsu-ganbaruger');
  assert.equal(bySlug.get('taro-omomo').seria, 'kanzen-shouri-daiteioh');
  for (const slug of ['daiteioh', 'perfect-daiteioh', 'taro-omomo', 'mai-ozora', 'kakeru-daichi',
    'hiryu-tsukishiro', 'ganbaruger', 'great-ganbaruger', 'kotaro-kirigakure',
    'yosuke-kazamatsuri', 'rikiya-ryuzaki', 'eldran', 'shuzo-osada', 'hiroshi-takamori',
    'yuka-mizuhara', 'hidenori-kondo', 'yu-izumi', 'miki-mano', 'ikuyo-oyama']) {
    assert.equal(bySlug.get(slug).pochodzenie, 'skrypt', slug);
  }
  for (const slug of ['daiteioh', 'perfect-daiteioh', 'taro-omomo', 'mai-ozora', 'kakeru-daichi',
    'hiryu-tsukishiro']) {
    assert.equal(bySlug.get(slug).seria, 'kanzen-shouri-daiteioh', slug);
    assert.ok(bySlug.get('kanzen-shouri-daiteioh').body.includes(`[[${slug}`),
      `seria wymienia ${slug}`);
  }
  for (const slug of ['ganbaruger', 'great-ganbaruger', 'kotaro-kirigakure',
    'yosuke-kazamatsuri', 'rikiya-ryuzaki']) {
    assert.equal(bySlug.get(slug).seria, 'genki-bakuhatsu-ganbaruger', slug);
    assert.ok(bySlug.get('genki-bakuhatsu-ganbaruger').body.includes(`[[${slug}`),
      `seria wymienia ${slug}`);
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

test('szesnaście profili maszyn zachowuje wartości uzbrojenia z dostawy', () => {
  const nazwy = {
    'Bolt Robo (Bolt Robo/Anti-Air)': 'bolt-robo-anti-air',
    'Bolt Robo (Bolt Robo/Long-Range)': 'bolt-robo-long-range',
    'Bolt Robo (Bolt Robo/Melee)': 'bolt-robo-melee',
    'Bolt Robo (Bolt Robo/Standard)': 'bolt-robo-standard',
    'Brocken (Brocken/Cannon)': 'brocken-cannon',
    'Brocken (Brocken/Działko automatyczne)': 'brocken-dzialko-automatyczne',
    'Brocken (Brocken/Melee)': 'brocken',
    Daiteioh: 'daiteioh',
    'Perf. Daiteioh (Perfect Daiteioh)': 'perfect-daiteioh',
    Ganbaruger: 'ganbaruger',
    'Gt.Ganbaruger (Great Ganbaruger)': 'great-ganbaruger',
    Gandoppler: 'gandoppler',
    'Go-Saurer': 'go-saurer',
    'Gurren Lagann (Gurren Lagann (Simon))': 'gurren-lagann',
    'Mucus Gate (Mucus Gate S MC)': 'mucus-gate-s-mc',
    'Raijin-Oh': 'raijin-oh',
  };
  const tekst = raw.split('#### Domyślne mechy i jednostki w misji')[1].split('#### Piloci i postacie')[0];
  let ile = 0;
  for (const m of tekst.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
    ile++;
    const maszyna = bySlug.get(nazwy[m[1]]);
    assert.ok(maszyna, m[1]);
    const dane = JSON.parse(maszyna.w_gre['srw-oe']);
    if (['daiteioh', 'perfect-daiteioh', 'ganbaruger', 'great-ganbaruger', 'bolt-robo-anti-air',
      'brocken-cannon', 'gandoppler'].includes(maszyna.slug)) {
      assert.equal(dane.dostawa, 'dostawy/srw-oe/dostawa_2_8.txt');
    }
    assert.deepEqual(attacks(dane.dane), attacks(m[2]), maszyna.slug);
    if (dane.dostawa === 'dostawy/srw-oe/dostawa_2_8.txt') {
      assert.deepEqual(attacks(maszyna.body), attacks(m[2]), `${maszyna.slug}: tabela widoczna`);
    }
  }
  assert.equal(ile, 16);
  assert.match(bySlug.get('daiteioh').body, /Kaiser Daidan End/);
  assert.match(bySlug.get('ganbaruger').body, /Ganba Final Attack/);
  assert.match(bySlug.get('daiteioh').body, /Połączenie/);
});

test('nowi piloci mają statystyki z dostawy', () => {
  const nazwy = {
    'Kotaro Kirigakure': 'kotaro-kirigakure', 'Taro Omomo': 'taro-omomo',
    'Yosuke Kazamatsuri': 'yosuke-kazamatsuri', 'Rikiya Ryuzaki': 'rikiya-ryuzaki',
    'Mai Ozora': 'mai-ozora', 'Kakeru Daichi': 'kakeru-daichi',
    'Hiryu Tsukishiro': 'hiryu-tsukishiro',
  };
  const tekst = raw.split('#### Piloci i postacie w misji oraz skrypcie sceny')[1].split('##### Postacie niebojowe')[0];
  for (const m of tekst.matchAll(/^#### ([^\n]+)\n([\s\S]*?)(?=^#### |$(?![\s\S]))/gm)) {
    if (!(m[1] in nazwy)) continue;
    const pilot = bySlug.get(nazwy[m[1]]);
    assert.ok(pilot, m[1]);
    assert.equal((pilot.body.match(/^## Parametry$/gm) ?? []).length, 1, pilot.slug);
    const wiersze = pilot.body.split('\n').filter((l) => l.startsWith('|'))
      .map((l) => l.split('|').slice(1, -1).map(czysc).join('|'));
    for (const wiersz of m[2].split('\n').filter((l) => /^\|\s*(\d+|\*\*(SP|Atak|Obrona|Celność|Unik)\*\*)\s*\|/.test(l))) {
      assert.ok(wiersze.includes(wiersz.split('|').slice(1, -1).map(czysc).join('|')),
        `${pilot.slug}: ${wiersz}`);
    }
  }
  assert.match(bySlug.get('kotaro-kirigakure').body, /\*\*Ninjutsu\*\*/);
  assert.match(bySlug.get('taro-omomo').body, /\*\*Instynkt\*\*/);
});

test('strony misji nie ujawniają etykiet technicznych ani przyszłych walk', () => {
  for (const slug of [scene.slug, 'daiteioh', 'ganbaruger', 'taro-omomo', 'eldran',
    'bolt-robo-anti-air', 'gandoppler']) {
    assert.doesNotMatch(bySlug.get(slug).body, /Entry ID|eventP01|DL102_90|charalist00/);
  }
  assert.match(scene.body, /Liczę na was/);
  // Wiedza zebrana w scenie: kopie danych wroga i Labory sterowane przez mechabestie.
  assert.match(bySlug.get('mechabestia').body, /Aokigahara/);
  assert.match(bySlug.get('mucus').body, /zmechanizować Mucus/);
});

test('ilustracje misji 2-8: pięć jednostek po dwa pliki i 24 portrety, z dokładnymi kluczami R2', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  const jednostki = {
    // W buckecie po „Robo” stoją dwie spacje — klucz zostaje taki, jaki jest w R2.
    'bolt-robo-anti-air': ['Bolt Robo  - karabin Gatlinga.png', 'Bolt Robo  - karabin Gatlinga 2.png'],
    'brocken-cannon': ['Brocken - cannon.png', 'Brocken - cannon 2.png'],
    daiteioh: ['Daiteioh.png', 'Daiteioh 2.png'],
    ganbaruger: ['Ganbaruger.png', 'Ganbaruger 2.png'],
    // Klucz ma pisownię właściciela, strona — nazwę z dostawy tekstowej.
    gandoppler: ['Grandoppler.png', 'Grandoppler 2.png'],
  };
  // Portret nazywa się jak postać; dwa klucze różnią się od tytułu strony jedną literą.
  const innaPisowniaKlucza = { 'hiroshi-takamori': 'Hiroshi Takemori', 'rikiya-ryuzaki': 'Rikiya Ryusaki' };
  const portrety = ['aiko-shimada', 'akira-imamura', 'daisuke-sato', 'eldran', 'harumi-sato', 'hidenori-kondo',
    'hiroshi-takamori', 'hiryu-tsukishiro', 'ikuyo-oyama', 'kakeru-daichi', 'kazutaka-seki', 'kotaro-kirigakure',
    'kumiko-tanabe', 'mai-ozora', 'masao-fujiyoshi', 'miki-mano', 'orie-ishizuka', 'rikiya-ryuzaki',
    'saneyasu-mushanokoji', 'shuzo-osada', 'taro-omomo', 'yosuke-kazamatsuri', 'yu-izumi', 'yuka-mizuhara'];
  assert.equal(portrety.length, 24);
  const dostawa = { ...jednostki };
  for (const slug of portrety) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac', slug);
    dostawa[slug] = [`characters/${innaPisowniaKlucza[slug] ?? page.tytul}.png`];
  }
  assert.equal(Object.values(dostawa).flat().length, 34, 'dostawa to 34 pliki');

  // Jedna postać z dostawy nie występuje w misji 2-8: Daisuke Sato jest w obsadzie misji 2-1.
  const scenaStrony = (slug) => (slug === 'daisuke-sato' ? bySlug.get('srw-oe-ep2-grozba-pod-ziemia') : scene);
  for (const [slug, pliki] of Object.entries(dostawa)) {
    assert.deepEqual(manifest.encje[slug], pliki, slug);
    const page = bySlug.get(slug);
    assert.deepEqual(page.gry, ['srw-oe'], `${slug}: strona tej gry`);
    assert.equal((page.body.match(/^## Ilustracje$/gm) ?? []).length, 1, `${slug}: jedna galeria`);
    assert.equal((page.body.match(/^### Ilustracja \d+$/gm) ?? []).length, pliki.length, slug);
    assert.equal((page.body.match(/!\[/g) ?? []).length, pliki.length, slug);
    assert.match(page.body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria z zakresem gry`);
    if (page.body.includes('## Parametry')) {
      assert.ok(page.body.indexOf('## Ilustracje') < page.body.indexOf('## Parametry'), `${slug}: galeria przed parametrami`);
    }
    pliki.forEach((plik, i) => {
      const podpis = `${page.tytul} — ilustracja ${i + 1} z ${pliki.length}`;
      const adres = plik.split('/').map(encodeURIComponent).join('/');
      assert.ok(page.body.includes(`![${podpis}](${manifest.baseUrl}/${adres})`), `${slug}: ${plik}`);
    });
    // Ilustracja nie dopisuje nikogo do sceny: każda z tych stron jest w obsadzie swojej misji z dostawy tekstowej.
    const obsada = scenaStrony(slug)[page.typ === 'postac' ? 'postacie' : 'mechy'] ?? [];
    assert.ok(obsada.includes(slug), `${slug}: strona z obsady sceny ${scenaStrony(slug).numer_sceny}`);
  }
  assert.ok(!(scene.postacie ?? []).includes('daisuke-sato'), 'portret nie dopisał Daisuke Sato do misji 2-8');
  // Dwie spacje w kluczu to w adresie dwa kolejne %20, nie jedno.
  assert.ok(bySlug.get('bolt-robo-anti-air').body.includes('/Bolt%20Robo%20%20-%20karabin%20Gatlinga.png)'));

  // Sąsiednie strony zachowują własne pliki — nowe zdjęcia nie trafiły do innej odmiany.
  assert.deepEqual(manifest.encje.brocken, ['Brocken.png', 'Brocken 2.png']);
  assert.deepEqual(manifest.encje['brocken-dzialko-automatyczne'], ['Brocken Działko.png', 'Brocken Działko 2.png']);
  for (const slug of ['bolt-robo-standard', 'bolt-robo-melee', 'bolt-robo-long-range']) {
    assert.ok(manifest.encje[slug].every((plik) => !plik.includes('karabin Gatlinga')), slug);
  }
  // Formy połączone nie dostały zdjęć maszyn bazowych.
  for (const slug of ['perfect-daiteioh', 'great-ganbaruger']) {
    assert.equal(manifest.encje[slug], undefined, `${slug}: bez własnego pliku w tej dostawie`);
  }

  assert.equal(manifest.weryfikacjaZdalna, false, 'lista R2 nie jest obejrzeniem obrazów');
  assert.ok(manifest.dostarczono >= '2026-11-10', 'manifest nie jest starszy od tej dostawy');
  assert.match(manifest.podstawa, /Dostawa ilustracji misji 2-8 \(2026-11-10\)/);
  assert.match(manifest.uwaga, /Actions 42909697708, check-run 130156783395/);
  assert.match(manifest.uwaga, /zgodność całego manifestu z 240 obiektami/);
});
