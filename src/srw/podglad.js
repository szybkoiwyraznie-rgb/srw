/**
 * Podgląd ilustracji: kliknięcie obrazu otwiera go na pełnym ekranie.
 *
 * Okno to natywny <dialog> w trybie modalnym: przeglądarka daje blokadę tła,
 * zamykanie klawiszem Esc i przenoszenie fokusu. Sam element wypełnia okno
 * przeglądarki, więc ilustracja zajmuje cały ekran także wtedy, gdy osadzenie
 * w ramce nie pozwala wejść w tryb pełnoekranowy. Przycisk „Pełny ekran”
 * dodatkowo korzysta z Fullscreen API, jeśli jest dostępne; odmowa uprawnień
 * jest ignorowana, bo widok i tak wypełnia ekran.
 *
 * Obrazy pozostają w R2 — podgląd tylko podstawia adres, nic nie kopiuje
 * do repozytorium ani do artefaktu.
 */

/** Stan pojedynczego otwartego okna podglądu. */
let okno = null;
let scena = null;
let obraz = null;
let podpis = null;
let licznik = null;
let zakres = null;
let przyciskZamknij = null;
let przyciskPelny = null;
let przyciskPoprzednia = null;
let przyciskNastepna = null;
let przyciski = [];
let indeks = 0;
let zrodloFokusu = null;
let dokumentBiezacy = null;
let podpieto = false;

/** Opis licznika ilustracji; pusty, gdy strona ma tylko jeden obraz. */
export function opisLicznika(indeksIlustracji, liczba) {
  if (!Number.isInteger(liczba) || liczba < 2) return '';
  return `${indeksIlustracji + 1} z ${liczba}`;
}

/** Następny indeks ilustracji z zawijaniem na obu końcach listy. */
export function przesunIndeks(indeksIlustracji, liczba, krok) {
  if (!Number.isInteger(liczba) || liczba <= 0) return 0;
  return ((indeksIlustracji + krok) % liczba + liczba) % liczba;
}

/**
 * Podpina obsługę podglądu do dokumentu. Wywoływane raz przy starcie witryny;
 * nasłuch jest delegowany, więc przetrwa każdy render trasy.
 * Zwraca funkcję odpinającą albo null, gdy nie ma okna podglądu w dokumencie.
 */
export function podepnijPodglad(dokument = globalThis.document) {
  if (!dokument || podpieto) return null;
  dokumentBiezacy = dokument;
  okno = dokument.getElementById('podglad');
  if (!okno) return null;

  obraz = okno.querySelector('[data-obraz]');
  podpis = okno.querySelector('[data-podpis]');
  licznik = okno.querySelector('[data-licznik]');
  zakres = okno.querySelector('[data-zakres]');
  scena = okno.querySelector('[data-scena]');
  przyciskZamknij = okno.querySelector('[data-zamknij]');
  przyciskPelny = okno.querySelector('[data-pelny]');
  przyciskPoprzednia = okno.querySelector('[data-poprzednia]');
  przyciskNastepna = okno.querySelector('[data-nastepna]');
  if (!obraz || !przyciskZamknij) return null;

  if (przyciskPelny) {
    // Przycisk ma sens tylko wtedy, gdy przeglądarka naprawdę pozwoli wejść
    // w tryb pełnoekranowy; w ramce bez uprawnień okno i tak wypełnia ekran.
    const dostepny = typeof okno.requestFullscreen === 'function' && dokument.fullscreenEnabled !== false;
    przyciskPelny.hidden = !dostepny;
  }

  const klik = (zdarzenie) => {
    const cel = zdarzenie.target;
    const przycisk = cel?.closest?.('[data-pelny-ekran]');
    if (przycisk) {
      zdarzenie.preventDefault();
      otworzPodglad(przycisk, dokument);
      return;
    }
    if (cel === okno) zamknijPodglad(); // tło modala
  };

  const klikWScenie = (zdarzenie) => {
    if (zdarzenie.target === scena) zamknijPodglad(); // margines wokół ilustracji
  };

  const klawisz = (zdarzenie) => {
    if (!okno.open) return;
    if (zdarzenie.key === 'ArrowLeft') {
      zdarzenie.preventDefault();
      zmienIlustracje(-1);
    } else if (zdarzenie.key === 'ArrowRight') {
      zdarzenie.preventDefault();
      zmienIlustracje(1);
    }
  };

  const zamkniecie = () => {
    obraz.removeAttribute('src');
    obraz.alt = '';
    if (podpis) podpis.textContent = '';
    if (licznik) licznik.textContent = '';
    if (zakres) {
      zakres.textContent = '';
      zakres.hidden = true;
    }
    dokument.documentElement?.classList?.remove('podglad-otwarty');
    if (zrodloFokusu?.isConnected) zrodloFokusu.focus?.({ preventScroll: true });
    zrodloFokusu = null;
  };

  const pelnyEkran = () => {
    if (dokument.fullscreenElement) {
      bezpiecznie(() => dokument.exitFullscreen?.());
      return;
    }
    bezpiecznie(() => okno.requestFullscreen?.());
  };

  const zmianaPelnegoEkranu = () => {
    if (!przyciskPelny) return;
    const aktywny = dokument.fullscreenElement === okno;
    przyciskPelny.textContent = aktywny ? 'Zamknij pełny ekran' : 'Pełny ekran';
    przyciskPelny.setAttribute('aria-pressed', String(aktywny));
  };

  dokument.addEventListener('click', klik);
  scena?.addEventListener('click', klikWScenie);
  dokument.addEventListener('keydown', klawisz);
  dokument.addEventListener('fullscreenchange', zmianaPelnegoEkranu);
  okno.addEventListener('close', zamkniecie);
  przyciskZamknij.addEventListener('click', zamknijPodglad);
  przyciskPelny?.addEventListener('click', pelnyEkran);
  przyciskPoprzednia?.addEventListener('click', () => zmienIlustracje(-1));
  przyciskNastepna?.addEventListener('click', () => zmienIlustracje(1));

  podpieto = true;

  return () => {
    dokumentBiezacy = null;
    dokument.removeEventListener('click', klik);
    scena?.removeEventListener('click', klikWScenie);
    dokument.removeEventListener('keydown', klawisz);
    dokument.removeEventListener('fullscreenchange', zmianaPelnegoEkranu);
    okno.removeEventListener('close', zamkniecie);
    podpieto = false;
  };
}

