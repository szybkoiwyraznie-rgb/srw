/**
 * Uczestnicy dostaw: serie i załogi wpisane w dostawach na twardo.
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
 * Tak samo wiążąca jest załoga: lista jednostek misji podaje przy każdej
 * pilota głównego i pilotów wspierających
 * (`- **Jednostka** — pilot główny: X — piloci wspierający w misji: A, B`).
 * Mech ma ich wszystkich w polu `piloci`, a każdy z nich ma mecha w `mechy`.
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

/** Wpisy w miejscu pilota, które nie są osobą: rekord bez pilota albo głos bez imienia. */
const BRAK_PILOTA = [/^brak$/i, /^Brak przypisanego klucza pilota\b/i, /^\?+$/];

/** Dopisek, którym dostawa oznacza cel albo obiekt skryptowy zamiast pilotowanej maszyny. */
const NIEPILOTOWANA = /nie jest pilotowanym mechem/;

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

/** Wariant z zapisu „Rodzina (Wariant)”; wariant sam może mieć nawias: „Gurren Lagann (Gurren Lagann (Simon))”. */
const wariantNazwy = (nazwa) => String(nazwa ?? '').match(/^.*?\s*\((.*)\)$/)?.[1] ?? null;

/** Nazwa bez dopisku, którym dostawa rozróżnia zestawy danych tej samej jednostki. */
const bezWariantuDanych = (nazwa) => String(nazwa ?? '').replace(/\s+—\s+wariant danych \d+$/, '');

/**
 * Strony postaci i mechów odpowiadające nazwie z dostawy. Kolejno:
 * jawny inny zapis, profil jednostki w `w_gre`, tytuł strony, dla zapisu
 * „Rodzina (Wariant)” — tytuł równy wariantowi, a na końcu nazwa z listy
 * jednostek misji: wariant profilu („Brocken/Melee” to profil
 * „Brocken (Brocken/Melee)”) albo tytuł bez dopisku „— wariant danych N”.
 * `typ` zawęża szukanie do postaci albo mechów — w „Gurren Lagann (Simon)”
 * wariantem jest imię pilota, a chodzi o maszynę.
 */
