# 0026 — Epizod 1: dostawa scenariusza, seria filmowa HAL-X10 i warianty jednostek

Data: 2026-10-21
Status: obowiązujący; uzupełnia ADR 0023 i ADR 0025.

## Kontekst

Właściciel przekazał plik `dostawa_1_1.txt` z pełnym skryptem misji 1 epizodu 1
(„Szalejący prototyp Labora”) oraz danymi o jednostkach, pilotach i obsadzie.
Materiał różni się od epizodu 0 w trzech punktach: przynosi gotowy scenariusz scen,
wprowadza jednostki z dwóch różnych źródeł Patlabora (film i serial) oraz zawiera
profil bezimiennego żołnierza i profil sterujący HOS. Ilustracje mają dojść osobną
wiadomością, więc ten etap ich nie obejmuje.

## Decyzja

1. Surowy plik leży w `dostawy/srw-oe/dostawa_1_1.txt`, a jego polskie opracowanie —
   w `dostawy/srw-oe/epizod-1-misja-1-pl.md`. Opracowanie obejmuje misję `DL101_11`,
   siedem jednostek, siedmiu pilotów i Dodatek A z postaciami bez profilu pilota.
   Skrypt scenariusza nie jest częścią opracowania — trafia do `episodes/` (pkt 4).
2. Jednostki z dostawy mają własne strony zgodnie z ADR 0023, także wtedy, gdy dzielą
   nazwę: **HAL-X10** i **HAL-X10/Green** to osobne wpisy z różnymi wartościami broni.
   Nie kopiujemy rekordów między wariantami i nie ujednolicamy liczb.
3. Źródło jednostki rozstrzyga o serii. **HAL-X10** pochodzi z filmu, więc dostaje nową
   serię **Patlabor: The Movie** (`rodzaj: film`); **HAL-X10/Green** i pozostałe jednostki
   policyjne zostają przy `mobile-police-patlabor`. **Medea** nie ma potwierdzonej
   przynależności — strona nie dostaje pola `seria`, dopóki źródło jej nie wskaże.
   Pusta seria jest lepsza niż przypisanie na wyczucie (ADR 0013).
4. Skrypt epizodu jest archiwum rozegrania, nie treścią redakcyjną: leży w
   `episodes/srw-oe/ep001.md` jako dosłowny tekst dostawy z normalizacją końców linii
   (CRLF → LF). Scena `srw-oe-ep1-szalejacy-prototyp-labora` cytuje ten plik w bloku
   `:::skrypt`, a jej sekcja `## Analiza` opisuje przebieg bez powtarzania dialogów
   (ADR 0008). Misja to **jedna scena** `1-1`: podział skryptu na części (odprawa,
   wtrącenie o Patlaborze, poligon, SV2, ostra amunicja z dialogami bojowymi, rozmowy
   po walce, następstwa) jest wewnętrzną strukturą scenariusza, a nie osobnymi wpisami
   w bazie. Analiza wymienia te części jako podsekcje, żeby było widać rytm misji.
   Kolejna misja dostanie scenę `1-2`.
5. Profile bez tożsamości traktujemy różnie, zależnie od tego, czym są. **Żołnierz JSDF**
   jest bezimiennym człowiekiem w świecie Patlabora i dostaje serię `mobile-police-patlabor`,
   ale bez imienia i bez własnej strony fabularnej. **Shinohara HOS** jest profilem
   sterującym bezzałogowych HAL-X10 — jak Control AI w epizodzie 0 — więc nie dostaje
   serii; jego związek z Patlaborem opisuje treść strony, nie pole `seria`.
6. Obowiązuje podział z ADR 0025 pkt 5: statystyki, komendy Ducha i umiejętności pokazujemy
   wyłącznie na stronach postaci, a parametry jednostki nie powtarzają domyślnej załogi.
   Obsadę misji widać w polu `piloci` i w relacjach epizodu oraz sceny.
7. Epizod 1 startuje bez ilustracji. Strony nie dostają pustych galerii ani bloków
   `{{menu}}` z obrazkami; ilustracje wejdą osobną dostawą właściciela (ADR 0017).

## Konsekwencje

Baza ma drugi epizod, drugą scenę i drugi skrypt, a liczba stron rośnie o jednostki,
postacie, hasła i serię filmową. Testy pilnują zgodności tabel broni z plikiem dostawy,
parzystości `episodes/` z wpisami epizodów oraz braku ilustracji na nowych stronach.
Kolejna dostawa epizodu 1 wymaga nowego ADR-a tylko wtedy, gdy zmienia te ustalenia —
zwykłe dopisanie sceny nie wymaga.

## Adnotacja 2026-10-21 — ilustracje jednostek epizodu 1

Właściciel dostarczył osiem plików ilustracji dla czterech jednostek z tej misji: **HAL-X10**
(`HAL-X10.png`, `HAL-X10 2.png`), **HAL-X10/Green** (`HAL-X10 Green.png`, `HAL-X10 Green 2.png`),
**Ingram nr 1** (`Ingram nr 1.png`, `Ingram nr 1 2.png`) i **Ingram nr 2** (`Ingram nr 2.png`,
`Ingram nr 2 2.png`). Pliki leżą w korzeniu kubełka R2, tak jak pozostałe ilustracje jednostek.

Przypisanie idzie po nazwach plików, zgodnie z ADR 0017: manifest `media/ilustracje.json` ma teraz
31 encji i 44 pliki, a każda z czterech stron dostała blok `{{menu}}` z sekcją „Ilustracje” i dwoma
obrazami. Sandbox nadal nie ma dostępu sieciowego do `r2.dev`, więc `weryfikacjaZdalna` pozostaje
`false` — nie deklarujemy obejrzenia zawartości. Punkt 7 decyzji przestaje obowiązywać w zakresie
tych czterech jednostek; pozostałe strony epizodu 1 (postacie, hasła, seria, epizod i scena)
ilustracji nadal nie mają.

