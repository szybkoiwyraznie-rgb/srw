/**
 * Tła z pierwowzorów dla stron, które dotąd miały tylko materiał z gry.
 *
 * Reguły: tło siedzi w osobnym bloku `{{zrodlo gra=wspolne}}` za wydarzeniami
 * z gry (ADR 0008, ADR 0013), każdy adres z bloku jest w `zrodla` (ADR 0018),
 * a treść nie wyprzedza fabuły — losy postaci i maszyn zostają poza bazą
 * do czasu, aż pokaże je rozgrywka (ADR 0012).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));

// Zdania o śmierci, przegranej i dalszych losach to materiał na późniejsze misje.
const spoilery = /gin(ie|ą)|zgin|śmier|poleg|zabit|ocala|zostaje zniszczon/i;

function sprawdzBlok(slug, adresy) {
  const page = bySlug.get(slug);
  assert.ok(page, `${slug}: strona istnieje`);
  const blok = page.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
  assert.ok(blok, `${slug}: blok tła z pierwowzoru`);
  assert.match(blok[1], /pierwowzor/i, `${slug}: tło oddzielone od wydarzeń gry`);
  assert.match(blok[1], /sprawdzono 2026-10-24\)/, `${slug}: data sprawdzenia źródła`);
  assert.doesNotMatch(blok[1], spoilery, `${slug}: tło nie wyprzedza fabuły`);
  for (const adres of adresy) {
    assert.ok(page.zrodla.includes(adres), `${slug}: ${adres} w frontmatterze`);
    assert.ok(blok[1].includes(adres), `${slug}: ${adres} przy informacji`);
  }
  assert.ok(page.body.indexOf('{{skrypt') < page.body.indexOf('{{zrodlo'),
    `${slug}: wydarzenia z gry przed tłem z pierwowzoru`);
  return blok[1];
}

test('obsada SV2 ma tło z pierwowzoru (ADR 0008, ADR 0013)', () => {
  const wiki = 'https://en.wikipedia.org/wiki/List_of_Patlabor_characters';
  for (const slug of ['asuma-shinohara', 'kiichi-goto', 'kanuka-clancy',
    'mikiyasu-shinshi', 'hiromi-yamazaki']) {
    sprawdzBlok(slug, [wiki]);
  }
  assert.match(bySlug.get('asuma-shinohara').body, /synem prezesa Shinohara Heavy Industries/);
  assert.match(bySlug.get('kiichi-goto').body, /dzielnicy Taitō/);
  assert.match(bySlug.get('kanuka-clancy').body, /policji nowojorskiej/);
  assert.match(bySlug.get('mikiyasu-shinshi').body, /jako jedyny w jednostce jest żonaty/);
  assert.match(bySlug.get('hiromi-yamazaki').body, /pochodzi z Okinawy/);
});

test('Labory misji 1-1 mają tło techniczne z pierwowzoru (ADR 0008, ADR 0013)', () => {
  const ingram = 'https://www.mahq.net/av-98-ova/';
  const ingramWiki = 'https://patlabor.fandom.com/wiki/AV-98_Ingram';
  const helldiver = 'https://www.mahq.net/arl-99-tv/';
  const helldiverWiki = 'https://patlabor.fandom.com/wiki/ARL-99_Helldiver';
  const hal = 'https://www.mahq.net/hal-x-10-tv/';
  const halWiki = 'https://patlabor.fandom.com/wiki/HAL_X-10';
  const halWikiEs = 'https://patlabormechanime.fandom.com/es/wiki/HAL_X-10';
  sprawdzBlok('ingram-nr-1', [ingram, ingramWiki]);
  sprawdzBlok('ingram-nr-2', [ingram, ingramWiki]);
  sprawdzBlok('helldiver', [helldiver, helldiverWiki]);
  sprawdzBlok('hal-x10', [hal, halWikiEs]);
  sprawdzBlok('hal-x10-green', [hal, halWiki]);
  // Każda strona wnosi inne fakty, a nie powtórzenie tej samej notki.
  assert.match(bySlug.get('ingram-nr-1').body, /palec po palcu/);
  assert.match(bySlug.get('ingram-nr-2').body, /pancerz reaktywny/);
  assert.match(bySlug.get('helldiver').body, /worek spadochronowy/);
  assert.match(bySlug.get('hal-x10').body, /czterech nogach z wbudowanymi kołami/);
  assert.match(bySlug.get('hal-x10-green').body, /zamalowują jej\s*\n?\s*oznaczenia farbą/);
  // Dwie odmiany HAL-X10 opisują dwa różne pierwowzory (ADR 0013).
  assert.match(bySlug.get('hal-x10').body, /W kinowym/);
  assert.match(bySlug.get('hal-x10-green').body, /W serialowym/);
});
