# 0021 — Każdy fragment treści ma zakres gry

Data: 2026-10-20
Status: obowiązujący; zaostrza ADR 0020 (punkty 1, 3 i 5).

## Kontekst

ADR 0020 wprowadził zakres gry jako atrybut bloku i wymagał go tylko na stronach
obejmujących kilka tytułów. W praktyce zostały boksy bez etykiety: opisy z gry
(`{{skrypt}}`), wiedza o pierwowzorach anime oraz strony gry, epizodu, sceny i seriali.
Dla czytelnika wygląda to jak brak oznaczenia — nie wiadomo, czy fragment dotyczy
konkretnej wersji świata, czy jest wspólny, czy po prostu pominięto etykietę.
Właściciel wskazał tę niejednorodność jako błąd.

## Decyzja

1. **Zakres jest obowiązkowy na każdym bloku treści.** Każde otwarcie
   `{{skrypt`, `{{menu`, `{{zrodlo`, `{{wiedza` kończy się atrybutem `gra=<slug>`
   albo `gra=wspolne`. Brak zakresu zatrzymuje build z komunikatem wskazującym blok.
2. **Nie ma domyślnego zakresu „z kontekstu strony”.** Automatyczne podstawienie gry
   strony byłoby wygodne, ale fałszywe: etymologia nazwy, głos postaci czy pierwowzór
   z anime nie stają się informacją o wersji z gry tylko dlatego, że strona jej dotyczy.
   Autor fragmentu wybiera świadomie: konkretny tytuł albo `wspolne`.
3. **`wspolne` jest pełnoprawną etykietą, nie brakiem.** Oznacza informacje niezależne
   od wersji: rodowód postaci i maszyn, pierwowzór z anime, fakty wspólne dla serii.
   Na stronie serialu anime to właściwy zakres dla opisu samej serii.
4. **Dozwolona gra zależy od strony.** Encje — pole `gry`; epizod — pole `gra`;
   scena — gra jej epizodu; gra — ona sama. Zakres spoza tej listy jest błędem.
5. **Zakres pozostaje niezależny od poziomu wiarygodności.** `{{wiedza gra=srw-oe}}`
   znaczy „niesprawdzony wniosek o tej wersji świata”, a `{{zrodlo gra=wspolne}}` —
   „sprawdzone źródło, informacja niezależna od wersji”.

## Skutki dla treści

Wszystkie 83 bloki w bazie mają etykietę. Opisy z gry i parametry dostały `gra=srw-oe`;
lore o pierwowzorach anime i rodowód postaci — `gra=wspolne`; strony gry, epizodu i sceny —
`gra=srw-oe`; strony seriali — `gra=wspolne` przy opisie samej serii i `gra=srw-oe`
przy fragmencie mówiącym, jak serial trafił do gry.

## Kontrola

`test/zakres-gry.test.js` sprawdza wymóg zakresu, dopuszczalne gry i to, że w gotowych
danych każde okno `fragment poziom` ma etykietę. Walidacja w `registry.js` pilnuje tego
przed emisją artefaktu, więc strona nie może powstać z boksem bez oznaczenia.
