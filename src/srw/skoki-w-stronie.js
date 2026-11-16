/**
 * Przeskoki wewnątrz renderowanej strony (quick menu, podsekcje analizy).
 *
 * Router reaguje na zmianę hasha (ADR 0001), więc zwykły odsyłacz do kotwicy
 * w tej samej stronie uruchomiłby render od nowa i zgubił wybrane miejsce.
 * Dlatego cel przeskoku niesie atrybut `data-cel`, a kliknięcie jest
 * przechwytywane: strona przewija się do boksu o wskazanym `id` i podświetla
 * go na chwilę, żeby czytelnik wiedział, gdzie wylądował.
 *
 * Delegacja siedzi na dokumencie, więc działa dla każdej wyrenderowanej
 * strony — nie trzeba podpinać nasłuchu po każdym renderze.
 */

/** Klasa podświetlenia celu po przeskoku (animacja w arkuszu stylów). */
export const KLASA_PODSWIETLENIA = 'podswietlenie';

/**
 * Przewija do celu wskazanego przez odsyłacz. Zwraca `true`, gdy przeskok
 * się odbył, `false`, gdy odsyłacz nie jest przeskokiem albo celu nie ma
 * już na stronie.
 */
export function przeskoczDo(link, dokument = globalThis.document) {
  const id = link?.dataset?.cel;
  if (!id || !dokument?.getElementById) return false;
  const cel = dokument.getElementById(id);
  if (!cel) return false;
  cel.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  cel.classList?.remove(KLASA_PODSWIETLENIA);
  // Wymuszenie przeglądu restartuje animację przy powtórnym kliknięciu.
  void cel.offsetWidth;
  cel.classList?.add(KLASA_PODSWIETLENIA);
  return true;
}

/** Jedna delegacja na dokumencie obsługuje wszystkie przeskoki na stronie. */
export function podepnijSkokiWStronie(dokument = globalThis.document) {
  if (!dokument?.addEventListener) return;
  dokument.addEventListener('click', (e) => {
    const link = e.target?.closest?.('[data-cel]');
    if (!link) return;
    if (przeskoczDo(link, dokument)) e.preventDefault();
  });
}
