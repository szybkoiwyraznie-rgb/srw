/**
 * „Ostatnia dostawa ma rację” (ADR 0044).
 *
 * Gdy dwie dostawy tej samej gry opisują tę samą parę (mech, gra) i podają RÓŻNE
 * dane, wiąże dostawa późniejsza: źródło w `w_gre` i treść strony pokazują jej
 * wartość, a wcześniejsza zostaje w archiwum jako stan historyczny. Gdy dane są
 * identyczne, źródłem zostaje dostawa, która wprowadziła blok — to nie jest
 * rozbieżność i test tego nie zgłasza.
 *
 * Przykład z sesji: „Dzieci Gettera” miało `Poz. nauki 99`, dopóki fabuła misji
 * 1-3A nie odblokowała umiejętności — od tej dostawy poziom to 1.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { wczytajStrony } from '../tools/content-loader.mjs';

/**
 * Kolejność chronologiczna dostaw jednej gry po numerze epizodu i misji
 * (np. `Y_dostawa_1_1C` < `dostawa_1_2a` < `dostawa_1_3a` < `Y_dostawa_1_4`),
 * niezależna od prefiksu nazwy pliku (`Y_`, `OE_`, `dostawa_`).
 */
const kluczDostawy = (plik) => {
  const m = plik.match(/(\d+)_(\d+)([a-z]*)/i);
  if (!m) return `0000_${plik.toLowerCase()}`;
  const dodatek = /dodatek|chats/i.test(plik) ? '1' : '0';
  return `${m[1].padStart(4, '0')}_${m[2].padStart(4, '0')}_${m[3].toLowerCase()}_${dodatek}_${plik.toLowerCase()}`;
};

const dostawyGry = (gra) => fs.readdirSync(path.join('dostawy', gra))
  .filter((p) => p.endsWith('.txt'))
  .sort((a, b) => kluczDostawy(a).localeCompare(kluczDostawy(b)));

const wczytaj = (gra, plik) => fs.readFileSync(path.join('dostawy', gra, plik), 'utf8').replace(/\r/g, '');

/**
 * Blok jednostki w części UCZESTNICY: od nagłówka (`##`/`###` — plik zbiorczy
 * używa poziomu 3 pod `## Mechy`) do najbliższego `---`.
 *
 * Nazwa w `w_gre.profil` bywa dłuższa niż nagłówek („Kampfer/Bazooka” wobec
 * `## Kampfer (Kampfer/Bazooka)`) albo odwrotnie („Dom (Black Tri-Stars)” wobec
 * `## Dom`), więc dopasowujemy po treści nagłówka, nie po równości znaków.
 */
