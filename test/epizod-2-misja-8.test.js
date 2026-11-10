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
