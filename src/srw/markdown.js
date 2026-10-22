/**
 * Renderer markdown → HTML (świadomy podzbiór, ADR 0002).
 *
 * Obsługiwane: nagłówki #..####, akapity, **pogrubienie**, *kursywa*,
 * `kod`, [link](url), [[wikilink]] i [[wikilink|etykieta]] (przez resolver),
 * listy -/1., cytaty >, tabele pipe, pozioma linia ---, obrazy ![alt](src),
 * oraz blok `:::skrypt ... :::` na surowy tekst (ściany skryptu epizodu).
 *
 * Poziom wiarygodności (ADR 0011) zaznacza się na fragmencie, nie na stronie:
 *   {{zrodlo\n ...treść...\n}}
 * gdzie nazwa to skrypt | menu | zrodlo | wiedza. Każdy fragment treści strony
 * (akapit, lista, tabela, cytat, obraz, skrypt) musi być w takim bloku, gdy
 * `wymagajPoziomu` jest włączone. Nagłówki są neutralne (tytuły sekcji).
 *
 * Zasady bezpieczeństwa: cała treść jest escapowana na wejściu, dopiero
 * potem dodajemy własne tagi. Martwy wikilink NIE jest cichy — renderer
 * zgłasza problem, a build kończy się czerwono.
 */

import { SLUG_RE, WIKILINK_RE } from './links.js';

/** Poziomy wiarygodności dozwolone w bloku {{...}} (ADR 0010, 0011). */
export const POZIOMY_BLOKU = ['skrypt', 'menu', 'zrodlo', 'wiedza'];

/** Atrybuty dozwolone w otwarciu bloku poziomu (ADR 0020). */
export const ATRYBUTY_BLOKU = ['gra'];

/** Wartość `gra`, która oznacza informacje wspólne dla wszystkich tytułów. */
export const ZAKRES_WSPOLNY = 'wspolne';

/**
 * Otwarcie bloku poziomu: `{{poziom}}` albo z atrybutami, np. `{{menu gra=srw-oe`.
 * Atrybuty są rozdzielone spacjami; wartość może być w cudzysłowie.
 */
