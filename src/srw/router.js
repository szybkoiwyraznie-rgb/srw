/**
 * Router po hashu (ADR 0001): jedyny mechanizm „URL-i", który działa
 * identycznie z file:// i przez HTTPS.
 *
 * Postać trasy: #/<nazwa>[/<param>][?zapytanie]
 * Przykłady: #/  #/epizod/demo-ep001  #/mechy?seria=mobile-suit-gundam-1979
 *            #/szukaj?q=gundam  #/tag/pilot
 */

export const TRASY_ZNAZWE = [
  'glowna',
  'gry', 'gra',
  'epizody', 'epizod', 'sceny', 'scena',
  'postacie', 'postac',
  'mechy', 'mech',
  'serie', 'seria',
  'tagi', 'tag',
  'szukaj', 'co-nowego', 'o-bazie',
];

export function parsujHash(hash) {
  const surowy = String(hash ?? '').replace(/^#/, '');
  const [sciezka, zapytanie] = surowy.split('?');
  const segmenty = sciezka.split('/').filter((s) => s !== '').map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
  const query = {};
  if (zapytanie) for (const [k, v] of new URLSearchParams(zapytanie).entries()) query[k] = v;

  if (segmenty.length === 0) return { nazwa: 'glowna', param: null, query };
  const [nazwa, ...reszta] = segmenty;
  const param = reszta.length > 0 ? reszta.join('/') : null;
  if (!TRASY_ZNAZWE.includes(nazwa)) return { nazwa: 'nieznana', param, query };
  return { nazwa, param, query };
}

export function aktualnaTrasa() {
  return parsujHash(globalThis.location?.hash ?? '');
}

/** Rejestruje nasłuch zmian hasha + start; zwraca funkcję stopu (testy). */
export function uruchomRouter(obejrz) {
  const zmiana = () => obejrz(aktualnaTrasa());
  globalThis.addEventListener?.('hashchange', zmiana);
  zmiana();
  return () => globalThis.removeEventListener?.('hashchange', zmiana);
}

/** Nawigacja programowa (zachowuje historię przeglądarki). */
export function idz(hash) {
  if (globalThis.location) globalThis.location.hash = hash;
}