export function stronyUczestnika(nazwa, gra, strony, { typ = null } = {}) {
  const encje = strony.filter((s) => (typ ? s.typ === typ : s.typ === 'postac' || s.typ === 'mech'));
  if (INNE_ZAPISY_NAZW[nazwa]) return encje.filter((s) => s.slug === INNE_ZAPISY_NAZW[nazwa]);

  const poProfilu = encje.filter((s) => profilWGrze(s, gra) === nazwa);
  if (poProfilu.length) return poProfilu;

  const szukana = normalizujNazwe(nazwa);
  const poTytule = encje.filter((s) => normalizujNazwe(s.tytul) === szukana);
  if (poTytule.length) return poTytule;

  const wariant = wariantNazwy(nazwa);
  if (wariant) {
    const poWariancie = encje.filter((s) => normalizujNazwe(s.tytul) === normalizujNazwe(wariant));
    if (poWariancie.length) return poWariancie;
  }

  const poWariancieProfilu = encje.filter((s) => {
    const profil = profilWGrze(s, gra);
    return profil && normalizujNazwe(wariantNazwy(profil)) === szukana;
  });
  if (poWariancieProfilu.length) return poWariancieProfilu;

  return encje.filter((s) => (s.gry ?? []).includes(gra)
    && [s.tytul, profilWGrze(s, gra)].some((n) => n && n !== bezWariantuDanych(n) && normalizujNazwe(bezWariantuDanych(n)) === szukana));
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

/**
 * Załogi z jednego pliku dostawy:
 * `[{ jednostka, pilot, rola: 'główny' | 'wspierający', niepilotowana, wiersz }]`.
 * Wpisy bez osoby („brak”, „???”) są pomijane.
 */
export function zalogiZPliku(sciezka) {
  const linie = fs.readFileSync(sciezka, 'utf8').replace(/\r/g, '').split('\n');
  const wynik = [];
  linie.forEach((linia, i) => {
    const m = linia.match(/^\s*- \*\*(.+?)\*\* — pilot główny: (.+)$/);
    if (!m) return;
    const czesci = m[2].split(' — ').map((c) => c.trim());
    const wspierajacy = czesci
      .map((c) => c.match(/^piloci wspierający w (?:misji|presecie): (.+)$/)?.[1])
      .find(Boolean);
    const osoby = [[czesci[0], 'główny'], ...(wspierajacy ?? '').split(',').map((x) => [x.trim(), 'wspierający'])];
    for (const [pilot, rola] of osoby) {
      if (!pilot || BRAK_PILOTA.some((re) => re.test(pilot))) continue;
      wynik.push({ jednostka: m[1].trim(), pilot, rola, niepilotowana: NIEPILOTOWANA.test(m[2]), wiersz: i + 1 });
    }
  });
  return wynik;
}

/** Załogi ze wszystkich dostaw, z grą i plikiem. */
export function zalogiDostaw({ root = '.' } = {}) {
  const katalog = path.join(root, 'dostawy');
  const wynik = [];
  for (const gra of fs.readdirSync(katalog).sort()) {
    const katalogGry = path.join(katalog, gra);
    if (!fs.statSync(katalogGry).isDirectory()) continue;
    for (const plik of fs.readdirSync(katalogGry).sort()) {
      for (const z of zalogiZPliku(path.join(katalogGry, plik))) wynik.push({ ...z, gra, plik: `${gra}/${plik}` });
    }
  }
  return wynik;
}

/**
 * Porównanie załóg z dostaw z polami `piloci` (mech) i `mechy` (postać).
 * Cel skryptowy („nie jest pilotowanym mechem”) nie ma załogi — tam wymagane
 * jest odwrotnie: wpis z miejsca pilota nie trafia do `piloci`.
 */
export function porownajZalogi({ root = '.', strony = wczytajStrony({ root }) } = {}) {
  const raport = { par: 0, zgodnych: 0, nieznanaJednostka: [], nieznanyPilot: [], brakWPilotach: [], brakWMechach: [], zalogaCelu: [] };
  // Ta sama para wraca w wielu dostawach — rozbieżność zgłaszamy raz, z pierwszym miejscem.
  const zgloszone = new Set();
  const zglos = (lista, co, szczegoly) => {
    if (zgloszone.has(co)) return;
    zgloszone.add(co);
    lista.push(`${co} ${szczegoly}`);
  };

  for (const z of zalogiDostaw({ root })) {
    raport.par += 1;
    const gdzie = `${z.plik}:${z.wiersz}`;
    const mechy = stronyUczestnika(z.jednostka, z.gra, strony, { typ: 'mech' });
    if (mechy.length !== 1) {
      zglos(raport.nieznanaJednostka, `${z.gra}: jednostka „${z.jednostka}”`, `${mechy.length ? `pasuje do kilku stron: ${mechy.map((s) => s.slug).join(', ')}` : 'nie ma strony'} (${gdzie})`);
      continue;
    }
    const osoby = stronyUczestnika(z.pilot, z.gra, strony, { typ: 'postac' });
    if (osoby.length !== 1) {
      zglos(raport.nieznanyPilot, `${z.gra}: pilot „${z.pilot}”`, `${osoby.length ? `pasuje do kilku stron: ${osoby.map((s) => s.slug).join(', ')}` : 'nie ma strony'} (${gdzie})`);
      continue;
    }
    const [mech] = mechy;
    const [pilot] = osoby;
    const wPilotach = (mech.piloci ?? []).includes(pilot.slug);
    if (z.niepilotowana) {
      if (wPilotach) zglos(raport.zalogaCelu, `${mech.slug}: pole piloci wymienia ${pilot.slug},`, `a dostawa oznacza „${z.jednostka}” jako cel skryptowy (${gdzie})`);
      else raport.zgodnych += 1;
      continue;
    }
    const wMechach = (pilot.mechy ?? []).includes(mech.slug);
    const zDostawy = `— dostawa: „${z.jednostka}”, pilot ${z.rola} ${z.pilot} (${gdzie})`;
    if (!wPilotach) zglos(raport.brakWPilotach, `${mech.slug}: pole piloci nie wymienia ${pilot.slug}`, zDostawy);
    if (!wMechach) zglos(raport.brakWMechach, `${pilot.slug}: pole mechy nie wymienia ${mech.slug}`, zDostawy);
    if (wPilotach && wMechach) raport.zgodnych += 1;
  }
  return raport;
}

/** Nazwy list raportu załóg, które oznaczają rozbieżność. */
export const RODZAJE_ROZBIEZNOSCI_ZALOG = ['nieznanaJednostka', 'nieznanyPilot', 'brakWPilotach', 'brakWMechach', 'zalogaCelu'];

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raport = porownajZBaza();
  const zalogi = porownajZalogi();
  const problemy = [
    ...RODZAJE_ROZBIEZNOSCI.flatMap((rodzaj) => raport[rodzaj].map((opis) => `[${rodzaj}] ${opis}`)),
    ...RODZAJE_ROZBIEZNOSCI_ZALOG.flatMap((rodzaj) => zalogi[rodzaj].map((opis) => `[${rodzaj}] ${opis}`)),
  ];
  console.log(`Przypisań „nazwa → seria” w dostawach: ${raport.przypisan}; zgodnych z bazą: ${raport.zgodnych}.`);
  console.log(`Par „jednostka — pilot” w listach misji: ${zalogi.par}; zgodnych z bazą: ${zalogi.zgodnych}.`);
  for (const p of problemy) console.log(p);
  process.exit(problemy.length ? 1 : 0);
}
