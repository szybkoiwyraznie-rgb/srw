# 0045 — Ten sam model, dwaj piloci: jedna strona z dwoma zestawami parametrów

Data: 2026-11-20
Status: obowiązujący; uchyla punkt 1 ADR 0023 w zakresie maszyn różniących się
wyłącznie pilotem i parametrami; uzupełnia ADR 0026.

## Kontekst

Właściciel zwrócił uwagę, że baza trzyma osobne wpisy dla maszyn, które są wizualnie
tym samym modelem i różnią się tylko pilotem oraz wynikającymi z tego parametrami.
Przykłady:

- **Gurren Lagann** ma dwa zestawy danych — pod [[simon|Simonem]] i pod [[kaminą|Kaminą]].
  W bazie istniał tylko profil Simona, choć dostawa zna oba.
- **Dom** miał dwa wpisy: `dom` (Black Tri-Stars) i `dom-zolnierz-zeonu` (seryjna maszyna).
  To ten sam MS-09; różni się wyłącznie załogą i zestawem uzbrojenia w grze.

Jednocześnie właściciel wskazał maszyny, które mają zostać osobnymi stronami: **Gelgoog**
i **Gelgoog Chara** oraz **Zaku II Chara** (inny kolor), a także **Bolt Robo**, **Zaku II**
i **Kämpfer** (różne uzbrojenie). ADR 0023 mówił dotąd, że każdy odrębny rekord dostawy
dostaje własną stronę — bez rozróżnienia, czy różnica jest widoczna, czy tylko mechaniczna.

## Decyzja

1. **Jeden model, jeden wpis.** Jeśli dwie pozycje przedstawiają ten sam model maszyny
   i różnią się wyłącznie pilotem (załogą) oraz parametrami, powstaje jedna strona.
   Tytuł to nazwa modelu bez dopisku pilota; pole `piloci` zbiera załogi obu wariantów.
2. **Parametry dzielą się na sekcje.** Ciało strony ma osobne bloki
   `{{menu gra=…}}` z nagłówkami `## Parametry — <pilot albo oddział>`, w kolejności
   od profilu podstawowego do dodatkowego. Każda sekcja powtarza pełną tabelę uzbrojenia
   i zdolności własnego wariantu; nie ujednolicamy wartości i nie dopisujemy różnic poza tabelą.
3. **Profil podstawowy zostaje w `w_gre`, dodatkowe w `w_gre_dodatkowe`.** `w_gre` zachowuje
   dotychczasowy kształt (mapa gra → JSON z polami `dostawa`, `profil`, `dane`), żeby nie
   zmieniać istniejących odczytów. `w_gre_dodatkowe` to **płaska lista** takich samych
   rekordów JSON, każdy z dodatkowym polem `gra`. Płaska lista wynika z parsera frontmattera
   (ADR 0002), który obsługuje tylko jeden poziom zagnieżdżenia.
4. **Galeria i manifest scalają się pod slugiem modelu.** Pliki obu wariantów trafiają do
   jednej sekcji `## Ilustracje`, a `media/ilustracje.json` ma jeden klucz i wszystkie pliki.
5. **Różnica widoczna albo w uzbrojeniu = osobne strony.** Inny kolor (Gelgoog/Gelgoog Char,
   Zaku II/Zaku II Char) albo inny zestaw broni (Bolt Robo, Zaku II, Kämpfer) zostają
   osobnymi wpisami, bo użytkownik widzi je jako różne maszyny, a nie dwie konfiguracje
   tej samej. Osobne strony zachowują także formy transformacji (Cybuster/Cybird,
   VF-25F/Fighter i /Battroid).
6. **Stary slug znika, a nie przekierowuje.** Baza nie ma mechanizmu przekierowań, więc
   scena, epizod, postać i dziennik zmieniają odsyłacze na slug modelu. Wpisów dziennika
   nie przepisujemy historycznie — poprawiamy w nich tylko to, co po scaleniu byłoby
   nieprawdą (np. zdanie o „odrębnej jednostce”).
7. **Dostawa wskazuje każdy profil osobno.** `tools/uczestnicy-dostaw.mjs` czyta profile
   z `w_gre` i `w_gre_dodatkowe`, więc rekord „Dom” i „Dom (Black Tri-Stars)” prowadzą
   do tej samej strony.

## Przegląd par w bazie (2026-11-20)

Przejrzano wszystkie 99 stron mechów pod kątem par „ten sam model, inny pilot”:

| Para | Werdykt |
|---|---|
| `dom` + `dom-zolnierz-zeonu` | **scalone** — ten sam MS-09, inna załoga i parametry |
| `gurren-lagann` (Simon) + profil Kaminy | **scalone** — jedna strona, dwa zestawy parametrów |
| `ingram-nr-1` + `ingram-nr-2` | osobne — nr 2 ma działo rewolwerowe i strzelbę zamiast linki |
| `gelgoog` + `gelgoog-char`, `zaku-ii-char` | osobne — inny kolor |
| `zaku-ii-bazooka` / `-karabin-maszynowy` / `-kai` | osobne — inne uzbrojenie |
| `bolt-robo-*` (4), `kampfer-*` (2), `brocken-*` (3) | osobne — inne uzbrojenie |
| `hal-x10` + `hal-x10-green` | osobne — inny kolor |
| `gundam-ground-type` + `…-glowa-gm` | osobne — inna głowa i uzbrojenie |
| `wing-gundam-zero` + `wing-gundam-zero-nb` | osobne — forma transformacji |
| `vf-25f/rvf-25/vf-25g` + wersje `-battroid` | osobne — formy transformacji |
| `macross-quarter` + `-attack-mode` | osobne — forma transformacji |
| `shin-getter-1/2/3`, `getter-arc/khan/kirik` | osobne — różne maszyny zespołowe |
| `mucus-gate-s-in` + `mucus-gate-s-mc` | osobne — dwie różne bramy różnych frakcji, nie jedna maszyna |

Poza Domem i Gurren Laganniem baza nie ma już par różniących się wyłącznie pilotem.

## Odrzucone alternatywy

- **Osobne strony dla każdego pilota** — dublują opis modelu, dzielą galerię i pokazują
  użytkownikowi dwie maszyny tam, gdzie jest jedna.
- **Strona zbiorcza z jedną tabelą i przypisami** — gubi różnice w uzbrojeniu; parametry
  muszą być czytelne w całości dla każdego wariantu.
- **Zagnieżdżona mapa `w_gre_dodatkowe: srw-oe: [...]`** — parser frontmattera przyjmuje
  tylko jeden poziom; głębsze wcięcie to błąd parsowania, nie cicha zgoda.
- **Przekierowanie starego slugu** — router i build nie mają przekierowań; martwy link
  byłby gorszy niż świadoma aktualizacja odsyłaczy.

## Konsekwencje

Liczba stron spada o scalone duplikaty (Dom), a strony zyskują dodatkowe sekcje parametrów.
Test `test/scalenie-modeli.test.js` pilnuje obu stron reguły: scalone modele mają komplet
profili i sekcji, a modele różniące się kolorem lub uzbrojeniem pozostają osobnymi wpisami.
