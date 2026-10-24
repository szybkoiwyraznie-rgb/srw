# 0033 — Rodzaj treści jest tagiem; pole `kategoria` znika

Data: 2026-10-24
Status: obowiązujący; zmienia ADR 0012 i 0013 w części o polu `kategoria`, uzupełnia ADR 0006 i 0030.

## Kontekst

Hasła miały pole `kategoria` (swobodny tekst: `technologia`, `organizacja`, `miejsce`,
`jednostka wojskowa`…). Na liście haseł wyświetlało się ono jako szary podpis przy tytule —
tekst, którego nie dało się kliknąć ani użyć do zawężenia listy.

Obok istniały tagi: klikalne, z własnym działem i chmurą, ale puste. Cała baza używała
**17 różnych tagów**, z czego jeden (`one-year-war`) stał na 80 stronach, a 16 stron nie
miało żadnego. Dwa równoległe systemy opisu, z których żaden nie działał: jeden widoczny
i martwy, drugi żywy i pusty.

## Decyzja

1. **Pole `kategoria` znika ze schematu i z frontmattera.** Jego wartość staje się tagiem:
   `jednostka wojskowa` → `jednostka-wojskowa`, `państwo` → `panstwo`,
   `postać z innej serii` → `postac-z-innej-serii`.
2. **Listy nie pokazują tekstowego rodzaju.** Wiersz listy ma tytuł, krótką metrykę
   (seria, rola, liczba maszyn) i chipsy tagów — do sześciu, bo rodzaj treści jest teraz
   jednym z nich.
3. **Tagi mają warstwy.** Nie jest to zamknięty słownik (ADR 0006 zostaje w mocy), tylko
   wzór, który stosujemy do każdej nowej strony:

   | Warstwa | Dotyczy | Przykłady |
   |---|---|---|
   | rodzaj treści | hasła | `technologia`, `organizacja`, `miejsce`, `jednostka-wojskowa`, `najazd`, `era` |
   | rola | postacie (pole `rola`) | `pilot`, `wsparcie`, `dowodztwo`, `antagonista` |
   | rodzaj jednostki | mechy | `mobile-suit`, `labor`, `okret`, `mysliwiec`, `super-robot`, `pojazd-wsparcia`, `bezzalogowy` |
   | świat i seria | wszystko z polem `seria` | `gundam-1979`, `gundam-0080`, `08th-ms-team`, `patlabor`, `eldran`, `sgt-frog`, `super-robot-wars` |
   | przynależność | postacie, mechy, hasła | `federacja`, `zeon`, `sv2`, `jsdf`, `connect`, `white-base`, `08-pluton-ms`, `pluton-cyclops`, `klasa-obrony-ziemi`, `policja` |
   | rodzaj serii | strony serii (pole `rodzaj`) | `serial-tv`, `ova`, `film`, `manga` |

4. **Tag musi wynikać z treści strony.** Przynależność bierzemy stamtąd, gdzie strona ją
   stwierdza, nie z wikilinków — link do `[[zeon]]` ma też strona, która z Zeonem walczy
   (ADR 0018). Maszyna, której klasy materiał nie podaje (Cybuster, Cybird, Exart, Guntank,
   Real PG Gundam), zostaje bez tagu rodzaju jednostki.
5. **Strona nie taguje samej siebie** — `sv2` nie dostaje tagu `sv2`, `zeon` tagu `zeon`.
   Tag prowadzi do strony hasła przez treść, nie przez samo siebie.

## Odrzucone alternatywy

- **Zostawić `kategoria` obok tagów** — dwa opisy tej samej rzeczy; jeden z nich zawsze
  zostawałby nieaktualny, a użytkownik i tak nie mógłby kliknąć w rodzaj treści.
- **Zamknięty słownik rodzajów jako pole** — łamie ADR 0006 i wymusza decyzję „do której
  szufladki” przy każdym nowym haśle; swobodny tag pozwala stronie mieć kilka rodzajów naraz.
- **Tagowanie automatyczne z wikilinków** — tanie, ale nieprawdziwe: wzmianka o frakcji
  nie znaczy przynależności do niej.
- **Tag równy slugowi strony** — chmura tagów zapełniłaby się jednoelementowymi wpisami.

## Konsekwencje

Baza ma **54 różne tagi** zamiast 17, a każda ze 143 stron ma co najmniej jeden.
Dział „Tagi" i chmura tagów nad hasłami stają się realną nawigacją przekrojową: po
`pilot`, `zeon`, `labor` czy `08-pluton-ms` widać przekrój bazy, którego nie dawała
żadna lista działu. Nowa strona dostaje tagi warstwami z tabeli wyżej; `test/tagi.test.js`
pilnuje, że rodzaj treści, rola, seria i brak pola `kategoria` zgadzają się z danymi.
