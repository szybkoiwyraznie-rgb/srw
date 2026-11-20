/**
 * Każdy mech w bazie pochodzi z dostawy (ADR 0029).
 *
 * Strona „Zaku II” powstała w 2026-10-20 jako generyczna rodzina maszyn, choć
 * dostawa znała wyłącznie trzy konkretne wersje (Char, bazooka, karabin
 * maszynowy). Takiej strony nie było w żadnym materiale i nie miała ilustracji,
 * więc została usunięta. Test pilnuje, żeby podobna „rodzina” nie wróciła:
 * parametrami każdej jednostki musi być rekord z archiwum dostaw albo profil
 * menu.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const mechy = pages.filter((p) => p.typ === 'mech');

test('każdy mech ma parametry z dostawy albo z menu gry', () => {
  const problemy = [];
  for (const mech of mechy.filter((m) => (m.gry ?? []).includes('srw-oe'))) {
    const wpis = mech.w_gre?.['srw-oe'];
    if (!wpis) {
      problemy.push(`${mech.slug}: brak wpisu w_gre.srw-oe`);
      continue;
    }
    let dane;
    try {
      dane = typeof wpis === 'string' ? JSON.parse(wpis) : wpis;
    } catch {
      problemy.push(`${mech.slug}: w_gre.srw-oe nie jest poprawnym JSON-em`);
      continue;
    }
    const dostawa = dane?.dostawa;
    if (dostawa === 'menu') continue;
    if (typeof dostawa !== 'string' || !dostawa.startsWith('dostawy/')) {
      problemy.push(`${mech.slug}: dostawa=${JSON.stringify(dostawa)} nie wskazuje archiwum w dostawy/`);
      continue;
    }
    if (!fs.existsSync(dostawa)) problemy.push(`${mech.slug}: plik ${dostawa} nie istnieje`);
  }
  assert.deepEqual(problemy, []);
});

test('nie ma strony generycznej dla rodziny maszyn', () => {
  // Maszyna z kilkoma wersjami nie dostaje strony nadrzędnej „na zapas”:
  // każda wersja z dostawy ma własną stronę, a odsyłacze prowadzą do nich.
  assert.equal(mechy.some((m) => m.slug === 'zaku-ii'), false,
    'strona „Zaku II” bez odpowiednika w dostawie nie może wrócić');
  const wersje = ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka', 'zaku-ii-char'];
  for (const slug of wersje) {
    assert.ok(mechy.some((m) => m.slug === slug), `${slug}: strona wersji z dostawy`);
  }
});

test('bojowe maszyny OE pokazują uzbrojenie w parametrach po ilustracjach', () => {
  for (const mech of mechy.filter((m) => m.w_gre?.['srw-oe'])) {
    const wpis = JSON.parse(mech.w_gre['srw-oe']);
    if (!wpis.dane?.includes('| Miejsce')) continue;
    const galeria = mech.body.indexOf('## Ilustracje');
    const parametry = mech.body.indexOf('## Parametry');
    assert.ok(parametry >= 0 && (galeria < 0 || parametry > galeria), `${mech.slug}: parametry po ilustracjach, jeśli są dostępne`);
    const sekcja = mech.body.slice(parametry);
    for (const nazwa of [...wpis.dane.matchAll(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|/gm)].map((m) => m[1].trim())) {
      assert.ok(sekcja.includes(nazwa), `${mech.slug}: brak ${nazwa}`);
    }
    if (wpis.dane.includes('Zdolności — opisy bazowe')) {
      assert.match(sekcja, /Warunek\s*\|\s*Zdolności — opisy bazowe/);
    }
    assert.doesNotMatch(mech.body, /^## Uzbrojenie$/m, `${mech.slug}: uzbrojenie poza parametrami`);
  }
});

test('Wing Zero i jego forma NB mają odrębne profile z właściwych dostaw', () => {
  const zero = mechy.find((m) => m.slug === 'wing-gundam-zero');
  const nb = mechy.find((m) => m.slug === 'wing-gundam-zero-nb');
  const profil = JSON.parse(zero.w_gre['srw-oe']);
  assert.equal(profil.profil, 'Wing Zero (Wing Gundam Zero)');
  assert.equal(profil.dostawa, 'dostawy/srw-oe/dostawa_3_2.txt');
  assert.match(zero.body, /Rolling Buster Rifle/);
  assert.match(zero.body, /Twin Buster Rifle \(maks\. moc\)/);
  assert.match(nb.body, /Skrzydłowe działko Vulcan/);
  assert.doesNotMatch(nb.body.slice(nb.body.indexOf('## Parametry')), /Rolling Buster Rifle/);
});

test('nowe profile pilotów i nazwy skrócone są widoczne po ilustracjach', () => {
  const wymagane = new Map([['heero-yuy', 'Heero'], ['setsuna-f-seiei', 'Setsuna'], ['gihren-zabi', 'Gihren'], ['kycilia-zabi', 'Kycilia'], ['asuka-tsukishiro', 'Asuka'], ['garma-zabi', 'Garma']]);
  for (const [slug, nazwa] of wymagane) {
    const p = pages.find((s) => s.slug === slug && s.typ === 'postac');
    const il = p.body.indexOf('## Ilustracje');
    const par = p.body.indexOf('## Parametry');
    assert.ok(il >= 0 && par > il, `${slug}: parametry po ilustracjach`);
    assert.ok(p.body.slice(par).includes(`**Nazwa skrócona:** ${nazwa}`), slug);
  }
});

test('mechy Macross Frontier mają odrębne strony dla formy myśliwca/fortecy i formy battroida/ataku', () => {
  const pary = [
    { fighter: 'vf-25f-messiah', battroid: 'vf-25f-messiah-battroid', fNazwa: 'VF-25F Messiah/Fighter', bNazwa: 'VF-25F Messiah/Battroid' },
    { fighter: 'vf-25g-messiah', battroid: 'vf-25g-messiah-battroid', fNazwa: 'VF-25G Messiah/Fighter', bNazwa: 'VF-25G Messiah/Battroid' },
    { fighter: 'rvf-25-messiah', battroid: 'rvf-25-messiah-battroid', fNazwa: 'RVF-25 Messiah/Fighter', bNazwa: 'RVF-25 Messiah/Battroid' },
    { fighter: 'macross-quarter', battroid: 'macross-quarter-attack-mode', fNazwa: 'Macross Quarter (forteca)', bNazwa: 'Macross Quarter Attack Mode' },
  ];
  for (const { fighter, battroid, fNazwa, bNazwa } of pary) {
    const f = mechy.find((m) => m.slug === fighter);
    const b = mechy.find((m) => m.slug === battroid);
    assert.ok(f, `forma ${fighter} istnieje`);
    assert.ok(b, `forma ${battroid} istnieje`);
    assert.equal(f.tytul, fNazwa);
    assert.equal(b.tytul, bNazwa);
    const fWpis = JSON.parse(f.w_gre['srw-oe']);
    const bWpis = JSON.parse(b.w_gre['srw-oe']);
    assert.ok(fWpis.profil, `${fighter}: profil w_gre`);
    assert.ok(bWpis.profil, `${battroid}: profil w_gre`);
    assert.ok(f.body.includes(`[[${battroid}|`), `${fighter} linkuje ${battroid}`);
    assert.ok(b.body.includes(`[[${fighter}|`), `${battroid} linkuje ${fighter}`);
  }
});
