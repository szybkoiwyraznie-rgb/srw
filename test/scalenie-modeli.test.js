/**
 * Scalanie modeli i granica scalania (ADR 0045).
 *
 * Ten sam model z różnymi pilotami ma jeden wpis i osobne sekcje parametrów.
 * Model różniący się kolorem albo uzbrojeniem zachowuje własną stronę.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { renderMarkdown } from '../src/srw/markdown.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strony = wczytajStrony({ root: ROOT });
const bySlug = new Map(strony.map((s) => [s.slug, s]));

const profile = (strona) => [strona.w_gre?.['srw-oe'], ...(strona.w_gre_dodatkowe ?? [])]
  .filter(Boolean).map((w) => JSON.parse(w));

/** Sekcja parametrów wskazana nazwą po myślniku, do zamknięcia bloku `}}`. */
function sekcja(strona, nazwa) {
  const start = strona.body.indexOf(`## Parametry — ${nazwa}`);
  assert.ok(start >= 0, `${strona.slug}: sekcja „${nazwa}”`);
  const end = strona.body.indexOf('\n}}', start);
  return strona.body.slice(start, end === -1 ? undefined : end);
}

test('Gurren Lagann ma jeden wpis i parametry Simona oraz Kaminy', () => {
  const gurren = bySlug.get('gurren-lagann');
  assert.ok(gurren);
  const profileGurrena = profile(gurren);
  assert.equal(profileGurrena.length, 2);
  const simon = profileGurrena.find((p) => p.profil === 'Gurren Lagann (Gurren Lagann (Simon))');
  const kamina = profileGurrena.find((p) => p.profil === 'Gurren Lagann (Kamina)');
  assert.ok(simon, 'profil Simona');
  assert.ok(kamina, 'profil Kaminy');
  assert.equal(kamina.dostawa, 'dostawy/srw-oe/OE_Mechy.txt');
  assert.ok(fs.existsSync(path.join(ROOT, kamina.dostawa)), 'plik dodatkowej dostawy istnieje');

  const sekcjaSimona = sekcja(gurren, 'Simon');
  const sekcjaKaminy = sekcja(gurren, 'Kamina');
  assert.match(sekcjaSimona, /Toroidal Burst/);
  assert.match(sekcjaSimona, /2600/);
  assert.match(sekcjaKaminy, /Full Drillize/);
  assert.match(sekcjaKaminy, /2800/);
  assert.doesNotMatch(sekcjaKaminy, /Toroidal Burst/);
  assert.doesNotMatch(sekcjaSimona, /Full Drillize/);
  // Każda broń z rekordu dostawy jest widoczna w swojej sekcji.
  for (const wariant of [simon, kamina]) {
    const nazwy = [...wariant.dane.matchAll(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|/gm)].map((m) => m[1].trim());
    const widoczna = wariant === simon ? sekcjaSimona : sekcjaKaminy;
    for (const nazwa of nazwy) assert.ok(widoczna.includes(nazwa), `${wariant.profil}: ${nazwa}`);
  }
});

test('Dom jest jednym wpisem z parametrami Black Tri-Stars i Żołnierza Zeonu', () => {
  assert.equal(bySlug.has('dom-zolnierz-zeonu'), false, 'stary slug nie wraca');
  const dom = bySlug.get('dom');
  assert.equal(dom.tytul, 'Dom');
  assert.deepEqual(dom.piloci, ['gaia', 'ortega', 'mash', 'zolnierz-zeonu']);
  const warianty = profile(dom);
  assert.deepEqual(warianty.map((w) => w.profil), ['Dom (Black Tri-Stars)', 'Dom']);
  const sekcjaBt = sekcja(dom, 'Black Tri-Stars');
  const sekcjaSzeregowcow = sekcja(dom, 'Żołnierz Zeonu');
  assert.match(sekcjaBt, /1900/);
  assert.match(sekcjaSzeregowcow, /1500/);
  assert.equal((dom.body.match(/^!\[/gm) ?? []).length, 4, 'wspólna galeria czterech ujęć');
  assert.ok(dom.body.includes('Dom%20Generic.png'));
});

test('modele różniące się kolorem albo uzbrojeniem zostają osobnymi stronami', () => {
  const osobne = ['gelgoog', 'gelgoog-char', 'zaku-ii-char',
    'bolt-robo-standard', 'bolt-robo-melee', 'bolt-robo-long-range', 'bolt-robo-anti-air',
    'kampfer-bazooka', 'kampfer-high-mobility'];
  for (const slug of osobne) {
    assert.ok(bySlug.has(slug), `${slug}: własna strona`);
    assert.equal((bySlug.get(slug).w_gre_dodatkowe ?? []).length, 0, `${slug}: bez scalania`);
  }
  assert.notEqual(bySlug.get('gelgoog').tytul, bySlug.get('gelgoog-char').tytul);
});

test('każdy zestaw parametrów renderuje się jako tabelę z wierszami dostawy', () => {
  for (const slug of ['dom', 'gurren-lagann']) {
    const strona = bySlug.get(slug);
    const { html } = renderMarkdown(strona.body);
    const zestawy = profile(strona);
    assert.equal((html.match(/<table>/g) ?? []).length, zestawy.length, `${slug}: tyle tabel, ile profili`);
    for (const wariant of zestawy) {
      const bronie = [...wariant.dane.matchAll(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|/gm)].map((m) => m[1].trim());
      for (const bron of bronie) assert.ok(html.includes(`<td>${bron}</td>`), `${slug}: wiersz ${bron}`);
    }
  }
});

test('każdy dodatkowy profil ma dostawę, źródło i sekcję w treści', () => {
  for (const strona of strony) {
    for (const surowy of strona.w_gre_dodatkowe ?? []) {
      const wpis = JSON.parse(surowy);
      assert.ok(wpis.gra, `${strona.slug}: gra`);
      assert.ok(wpis.profil, `${strona.slug}: profil`);
      assert.ok(wpis.dane, `${strona.slug}: dane`);
      assert.ok(wpis.dostawa.startsWith('dostawy/'), `${strona.slug}: dostawa`);
      assert.ok(fs.existsSync(path.join(ROOT, wpis.dostawa)), `${strona.slug}: plik ${wpis.dostawa}`);
      assert.doesNotMatch(strona.body, /## Parametry — \n/, `${strona.slug}: nazwana sekcja`);
      assert.equal((strona.body.match(/## Parametry — /g) ?? []).length, profile(strona).length,
        `${strona.slug}: liczba sekcji odpowiada liczbie profili`);
    }
  }
});
