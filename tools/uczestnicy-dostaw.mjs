/**
 * Uczestnicy dostaw: przypisania „nazwa → seria” wpisane w dostawach na twardo.
 *
 * Każda dostawa misji podaje postacie i jednostki razem z serią, z której
 * pochodzą. To przypisanie jest wiążące dla bazy (ADR 0037): strona ma mieć
 * dokładnie tę serię, a gdy dostawa serii nie podaje — nie mieć żadnej.
 *
 * Dostawa zapisuje serię w trzech postaciach:
 *   - sekcja jednostki:   `## Nazwa` albo `## Rodzina (Wariant)` + `**Seria:** X`,
 *   - sekcja pilota:      `#### Nazwa` + `- **Seria:** X` (+ `- **Nazwa skrócona:** Y`),
 *   - tabela dodatku:     wiersz z kolumną „Seria” (postacie niebojowe i portretowe).
 *
 * Moduł czyta wyłącznie `dostawy/` i strony bazy; niczego nie zmienia.
 * Uruchomiony z wiersza poleceń wypisuje rozbieżności:
 *
 *   node tools/uczestnicy-dostaw.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony } from './content-loader.mjs';

/** Wartości pola „Seria”, którymi dostawa mówi, że serii nie podaje. */
const BRAK_SERII = [/^Brak wpisu\b/i, /^-+$/];

/**
 * Nazwy serii, których dostawa nie zapisuje tytułem strony serii.
 * SRW Y nazywa własny świat gry po prostu „Original”.
 */
const INNE_NAZWY_SERII = { Original: 'super-robot-wars-original' };

/**
 * Nazwy z dostaw, które w bazie noszą inny tytuł, bo dostawa je tłumaczy.
 * „SI sterująca” to polskie brzmienie profilu Control AI (ADR 0025 pkt 6).
 */
const INNE_ZAPISY_NAZW = { 'SI sterująca': 'control-ai' };