/** Otwiera podgląd dla wskazanego przycisku ilustracji. */
function otworzPodglad(przycisk, dokument) {
  const miniatura = przycisk.querySelector('img');
  if (!miniatura) return;
  const adres = miniatura.currentSrc || miniatura.src;
  if (!adres) return;

  zrodloFokusu = przycisk;

  // Brak <dialog> (starsza przeglądarka): otwórz oryginał w nowej karcie.
  if (typeof okno.showModal !== 'function') {
    globalThis.open?.(adres, '_blank', 'noopener');
    return;
  }

  przyciski = [...dokument.querySelectorAll('[data-pelny-ekran]')];
  indeks = Math.max(0, przyciski.indexOf(przycisk));
  pokazIlustracje();
  if (!okno.open) okno.showModal();
  dokument.documentElement?.classList?.add('podglad-otwarty');
  przyciskZamknij.focus?.({ preventScroll: true });
}

/** Przełącza ilustrację o krok, z zawijaniem listy. */
function zmienIlustracje(krok) {
  if (przyciski.length < 2) return;
  indeks = przesunIndeks(indeks, przyciski.length, krok);
  pokazIlustracje();
}

/** Wstawia do okna ilustrację o bieżącym indeksie. */
function pokazIlustracje() {
  const przycisk = przyciski[indeks];
  const miniatura = przycisk?.querySelector('img');
  if (!miniatura) return;
  obraz.src = miniatura.currentSrc || miniatura.src;
  obraz.alt = miniatura.alt || '';
  if (podpis) podpis.textContent = miniatura.alt || '';
  if (licznik) licznik.textContent = opisLicznika(indeks, przyciski.length);
  const nazwaGry = przycisk.closest?.('[data-gra-nazwa]')?.getAttribute('data-gra-nazwa') ?? '';
  if (zakres) {
    zakres.textContent = nazwaGry;
    zakres.hidden = nazwaGry === '';
  }
  const wiele = przyciski.length > 1;
  if (przyciskPoprzednia) przyciskPoprzednia.hidden = !wiele;
  if (przyciskNastepna) przyciskNastepna.hidden = !wiele;
}

/** Zamyka okno podglądu (bez błędu, gdy już zamknięte). */
function zamknijPodglad() {
  if (!okno?.open) return;
  if (dokumentBiezacy?.fullscreenElement === okno) {
    bezpiecznie(() => dokumentBiezacy.exitFullscreen?.());
  }
  okno.close();
}

/**
 * Wywołuje operację pełnoekranową i połyka odmowę: brak uprawnień w ramce
 * nie jest błędem, bo okno podglądu i tak wypełnia cały ekran.
 */
function bezpiecznie(operacja) {
  try {
    const wynik = operacja();
    if (wynik && typeof wynik.catch === 'function') wynik.catch(() => {});
  } catch {
    /* przeglądarka odmówiła — widok nadal wypełnia ekran */
  }
}