function blokJednostki(tekst, profil) {
  const nazwa = profil.split(' — ')[0].trim();
  if (!nazwa) return null;
  const naglowki = [...tekst.matchAll(/^(#{2,3}) ([^\n]+)$/gm)]
    .map((m) => ({ poziom: m[1].length, tytul: m[2].trim(), indeks: m.index }));
  // Rekord jednostki ma pierwszeństwo przed sceną o tej samej nazwie: skrypt
  // misji używa `##`/`###` także na nagłówki lokacji i dialogów.
  const trafienia = naglowki.filter(({ tytul, poziom }) => {
    if (poziom === 2) {
      return tytul === nazwa
        || tytul.startsWith(`${nazwa} — `)
        || tytul.endsWith(`(${nazwa})`);
    }
    // Poziom 3 to rekord w pliku zbiorczym: „Gundam (Gundam (Keroro))”,
    // „Zaku II (Zaku II/Bazooka)” — profil bywa pełną nazwą w nawiasie.
    return tytul === nazwa || tytul.startsWith(`${nazwa} (`) || tytul.startsWith(`${nazwa}/`)
      || tytul.endsWith(`(${nazwa})`);
  });
  const wybrany = trafienia.find(({ poziom, tytul }) => poziom === 2 && tytul === nazwa)
    ?? trafienia.find(({ poziom, tytul }) => poziom === 2 && tytul.startsWith(`${nazwa} — `))
    ?? trafienia.find(({ poziom }) => poziom === 2)
    ?? trafienia[0];
  if (!wybrany) return null;
  const koniec = tekst.indexOf('\n---', wybrany.indeks);
  // Pomijamy sam wiersz nagłówka (`## Dynazenon — wariant danych 1` vs `## Dynazenon`),
  // bo nie jest daną jednostki. Szerokość kolumn, przecinki i inne znaki
  // interpunkcyjne też nie są danymi — porównujemy wartości (liczby i słowa).
  const startTresc = tekst.indexOf('\n', wybrany.indeks);
  const surowy = startTresc < 0 ? '' : tekst.slice(startTresc + 1, koniec < 0 ? undefined : koniec);
  // Gdy dostawa pomija opis encyklopedyczny albo skraca go do „opis przy pierwszym
  // wystąpieniu…”, porównujemy parametry/zdolności/broń — sam skrót nie zmienia danych.
  const bezEnc = !/\*\*Encyklopedia:\*\*/.test(surowy)
    || /\*\*Encyklopedia:\*\*[^\n]*opis przy pierwszym wystąpieniu/.test(surowy);
  const normalizuj = (s) => s.split('\n').map((l) => l.replace(/[\s|,.;:]+/g, ' ').trim())
    .filter((l) => l && !/^[-\s|:]+$/.test(l)).join('\n');
  return {
    pelny: normalizuj(surowy),
    bezEncyklopedii: normalizuj(surowy.replace(/\*\*Encyklopedia:\*\*[\s\S]*?(?=\n\| |\n### |$)/, '')),
    maSkrotEncyklopedii: bezEnc,
  };
}

/**
 * Profile, które nie są rekordem jednostki w żadnej dostawie — opis powstały
 * z treści misji. Nie ma czego porównywać, ale trzymamy je tu jawnie, żeby
 * przyszła ślepota testu nie schowała się po cichu.
 */
const profileBezRekordu = new Set(['RX-78NT-1 Alex (informacje z misji)']);

const strony = wczytajStrony();

test('para (mech, gra) ma dane z najpóźniejszej dostawy, która podaje INNE dane', () => {
  const problemy = [];
  let porownan = 0;
  for (const mech of strony.filter((s) => s.typ === 'mech')) {
    for (const [gra, surowy] of Object.entries(mech.w_gre ?? {})) {
      let wpis;
      try { wpis = typeof surowy === 'string' ? JSON.parse(surowy) : surowy; } catch { continue; }
      const uzyta = wpis?.dostawa;
      if (!uzyta || uzyta === 'menu') continue;
      const profil = wpis.profil ?? '';
      if (profileBezRekordu.has(profil)) continue;
      const biezacy = blokJednostki(wczytaj(gra, path.basename(uzyta)), profil);
      if (!biezacy) continue;
      const kolejnosc = dostawyGry(gra);
      const pozycja = kolejnosc.indexOf(path.basename(uzyta));
      for (const plik of pozycja >= 0 ? kolejnosc.slice(pozycja + 1) : []) {
        const inny = blokJednostki(wczytaj(gra, plik), profil);
        if (!inny) continue;
        porownan += 1;
        const rozne = (biezacy.maSkrotEncyklopedii || inny.maSkrotEncyklopedii)
          ? inny.bezEncyklopedii !== biezacy.bezEncyklopedii
          : inny.pelny !== biezacy.pelny;
        if (!rozne) continue;
        problemy.push(`${mech.slug}: dane z ${gra}/${path.basename(uzyta)}, a późniejsza ${gra}/${plik} podaje inny blok „${profil}”`);
      }
    }
  }
  // Strażnik samego testu: gdyby zmienił się format dostaw, nie ma udawać, że wszystko gra.
  assert.ok(porownan >= 70, `test musi realnie porównywać bloki (porównań: ${porownan})`);
  assert.deepEqual([...new Set(problemy)], [], 'nowsza dostawa z innymi danymi jest źródłem pary (mech, gra) — ADR 0044 pkt 1');
});

test('wartości z wcześniejszej dostawy nie wracają do treści strony', () => {
  // Strażnik konkretnego przypadku z sesji: „Dzieci Gettera” ma poziom z misji 1-3A.
  for (const slug of ['takuma-nagare', 'baku-yamagishi', 'show-kamui']) {
    const strona = strony.find((s) => s.slug === slug);
    assert.ok(strona, `${slug}: strona pilota Gettera`);
    const wiersz = strona.body.match(/\|\s*1\s*\|\s*Dzieci Gettera\s*\|\s*(\d+)\s*\|/);
    assert.ok(wiersz, `${slug}: wiersz „Dzieci Gettera”`);
    assert.equal(wiersz[1], '1', `${slug}: poziom z ostatniej dostawy (1-3A), nie 99 z dodatku`);
  }
  // Dodatek zachowuje swoją wartość jako archiwum — surowa dostawa jest nietykalna.
  assert.match(wczytaj('srw-y', 'Y_dostawa_1_2a_dodatek.txt'), /Dzieci Gettera\s*\|\s*99\s*\|/,
    'archiwum dodatku 1-2A zostaje bez zmian');
});
