/**
 * Spis boksów kolumny głównej → quick menu u szczytu kolumny bocznej.
 *
 * Właściciel chce na każdej podstronie, której lewa kolumna ma przynajmniej
 * dwa boksy, listę odsyłaczy do nich na górze prawej kolumny: jedno kliknięcie
 * przenosi czytelnika pod wybrany boks, bez przewijania całej strony.
 *
 * Moduł niczego nie przepisuje — czyta gotowy HTML i wypisuje znalezione
 * kotwice. Dzięki temu sekcje sceny (`id="sekcja-…"`), boksy epizodu
 * (`id="boks-…"`) i nagłówki `##` na stronach encji opisuje jedna reguła.
 *
 * Spis obejmuje wyłącznie kolumnę główną. Metryka i „Powiązania” stoją
 * w kolumnie bocznej, obok samego spisu — skakanie do nich nie ma sensu.
 */

import { escapeHtml } from './markdown.js';
import { slugify } from './links.js';

/** Tytuł bez tego, co dokłada renderer (odsyłacz, plakietka zakresu gry). */
export function tytulZHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nagłówki `##` z gotowego HTML encji jako pozycje spisu.
 * Nagłówek bez identyfikatora nie jest celem — nie wymyślamy mu kotwicy.
 */
export function boksyZHtmliu(html) {
  const wynik = [];
  for (const m of String(html ?? '').matchAll(/<h2[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)) {
    const tytul = tytulZHtml(m[2]);
    if (tytul) wynik.push({ tytul, id: m[1] });
  }
  return wynik;
}

/**
 * `atrybutyNaglowka` dla renderera: nagłówki `##` stron encji dostają kotwice
 * `boks-<slug>`, a powtórzony tytuł — numer na końcu. Rejestr jest wspólny dla
 * całej strony, więc dwa boksy o tym samym tytule nie dzielą jednej kotwicy.
 */
export function kotwiceBoksow() {
  const uzyte = new Map();
  return (poziom, tytul) => {
    if (poziom !== 2) return null;
    const baza = `boks-${slugify(tytul) || 'bez-tytulu'}`;
    const n = (uzyte.get(baza) ?? 0) + 1;
    uzyte.set(baza, n);
    return { id: n === 1 ? baza : `${baza}-${n}` };
  };
}

/**
 * Menu: `<nav>` z odsyłaczami-do-kotwic. Puste, gdy boksów jest mniej niż dwa —
 * jeden boks nie wymaga spisu. Odsyłacz prowadzi do bieżącej trasy, a kliknięcie
 * przechwytuje `podepnijSkokiWStronie` (atrybut `data-cel`), bo zmiana hasha
 * uruchomiłaby router zamiast przewinięcia strony.
 */
export function quickMenu(pozycje, { hrefStrony = '#/', etykieta = 'Boksy tej strony' } = {}) {
  const cel = (pozycje ?? []).filter((p) => p?.id && p?.tytul);
  if (cel.length < 2) return '';
  return `<nav class="quick-menu" aria-label="${escapeHtml(etykieta)}">
  <h2>Na tej stronie</h2>
  <ol>
    ${cel.map((p) => `<li><a href="${hrefStrony}" data-cel="${escapeHtml(p.id)}">${escapeHtml(p.tytul)}</a></li>`).join('\n    ')}
  </ol>
</nav>`;
}
