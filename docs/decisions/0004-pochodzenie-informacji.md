# 0004 — Pochodzenie informacji i obowiązek źródeł dla wiedzy modelu

Data: 2026-10-13
Status: obowiązujący

## Kontekst

Baza opisuje grę, ale wypełnia ją model językowy, który ma skłonność do pewnie brzmiących
nieprawd — zwłaszcza przy pytaniach typu „z którego odcinka anime wzięto ten wątek".
Dla kolekcjonera błędny wpis jest gorszy niż brak wpisu: na jego podstawie podejmuje decyzje
o tym, co jeszcze obejrzeć i zdobyć.

## Decyzja

1. **Każdy wpis może nieść pole `pochodzenie`** o jednej z trzech wartości:
   - `skrypt` — informacja wprost z rozegranego epizodu (dialog, nazwa, zachowanie),
   - `menu` — odczyt z ekranów gry (nazwy jednostek, parametry, listy broni),
   - `wiedza` — kontekst dopisany przez agenta z pamięci modelu.
2. **`pochodzenie: wiedza` wymaga pola `zrodla` z linkami `http(s)` i sekcji `## Źródła`
   w treści.** Bez tego build przerywa pracę. „Nie wiem" jest pełnoprawną odpowiedzią.
3. **Rozbieżność opisuje się jawnie, nie ukrywa.** Jeśli materiał gry różni się od źródła,
   piszemy o tym w treści, zamiast wybierać jedną wersję po cichu.
4. **Witryna pokazuje poziom pewności czytelnikowi** — plakietka przy nagłówku strony.

## Konsekwencje

- Czytając bazę, zawsze wiadomo, co jest faktem z rozgrywki, a co interpretacją.
- Analizy wątków anime są droższe (trzeba znaleźć źródło), ale to one są główną wartością
  tej bazy wobec zwykłych wiki ze statystykami jednostek.
- Wiedza bez źródła może istnieć w bazie jako luka do uzupełnienia — nigdy jako ustalenie.