/** Porównywanie nazw bez wielkości liter, znaków diakrytycznych i interpunkcji. */
export const normalizujNazwe = (x) => String(x ?? '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/ł/g, 'l')
  .replace(/[^a-z0-9]+/g, ' ').trim();

/** Przypisania z jednego pliku dostawy: `[{ rodzaj, nazwa, seria, skrot, wiersz }]`. */
export function przypisaniaZPliku(sciezka) {
  const linie = fs.readFileSync(sciezka, 'utf8').replace(/\r/g, '').split('\n');
  const wynik = [];
  let naglowek = null;
  let kolumny = null;
  for (let i = 0; i < linie.length; i++) {
    const linia = linie[i];
    const h = linia.match(/^#{1,6}\s+(.*?)\s*$/);
    if (h) { naglowek = h[1]; kolumny = null; continue; }

    const s = linia.match(/^(?:[-*]\s+)?\*\*Seria:\*\*\s*(.+?)\s*$/);
    if (s && naglowek) {
      const skrot = linie.slice(i, i + 4)
        .map((x) => x.match(/\*\*Nazwa skrócona:\*\*\s*(.+?)\s*$/)).find(Boolean)?.[1] ?? null;
      wynik.push({ rodzaj: 'sekcja', nazwa: naglowek, seria: s[1], skrot, wiersz: i + 1 });
      continue;
    }

    if (linia.startsWith('|')) {
      const komorki = linia.split('|').slice(1, -1).map((x) => x.trim());
      if (!kolumny) {
        const iSeria = komorki.findIndex((x) => /^Seria$/i.test(x));
        kolumny = iSeria >= 0 ? { seria: iSeria } : { brak: true };
        continue;
      }
      if (kolumny.brak || /^[-: ]+$/.test(komorki.join(''))) continue;
      wynik.push({ rodzaj: 'tabela', nazwa: komorki[0], seria: komorki[kolumny.seria], skrot: null, wiersz: i + 1 });
    } else if (linia.trim() !== '') {
      kolumny = null;
    }
  }
  return wynik;
}

/**
 * Wszystkie przypisania z `dostawy/<gra>/`, zebrane po parze (gra, nazwa):
 * `[{ gra, nazwa, serie: Map(seria → [pliki]), skroty: Set }]`.
 * Nazwa z dwiema różnymi seriami ma `serie.size > 1` — to sprzeczność dostaw.
 */
export function przypisaniaDostaw({ root = '.' } = {}) {
  const katalog = path.resolve(root, 'dostawy');
  const zebrane = new Map();
  if (!fs.existsSync(katalog)) return [];
  for (const gra of fs.readdirSync(katalog).sort()) {
    const katalogGry = path.join(katalog, gra);
    if (!fs.statSync(katalogGry).isDirectory()) continue;
    for (const plik of fs.readdirSync(katalogGry).sort()) {
      if (!/\.(txt|md)$/.test(plik)) continue;
      for (const u of przypisaniaZPliku(path.join(katalogGry, plik))) {
        const klucz = `${gra}|${u.nazwa}`;
        if (!zebrane.has(klucz)) zebrane.set(klucz, { gra, nazwa: u.nazwa, serie: new Map(), skroty: new Set() });
        const wpis = zebrane.get(klucz);
        if (!wpis.serie.has(u.seria)) wpis.serie.set(u.seria, []);
        wpis.serie.get(u.seria).push(`dostawy/${gra}/${plik}:${u.wiersz}`);
        if (u.skrot) wpis.skroty.add(u.skrot);
      }
    }
  }
  return [...zebrane.values()];
}

/**
 * Seria z dostawy → slug strony serii.
 * `null` — dostawa serii nie podaje; `undefined` — nazwy nie ma wśród stron serii.
 */
export function slugSerii(nazwa, strony) {
  if (BRAK_SERII.some((re) => re.test(nazwa))) return null;
  if (INNE_NAZWY_SERII[nazwa]) return INNE_NAZWY_SERII[nazwa];
  const szukana = normalizujNazwe(nazwa);
  return strony.find((s) => s.typ === 'seria' && normalizujNazwe(s.tytul) === szukana)?.slug;
}

function profilWGrze(strona, gra) {
  const surowy = strona.w_gre?.[gra];
  if (!surowy) return null;
  try { return (typeof surowy === 'string' ? JSON.parse(surowy) : surowy).profil ?? null; } catch { return null; }
}

/**
 * Strony postaci i mechów odpowiadające nazwie z dostawy. Kolejno:
 * jawny inny zapis, profil jednostki w `w_gre`, tytuł strony, a dla zapisu
 * „Rodzina (Wariant)” — tytuł równy wariantowi.
 */
export function stronyUczestnika(nazwa, gra, strony) {
  const encje = strony.filter((s) => s.typ === 'postac' || s.typ === 'mech');
  if (INNE_ZAPISY_NAZW[nazwa]) return encje.filter((s) => s.slug === INNE_ZAPISY_NAZW[nazwa]);

  const poProfilu = encje.filter((s) => profilWGrze(s, gra) === nazwa);
  if (poProfilu.length) return poProfilu;

  const szukana = normalizujNazwe(nazwa);
  const poTytule = encje.filter((s) => normalizujNazwe(s.tytul) === szukana);
  if (poTytule.length) return poTytule;

  const wariant = nazwa.match(/^.*?\s*\((.*)\)$/)?.[1];
  if (wariant) return encje.filter((s) => normalizujNazwe(s.tytul) === normalizujNazwe(wariant));
  return [];
}

/**
 * Porównanie dostaw z bazą. Każda lista to osobny rodzaj rozbieżności;
 * wszystkie puste = baza respektuje serie z dostaw.
 */
export function porownajZBaza({ root = '.', strony = wczytajStrony({ root }) } = {}) {
  const raport = { przypisan: 0, zgodnych: 0, sprzeczne: [], nieznanaSeria: [], brakStrony: [], niejednoznaczne: [], zlaSeria: [], brakGry: [] };
  for (const wpis of przypisaniaDostaw({ root })) {
    raport.przypisan += 1;
    const gdzie = [...wpis.serie.values()].flat();
    if (wpis.serie.size > 1) {
      raport.sprzeczne.push(`${wpis.gra}: „${wpis.nazwa}” ma w dostawach różne serie: ${[...wpis.serie.keys()].join(' / ')}`);
      continue;
    }
    const [nazwaSerii] = wpis.serie.keys();
    const oczekiwana = slugSerii(nazwaSerii, strony);
    if (oczekiwana === undefined) {
      raport.nieznanaSeria.push(`${wpis.gra}: seria „${nazwaSerii}” („${wpis.nazwa}”, ${gdzie[0]}) nie ma strony w content/serie`);
      continue;
    }
    const trafione = stronyUczestnika(wpis.nazwa, wpis.gra, strony);
    if (trafione.length === 0) {
      raport.brakStrony.push(`${wpis.gra}: „${wpis.nazwa}” (${nazwaSerii}; ${gdzie[0]}) nie ma strony o tej nazwie`);
      continue;
    }
    if (trafione.length > 1) {
      raport.niejednoznaczne.push(`${wpis.gra}: „${wpis.nazwa}” pasuje do kilku stron: ${trafione.map((s) => s.slug).join(', ')}`);
      continue;
    }
    const [strona] = trafione;
    const jest = strona.seria ?? null;
    if (jest !== oczekiwana) {
      raport.zlaSeria.push(`${strona.slug}: dostawa podaje ${oczekiwana ? `serię „${nazwaSerii}” (${oczekiwana})` : `brak serii („${nazwaSerii}”)`}, strona ma ${jest ?? 'brak serii'} (${gdzie[0]})`);
      continue;
    }
    if (!(strona.gry ?? []).includes(wpis.gra)) {
      raport.brakGry.push(`${strona.slug}: dostawa gry ${wpis.gra} wymienia „${wpis.nazwa}”, a pole gry to [${(strona.gry ?? []).join(', ')}]`);
      continue;
    }
    raport.zgodnych += 1;
  }
  return raport;
}

/** Nazwy list raportu, które oznaczają rozbieżność. */
export const RODZAJE_ROZBIEZNOSCI = ['sprzeczne', 'nieznanaSeria', 'brakStrony', 'niejednoznaczne', 'zlaSeria', 'brakGry'];

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raport = porownajZBaza();
  const problemy = RODZAJE_ROZBIEZNOSCI.flatMap((rodzaj) => raport[rodzaj].map((opis) => `[${rodzaj}] ${opis}`));
  console.log(`Przypisań „nazwa → seria” w dostawach: ${raport.przypisan}; zgodnych z bazą: ${raport.zgodnych}.`);
  for (const p of problemy) console.log(p);
  process.exit(problemy.length ? 1 : 0);
}