export const BLOK_OTWARCIA_RE = /^\{\{(\w+)((?:\s+[A-Za-z][\w-]*=(?:"[^"]*"|[^\s}]+))*)\s*$/;

/** Zamienia ciąg atrybutów (` gra=srw-oe`) na mapę nazwa → wartość. */
export function parsujAtrybutyBloku(tekst) {
  const atrybuty = new Map();
  for (const m of String(tekst ?? '').matchAll(/([A-Za-z][\w-]*)=(?:"([^"]*)"|([^\s}]+))/g)) {
    atrybuty.set(m[1], m[2] ?? m[3]);
  }
  return atrybuty;
}

export function renderMarkdown(md, {
  resolveLink, wymagajPoziomu = false, wPoziomie = null, wZagniezdzeniu = false,
  atrybutyNaglowka = null,
} = {}) {
  const linie = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const problemy = [];
  let i = 0;

  // każdy fragment poza blokiem poziomu jest błędem, gdy wymagajPoziomu (ADR 0011)
  const dodaj = (html) => {
    if (wymagajPoziomu && wPoziomie === null) {
      problemy.push('fragment treści bez poziomu wiarygodności — zaznacz blokiem {{skrypt|menu|zrodlo|wiedza}}');
    }
    out.push(html);
  };

  while (i < linie.length) {
    const linia = linie[i];

    if (linia.trim() === '') { i += 1; continue; }

    // blok poziomu wiarygodności {{poziom ... }} (ADR 0011), z opcjonalnym zakresem gry (ADR 0020)
    const otwarcie = linia.trim().match(BLOK_OTWARCIA_RE);
    if (otwarcie) {
      const poziom = otwarcie[1];
      const atrybuty = parsujAtrybutyBloku(otwarcie[2]);
      i += 1;
      const buf = [];
      while (i < linie.length && linie[i].trim() !== '}}') { buf.push(linie[i]); i += 1; }
      if (i >= linie.length) problemy.push(`niezamknięty blok {{${poziom}`);
      i += 1; // zamknięcie
      if (!POZIOMY_BLOKU.includes(poziom)) {
        problemy.push(`nieznany poziom w bloku {{${poziom}: dozwolone ${POZIOMY_BLOKU.join(', ')}`);
        continue;
      }
      if (wZagniezdzeniu) {
        problemy.push(`zagnieżdżony blok {{${poziom} — bloki poziomu nie mogą się zagnieżdżać`);
        continue;
      }
      const wewn = renderMarkdown(buf.join('\n'), { resolveLink, wymagajPoziomu, wPoziomie: poziom, wZagniezdzeniu: true, atrybutyNaglowka });
      problemy.push(...wewn.problemy);
      const zakres = zakresGry(atrybuty, { poziom, resolveLink, problemy });
      out.push(`<div class="fragment poziom poziom-${poziom}"${zakres.atrybuty}>\n${zakres.etykieta}${wewn.html}\n</div>`);
      continue;
    }

    // blok surowy :::skrypt ... :::
    if (/^:::/.test(linia.trim())) {
      const buf = [];
      i += 1;
      while (i < linie.length && !/^:::/.test(linie[i].trim())) { buf.push(linie[i]); i += 1; }
      i += 1; // zamknięcie
      // Dosłowny tekst skryptu wyświetlany jako formatowanie wizualne (znaczniki md → nagłówki, pogrubienia, cytaty).
      // Źródło pozostaje dosłowne: wierność sprawdza wytnijBlokSkryptu na surowym tekście.
      const wewn = renderMarkdown(buf.join('\n'), { resolveLink, wymagajPoziomu, wPoziomie, wZagniezdzeniu: true, atrybutyNaglowka });
      problemy.push(...wewn.problemy);
      dodaj(`<div class="skrypt-tekst">\n${wewn.html}\n</div>`);
      continue;
    }

    // pozioma linia
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(linia.trim())) { out.push('<hr>'); i += 1; continue; }

    // nagłówek
    const h = linia.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const poz = h[1].length;
      const wewn = inline(h[2]);
      // Kotwica i odsyłacz wewnątrz nagłówka (np. spis podsekcji sceny).
      const opis = atrybutyNaglowka?.(poz, h[2].trim(), wewn) ?? null;
      const atrybut = opis?.id ? ` id="${escapeHtml(opis.id)}"` : '';
      out.push(`<h${poz}${atrybut}>${opis?.wewnetrzny ?? wewn}</h${poz}>`);
      i += 1; continue;
    }

    // cytat blokowy
    if (/^>\s?/.test(linia)) {
      const buf = [];
      while (i < linie.length && /^>\s?/.test(linie[i])) {
        buf.push(linie[i].replace(/^>\s?/, ''));
        i += 1;
      }
      dodaj(`<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`);
      continue;
    }

    // tabela pipe
    // Zapis zalecany to `\|` w komórce, ale pionek wewnątrz wikilinku
    // ([[slug|etykieta]]) i tak nie dzieli wiersza — inaczej jedna nieuwaga
    // rozjeżdża całą tabelę względem nagłówka.
    if (bezPip(linia.trim()).startsWith('|') && bezPip(linie[i + 1] ?? '').match(/^\s*\|[\s:|-]+\|\s*$/)) {
      const komorki = podzielKomorki;
      const naglowki = komorki(linia);
      i += 2;
      const wiersze = [];
      while (i < linie.length && bezPip(linie[i].trim()).startsWith('|')) {
        wiersze.push(komorki(linie[i]));
        i += 1;
      }
      dodaj(
        '<div class="tabela-owijka"><table><thead><tr>' +
        naglowki.map((c) => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        wiersze.map((w) => '<tr>' + w.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>',
      );
      continue;
    }

    // listy
    if (/^\s*[-*]\s+/.test(linia) || /^\s*\d+\.\s+/.test(linia)) {
      const uporzadkowana = /^\s*\d+\.\s/.test(linia);
      const elementy = [];
      while (i < linie.length) {
        // pusta linia między pozycjami nie kończy listy, jeśli dalej jest jej pozycja
        if (linie[i].trim() === '' && elementy.length > 0) {
          const dalej = linie.slice(i + 1).find((l) => l.trim() !== '');
          if (dalej !== undefined && /^\s*(?:[-*]|\d+\.)\s+/.test(dalej)) { i += 1; continue; }
          break;
        }
        if (!(/^\s*[-*]\s+/.test(linie[i]) || /^\s*\d+\.\s+/.test(linie[i]) || (elementy.length > 0 && sLinia(linie[i])))) break;
        // Kontynuacja pozycji (bez znacznika listy, bez pustej linii) dokleja się
        // do poprzedniego elementu — inaczej zawijany tekst rozpada się na „sieroty”.
        if (elementy.length > 0 && !/^\s*(?:[-*]|\d+\.)\s+/.test(linie[i])) {
          elementy[elementy.length - 1] += ' ' + linie[i].trim();
        } else {
          elementy.push(linie[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''));
        }
        i += 1;
      }
      const tag = uporzadkowana ? 'ol' : 'ul';
      dodaj(`<${tag}>${elementy.map((e) => `<li>${inline(e)}</li>`).join('')}</${tag}>`);
      continue;
    }

    // akapit
    const buf = [linia];
    i += 1;
    while (
      i < linie.length && linie[i].trim() !== '' &&
      !/^(#{1,4}\s|>\s?|\s*[-*]\s|\s*\d+\.\s|-{3,}$|:::)/.test(linie[i]) &&
      !bezPip(linie[i].trim()).startsWith('|')
    ) {
      buf.push(linie[i]);
      i += 1;
    }
    dodaj(`<p>${inline(buf.join(' '))}</p>`);
  }

  return { html: out.join('\n'), problemy };

  function inline(tekst) {
    let t = escapeHtml(tekst);

    // wikilinki PRZED linkami markdown
    t = t.replace(WIKILINK_RE, (cały, slugRaw, etykietaRaw) => {
      const slug = slugRaw.trim();
      const etykieta = etykietaRaw ? etykietaRaw.trim() : slug;
      if (!resolveLink) return escapeHtml(etykieta);
      const cel = resolveLink(slug);
      if (!cel) {
        problemy.push(`martwy wikilink: [[${slug}]]`);
        return `<span class="martwy-link" data-slug="${escapeHtml(slug)}">${escapeHtml(etykieta)}</span>`;
      }
      return `<a href="${cel.href}" title="${escapeHtml(cel.tytul)}">${escapeHtml(etykieta)}</a>`;
    });

    // obrazy ![alt](src) — kliknięcie otwiera podgląd na pełnym ekranie (podglad.js).
    // Przycisk zamiast samego <img>: obsługa klawiatury i czytnika ekranu bez JS-owych atrap.
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (cały, alt, src) =>
      `<button type="button" class="ilustracja-otworz" data-pelny-ekran>` +
      `<img src="${src}" alt="${alt}" loading="lazy" decoding="async"></button>`);

    // linki [tekst](url) — tylko http(s) i # (blokujemy javascript: itp.)
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (cały, tekst, url) => {
      if (!/^(https?:\/\/|[#/])/.test(url)) return tekst;
      const zewnetrzny = url.startsWith('http');
      const atrybuty = zewnetrzny ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${url}"${atrybuty}>${tekst}</a>`;
    });

    // kod inline
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');

    // pogrubienie i kursywa
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return t;
  }
}


/**
 * Etykieta zakresu gry dla bloku treści (ADR 0020).
 *
 * `gra=<slug>` pokazuje przy fragmencie nazwę gry z odsyłaczem; `gra=wspolne`
 * oznacza informacje wspólne dla wszystkich tytułów. Atrybuty są przepisywane
 * do DOM, żeby podgląd ilustracji i testy mogły odczytać zakres bez zgadywania.
 */
function zakresGry(atrybuty, { poziom, resolveLink, problemy }) {
  for (const klucz of atrybuty.keys()) {
    if (!ATRYBUTY_BLOKU.includes(klucz)) {
      problemy.push(`nieznany atrybut "${klucz}" w bloku {{${poziom}}} — dozwolone: ${ATRYBUTY_BLOKU.join(', ')}`);
    }
  }

  const gra = (atrybuty.get('gra') ?? '').trim();
  if (gra === '') return { atrybuty: '', etykieta: '' };

  if (gra === ZAKRES_WSPOLNY) {
    return {
      atrybuty: ` data-gra="${ZAKRES_WSPOLNY}" data-gra-nazwa="Wspólne"`,
      etykieta: '<p class="zakres-gry"><span title="Informacje wspólne dla wszystkich tytułów">Wspólne</span></p>\n',
    };
  }

  if (!SLUG_RE.test(gra)) {
    problemy.push(`niepoprawny slug gry "${gra}" w bloku {{${poziom}}} — dozwolone małe litery, cyfry i myślniki`);
    return { atrybuty: '', etykieta: '' };
  }

  const cel = resolveLink?.(gra);
  if (resolveLink && !cel) {
    problemy.push(`nieznana gra "${gra}" w bloku {{${poziom}}}`);
    return { atrybuty: '', etykieta: '' };
  }
  if (cel && cel.typ !== 'gra') {
    problemy.push(`zakres gry w bloku {{${poziom}}} → "${gra}" ma typ "${cel.typ}", oczekiwano "gra"`);
    return { atrybuty: '', etykieta: '' };
  }

  const nazwa = cel?.tytul ?? gra;
  const etykieta = cel
    ? `<p class="zakres-gry"><a href="${cel.href}">${escapeHtml(nazwa)}</a></p>\n`
    : `<p class="zakres-gry"><span>${escapeHtml(nazwa)}</span></p>\n`;

  return {
    atrybuty: ` data-gra="${escapeHtml(gra)}" data-gra-nazwa="${escapeHtml(nazwa)}"`,
    etykieta,
  };
}

/** Linia, która może być kontynuacją poprzedniego elementu listy (nie blok). */
const sLinia = (l) =>
  String(l).trim() !== '' &&
  !/^(#{1,4}\s|>\s?|:::|-{3,}$|\*{3,}$|_{3,}$)/.test(l.trim()) &&
  !bezPip(l.trim()).startsWith('|');

/** Placeholder dla escapowanego pionka w tabelach (patrz `bezPip`). */
const PIPE_PLACEHOLDER = '\u0001';
const bezPip = (s) => String(s).replace(/\\\|/g, PIPE_PLACEHOLDER);
const przywrocPip = (s) => String(s).replaceAll(PIPE_PLACEHOLDER, '|');

/**
 * Dzieli wiersz tabeli na komórki. Pionek wewnątrz `[[slug|etykieta]]`
 * jest częścią odsyłacza, nie separatorem kolumn — także wtedy, gdy autor
 * nie escapował go jako `\|`.
 */
function podzielKomorki(wiersz) {
  const t = bezPip(String(wiersz).trim()).replace(/^\|/, '').replace(/\|$/, '');
  const komorki = [];
  let biezaca = '';
  let wLinku = false;
  for (let j = 0; j < t.length; j += 1) {
    const ch = t[j];
    if (!wLinku && ch === '[' && t[j + 1] === '[') { wLinku = true; biezaca += '[['; j += 1; continue; }
    if (wLinku && ch === ']' && t[j + 1] === ']') { wLinku = false; biezaca += ']]'; j += 1; continue; }
    if (ch === '|' && !wLinku) { komorki.push(przywrocPip(biezaca.trim())); biezaca = ''; continue; }
    biezaca += ch;
  }
  komorki.push(przywrocPip(biezaca.trim()));
  return komorki;
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
