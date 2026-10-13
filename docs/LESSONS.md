# Lekcje

Rejestr powtarzalnych pułapek i heurystyk — nieformalny, ale obowiązujący: jeśli coś tu jest,
to znaczy, że już raz nas ugryzło. Nowa lekcja = nowy wpis na końcu listy, z datą.

## L1 — Skrypt bez wpisu epizodu to nie awaria, to kolejka (2026-10-13)

Build przerywa pracę, gdy w `episodes/` leży plik bez odpowiednika w `content/epizody/`.
To celowe. Odruch „wyłączmy ten test, bo blokuje" jest błędny — komunikat wskazuje materiał,
który czeka na przetworzenie. Rozwiązaniem jest wpis epizodu, nie zmiana walidacji.

## L2 — Nazwy zapisuj tak, jak są w grze (2026-10-13)

Slug i tytuł encji biorą się z tego, co widać na ekranie albo w skrypcie. Transkrypcje robione
z pamięci rozjeżdżają się między sesjami („Getter-1" vs „Getter 1" vs „Getter One") i tworzą
duplikaty wpisów. Przy pierwszym rozjeździe scalamy wpisy, ale **slug zostaje ten pierwszy**
(ADR 0003) — dlatego lepiej zapisywać dokładnie.

## L3 — Wikilink z etykietą w tabeli wymaga escapowanego pionka (2026-10-13)

W komórce tabeli zapis `[[slug|etykieta]]` rozsypie kolumnę, bo `|` jest separatorem.
Piszemy `[[slug\|etykieta]]`. Parser tabel to obsługuje.

## L4 — Pochodzenie `wiedza` bez źródeł zatrzymuje build (2026-10-13)

Jeżeli wpis opisuje coś spoza rozgrywki (daty emisji, fabułę anime, pochodzenie postaci),
potrzebuje `pochodzenie: wiedza`, pola `zrodla` i sekcji `## Źródła`. Wyjściem nie jest
usunięcie znacznika, lecz znalezienie źródła albo przepisanie wpisu tak, by opisywał wyłącznie
to, co wiadomo z gry.

## L5 — Nie ujednolicaj przy okazji (2026-10-13)

Przy pracy nad nowym epizodem kusi, żeby „przy okazji" wyrównać stare wpisy do nowego stylu.
Nie robimy tego: różnorodność jest zamierzona (ADR 0006), a wartość sesji leży w nowym
materiale. Pogłębianie starych wpisów jest w porządku, gdy wynika z nowych faktów.
