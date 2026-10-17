/**
 * Protokół wikilinków i adresowanie stron (ADR 0002).
 *
 * Składnia:  [[slug]]  lub  [[slug|etykieta]]
 * Link celuje w SLUG strony (nie w tytuł). Parser zwraca strukturę,
 * a renderer (markdown.js) zamienia ją na <a> przez resolver rejestru.
 *
 * Moduł jest czysty (bez DOM i fs) — używa go build (node), testy
 * i przeglądarka.
 */

export const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

/** Parsuje wszystkie wikilinki z tekstu → [{slug, etykieta, indeks}]. */
export function parseWikilinks(text) {
  return [...String(text).matchAll(WIKILINK_RE)].map((m) => ({
    slug: m[1].trim(),
    etykieta: m[2] ? m[2].trim() : null,
    indeks: m.index,
  }));
}

/** Slug: małe litery ASCII, cyfry, myślniki (translit PL → ASCII). */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TRANSLIT = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'a', Ć: 'c', Ę: 'e', Ł: 'l', Ń: 'n', Ó: 'o', Ś: 's', Ź: 'z', Ż: 'z',
};

export function slugify(tytul) {
  return String(tytul)
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => TRANSLIT[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Trasy witryny dla każdego typu strony (ADR 0001 — routing po hashu). */
export const TRASY = {
  gra: 'gra', epizod: 'epizod', scena: 'scena', postac: 'postac',
  mech: 'mech', bron: 'bron', seria: 'seria',
};

/** Trasa LISTY dla typu strony (np. postac → #/postacie). */
export const LISTY = {
  gra: 'gry', epizod: 'epizody', postac: 'postacie',
  mech: 'mechy', bron: 'bronie', seria: 'serie',
};

/** Href strony encji. */
export function hrefDlaSlug(slug, typ) {
  const trasa = TRASY[typ];
  return trasa ? `#/${trasa}/${slug}` : `#/${slug}`;
}

/** Href listy dla typu. */
export function hrefListy(typ) {
  const lista = LISTY[typ];
  return lista ? `#/${lista}` : '#/';
}

/** Href listy przefiltrowanej (np. epizody jednej gry, mechy jednej serii). */
export function hrefFiltru(typ, pole, wartosc) {
  return `${hrefListy(typ)}?${pole}=${encodeURIComponent(wartosc)}`;
}
