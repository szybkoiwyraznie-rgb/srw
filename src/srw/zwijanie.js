/**
 * Boks „Powiązania": przycisk „Rozwiń" odsłania pozycje ponad limit (ADR 0039).
 *
 * Stan żyje w atrybucie `data-zwiniety` boksu. Pozycje ponad limit są w HTML-u
 * od początku i chowa je arkusz stylów — skrypt tylko zdejmuje albo zakłada
 * atrybut, więc bez niego boks jest po prostu zwinięty, a nie pusty.
 */

const ETYKIETA_ROZWIN = 'Rozwiń';
const ETYKIETA_ZWIN = 'Zwiń';

/**
 * Przełącza boks, w którym stoi przycisk. Zwraca `true`, gdy boks został
 * rozwinięty, `false`, gdy zwinięty, i `null`, gdy przycisk nie stoi w boksie.
 */
export function przelaczPowiazania(przycisk) {
  const boks = przycisk?.closest?.('.blok-powiazan');
  if (!boks) return null;
  const rozwiniety = boks.hasAttribute('data-zwiniety');
  if (rozwiniety) boks.removeAttribute('data-zwiniety');
  else boks.setAttribute('data-zwiniety', '');
  przycisk.setAttribute('aria-expanded', String(rozwiniety));
  const etykieta = przycisk.querySelector?.('[data-etykieta]');
  if (etykieta) etykieta.textContent = rozwiniety ? ETYKIETA_ZWIN : ETYKIETA_ROZWIN;
  // Po zwinięciu długiej listy przycisk zostałby daleko pod widokiem.
  if (!rozwiniety) boks.scrollIntoView?.({ block: 'nearest' });
  return rozwiniety;
}

/** Jedna delegacja na dokumencie obsługuje boks każdej wyrenderowanej strony. */
export function podepnijZwijanie(dokument = globalThis.document) {
  if (!dokument?.addEventListener) return;
  dokument.addEventListener('click', (e) => {
    const przycisk = e.target?.closest?.('[data-rozwin-powiazania]');
    if (przycisk) przelaczPowiazania(przycisk);
  });
}
