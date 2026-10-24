/**
 * Agresywne leniwe ładowanie ilustracji i miniatur (ADR 0032).
 *
 * Galeria postaci albo mechów to kilkadziesiąt zdjęć na jednej trasie.
 * Natywne `loading="lazy"` wstrzymuje tylko pierwsze pobranie — raz
 * zdekodowana bitmapa zostaje w pamięci karty do końca sesji i rośnie
 * z każdym przewinięciem.
 *
 * Tutaj obraz żyje tylko wtedy, gdy jest blisko pola widzenia:
 * - adres zawsze czeka w `data-zrodlo`, więc nic nie ginie;
 * - wejście w pas MARGINES_WCZYTANIA wstawia `src` z powrotem;
 * - wyjście poza pas MARGINES_ZWOLNIENIA zdejmuje `src`, a przeglądarka
 *   zwalnia dekodowaną bitmapę; `<img>` zostaje pustą ramką o przypiętych
 *   wymiarach, żeby strona nie podskakiwała przy przewijaniu.
 *
 * Dwa różne marginesy dają histerezę: obraz nie miga przy drobnym ruchu
 * w tę i z powrotem. Bez IntersectionObserver moduł wczytuje wszystko
 * od razu — witryna ma działać także w starszej przeglądarce.
 */

/** Pas wokół pola widzenia, w którym obraz ma być wczytany (px). */
export const MARGINES_WCZYTANIA = 400;

/** Pas, poza którym obraz zwalnia pamięć (px). Większy od wczytania — histereza. */
export const MARGINES_ZWOLNIENIA = 1600;

const KLASA_LENIWY = 'obraz-leniwy';
const KLASA_ZWOLNIONY = 'obraz-zwolniony';

/** Adres ilustracji — także wtedy, gdy obraz jest chwilowo zwolniony. */
export function adresObrazu(obraz) {
  if (!obraz) return '';
  return obraz.getAttribute?.('src') || obraz.dataset?.zrodlo || '';
}

/** Zapisuje adres obrazu w `data-zrodlo` i oznacza go jako leniwy. */
export function przygotujObraz(obraz) {
  const adres = adresObrazu(obraz);
  if (!adres) return false;
  obraz.dataset.zrodlo = adres;
  obraz.classList?.add(KLASA_LENIWY);
  return true;
}

/** Wstawia adres z powrotem do `src` i zdejmuje przypięte wymiary. */
export function wczytajObraz(obraz) {
  const adres = obraz?.dataset?.zrodlo;
  if (!adres) return false;
  if (obraz.getAttribute?.('src') === adres) return false;
  if (obraz.style) {
    obraz.style.width = '';
    obraz.style.height = '';
  }
  obraz.setAttribute('src', adres);
  obraz.classList?.remove(KLASA_ZWOLNIONY);
  return true;
}

/**
 * Zdejmuje `src`, zachowując adres i zajmowane miejsce.
 *
 * Wymiary przypinamy stylem dopiero wtedy, gdy obraz zdążył się wyrysować:
 * przypięte zero zapadłoby układ strony zamiast go utrzymać.
 */
export function zwolnijObraz(obraz) {
  const adres = obraz?.getAttribute?.('src');
  if (!adres) return false;
  obraz.dataset.zrodlo = obraz.dataset.zrodlo || adres;
  const miara = obraz.getBoundingClientRect?.();
  if (obraz.style && miara && miara.width > 0 && miara.height > 0) {
    obraz.style.width = `${Math.round(miara.width)}px`;
    obraz.style.height = `${Math.round(miara.height)}px`;
  }
  obraz.removeAttribute('src');
  obraz.classList?.add(KLASA_ZWOLNIONY);
  return true;
}

/** Czy obraz mieści się w polu widzenia powiększonym o margines. */
export function wPoluWidzenia(obraz, widok, margines) {
  const miara = obraz?.getBoundingClientRect?.();
  if (!miara) return true; // nie wiadomo, gdzie jest — nie ukrywaj go
  const wysokosc = widok?.wysokosc ?? 0;
  const szerokosc = widok?.szerokosc ?? 0;
  return miara.bottom > -margines && miara.top < wysokosc + margines
    && miara.right > -margines && miara.left < szerokosc + margines;
}

/**
 * Włącza leniwe ładowanie dla obrazów pod wskazanym korzeniem.
 * Zwraca funkcję odpinającą — wywołuje się ją przed kolejnym renderem trasy.
 */
export function wlaczLeniweObrazy(korzen, okno = globalThis) {
  const obrazy = [...(korzen?.querySelectorAll?.('img') ?? [])].filter((o) => przygotujObraz(o));
  if (obrazy.length === 0) return () => {};

  const Obserwator = okno?.IntersectionObserver;
  if (typeof Obserwator !== 'function') {
    for (const obraz of obrazy) wczytajObraz(obraz);
    return () => {};
  }

  // Pierwsze przejście jest natychmiastowe: obserwator zgłasza stan dopiero
  // w kolejnej klatce, a do tego czasu widoczne miniatury byłyby puste.
  const widok = { wysokosc: okno.innerHeight ?? 0, szerokosc: okno.innerWidth ?? 0 };
  for (const obraz of obrazy) {
    if (wPoluWidzenia(obraz, widok, MARGINES_WCZYTANIA)) wczytajObraz(obraz);
    else zwolnijObraz(obraz);
  }

  const wczytujace = new Obserwator((wpisy) => {
    for (const wpis of wpisy) if (wpis.isIntersecting) wczytajObraz(wpis.target);
  }, { rootMargin: `${MARGINES_WCZYTANIA}px` });

  const zwalniajace = new Obserwator((wpisy) => {
    for (const wpis of wpisy) if (!wpis.isIntersecting) zwolnijObraz(wpis.target);
  }, { rootMargin: `${MARGINES_ZWOLNIENIA}px` });

  for (const obraz of obrazy) {
    wczytujace.observe(obraz);
    zwalniajace.observe(obraz);
  }

  return () => {
    wczytujace.disconnect?.();
    zwalniajace.disconnect?.();
  };
}
