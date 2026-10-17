/**
 * Renderer markdown → HTML (świadomy podzbiór, ADR 0002).
 *
 * Obsługiwane: nagłówki #..####, akapity, **pogrubienie**, *kursywa*,
 * `kod`, [link](url), [[wikilink]] i [[wikilink|etykieta]] (przez resolver),
 * listy -/1., cytaty >, tabele pipe, pozioma linia ---, obrazy ![alt](src),
 * oraz blok `:::skrypt ... :::` na surowy tekst (ściany skryptu epizodu).
 *
 * Zasady bezpieczeństwa: cała treść jest escapowana na wejściu, dopiero
 * potem dodajemy własne tagi. Martwy wikilink NIE jest cichy — renderer
 * zgłasza problem, a build kończy się czerwono.
 */

import { WIKILINK_RE } from './links.js';

export function renderMarkdown(md, { resolveLink } = {}) {
  const linie = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const problemy = [];
  let i = 0;

  while (i < linie.length) {
    const linia = linie[i];

    if (linia.trim() === '') { i += 1; continue; }

    // blok surowy :::skrypt ... :::
    if (/^:::/.test(linia.trim())) {
      const buf = [];
      i += 1;
      while (i < linie.length && !/^:::/.test(linie[i].trim())) { buf.push(linie[i]); i += 1; }
      i += 1; // zamknięcie
      out.push(`<pre class="skrypt">${escapeHtml(buf.join('\n'))}</pre>`);
      continue;
    }

    // pozioma linia
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(linia.trim())) { out.push('<hr>'); i += 1; continue; }

    // nagłówek
    const h = linia.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const poz = h[1].length;
      out.push(`<h${poz}>${inline(h[2])}</h${poz}>`);
      i += 1; continue;
    }

    // cytat blokowy
    if (/^>\s?/.test(linia)) {
      const buf = [];
      while (i < linie.length && /^>\s?/.test(linie[i])) {
        buf.push(linie[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`);
      continue;
    }

    // tabela pipe
    // `\|` w komórce to literalny pionek — bez tego nie da się wstawić
    // wikilinku z etykietą ([[slug|etykieta]]) do tabeli.
    if (bezPip(linia.trim()).startsWith('|') && bezPip(linie[i + 1] ?? '').match(/^\s*\|[\s:|-]+\|\s*$/)) {
      const komorki = (w) => bezPip(w).trim().replace(/^\||\|$/g, '').split('|').map((c) => przywrocPip(c.trim()));
      const naglowki = komorki(linia);
      i += 2;
      const wiersze = [];
      while (i < linie.length && bezPip(linie[i].trim()).startsWith('|')) {
        wiersze.push(komorki(linie[i]));
        i += 1;
      }
      out.push(
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
      out.push(`<${tag}>${elementy.map((e) => `<li>${inline(e)}</li>`).join('')}</${tag}>`);
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
    out.push(`<p>${inline(buf.join(' '))}</p>`);
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

    // obrazy ![alt](src)
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (cały, alt, src) =>
      `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`);

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

/** Linia, która może być kontynuacją poprzedniego elementu listy (nie blok). */
const sLinia = (l) =>
  String(l).trim() !== '' &&
  !/^(#{1,4}\s|>\s?|:::|-{3,}$|\*{3,}$|_{3,}$)/.test(l.trim()) &&
  !bezPip(l.trim()).startsWith('|');

/** Placeholder dla escapowanego pionka w tabelach (patrz `bezPip`). */
const PIPE_PLACEHOLDER = '\u0001';
const bezPip = (s) => String(s).replace(/\\\|/g, PIPE_PLACEHOLDER);
const przywrocPip = (s) => String(s).replaceAll(PIPE_PLACEHOLDER, '|');

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
