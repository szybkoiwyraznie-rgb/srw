# 0042 — Quick menu: spis boksów u szczytu kolumny bocznej

Data: 2026-11-16
Status: obowiązujący

## Kontekst

Strona sceny ma w kolumnie głównej cztery sekcje: analizę, treść, wątki
i nawiązania. Treść sceny z dosłownym skryptem bywa długa — najdłuższa ma
ponad 50 kB HTML — więc żeby dojść do wątków, czytelnik przewijał całą
analizę i cały skrypt. To samo dotyczyło boksu epizodu (streszczenie, wątki
fabularne, komentarz, obsada) i stron encji z kilkoma sekcjami `##`.

Właściciel polecił, żeby na każdej podstronie, której lewa kolumna ma
przynajmniej dwa boksy, u szczytu prawej kolumny stała lista odsyłaczy do
tych boksów, a kliknięcie przenosiło czytelnika do wybranego miejsca.

## Decyzja

1. **Spis stoi w kolumnie bocznej, na samej górze.** Kolumna boczna jest
   wąska i zawsze widoczna obok treści, więc spis nie odbiera miejsca samym
   boksom. Na telefonie kolumna boczna przechodzi pod treść i spis zostaje
   tym, co prowadzi do boksu.
2. **Próg to dwa boksy.** Jeden boks nie wymaga spisu; przy dwóch i więcej
   menu pojawia się zawsze. Strona bez boksu treści (lista, tagi, dziennik)
   menu nie ma.
3. **Spis obejmuje wyłącznie kolumnę główną.** Metryka i „Powiązania” stoją
   obok spisu, więc skakanie do nich nie ma sensu.
4. **Kotwice są częścią kontraktu strony.** Sekcje sceny mają `id="sekcja-…"`,
   boksy epizodu `id="boks-epizodu-N"`, a nagłówki `##` stron encji
   `id="boks-<tytuł>"` (powtórzony tytuł dostaje numer). Boks bez tytułu nie
   dostaje kotwicy i nie trafia do spisu — nie wymyślamy mu nazwy.
5. **Kliknięcie nie zmienia trasy.** Router reaguje na zmianę hasha
   (ADR 0001), więc odsyłacz do kotwicy w tej samej stronie uruchomiłby
   render od nowa. Cel przeskoku niesie `data-cel`, a delegacja kliknięcia
   przewija stronę i podświetla boks.
6. **Kolejność pozycji to kolejność czytania**, nie kolejność wystąpienia
   w pliku: scena pokazuje analizę, treść, wątki i nawiązania — tak, jak
   stoją w kolumnie głównej.

## Odrzucone alternatywy

- **Spis w kolumnie głównej nad treścią** — zjadałby miejsce tam, gdzie
  treść jest najważniejsza, a przy długiej stronie i tak znikałby z widoku.
- **Przyklejony spis (`position: sticky`)** — przy krótkiej kolumnie bocznej
  nachodziłby na metrykę i „Powiązania”; przewijanie strony nie jest na tyle
  częste, żeby warto było płacić to nakładanie.
- **Odsyłacze bez `data-cel`, oparte na `href="#…"`** — router czyta hash,
  więc zmiana hasha wywołałaby render strony zamiast przewinięcia.
- **Spis generowany z listy tytułów w kodzie** — nowa sekcja dopisana do
  treści nie trafiłaby do spisu. Spis czyta gotowy HTML, więc widzi każdy
  boks z kotwicą.

## Konsekwencje

Test `test/spis-boksow.test.js` sprawdza, na których stronach menu stoi,
czy każda pozycja celuje w istniejącą kotwicę w kolumnie głównej, czy nie
ma powtórzeń i pustych tytułów oraz że przy jednym boksie menu znika.
Nagłówki encji mają odtąd atrybut `id`, więc testy dopasowujące `<h2>`
literalnie musiały dostać `[^>]*` — to konsekwencja kotwic, nie zmiana układu.
