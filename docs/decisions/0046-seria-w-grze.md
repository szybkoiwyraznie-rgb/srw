# 0046 — Różna seria tej samej encji w różnych grach (`seria_w_grze`)

Data: 2026-11-22
Status: obowiązujący; uzupełnia ADR 0020 (jedna strona dla wielu gier) i ADR 0037 (seria z listy uczestników jest wiążąca).

## Kontekst

Misja 1-4 *Super Robot Wars Y* (`Y_dostawa_1_4.txt`) wprowadza pełne rekordy uczestników dla
**Heero Yuya** i **Wing Gundama Zero** pod serią *Mobile Suit Gundam Wing: Endless Waltz*.
Obie encje były już wcześniej w bazie z *Super Robot Wars OE* pod serią serialu telewizyjnego
*Mobile Suit Gundam Wing*.

ADR 0020 zakazuje rozbijania tej samej postaci ani maszyny na osobne strony na każdą grę
(`heero-yuy-srw-oe`, `heero-yuy-srw-y`), a ADR 0037 wymaga, by pole serii strony zgadzało się
z tym, co wpisuje lista uczestników dostawy. Pojedyncze pole `seria` nie potrafi wyrazić dwóch
różnych serii w dwóch różnych grach — ten sam problem wróci także przy kolejnych bohaterach
wielogrowych (np. Amuro Ray i Char Aznable między *Mobile Suit Gundam* w OE a *Char's Counterattack* w Y).

## Decyzja

1. **Opcjonalna mapa `seria_w_grze` na stronach `postac` i `mech`.** Pole `seria` zostaje
   głównym (domyślnym) przypisaniem serii; gdy gra przypisuje tę samą encję do innej serii
   niż pozostałe tytuły, strona deklaruje płaską mapę `seria_w_grze` (`gra: slug-serii`),
   zgodną z jednopoziomowym parserem frontmattera (jak `w_gre`). Mapa może zawierać tylko
   nadpisania; gry bez własnego klucza dziedziczą `seria`.
2. **Walidacja i graf.** Każdy klucz w `seria_w_grze` musi być stroną gry z pola `gry` tej
   encji, a każda wartość — istniejącą stroną typu `seria`. Wszystkie serie z `seria` oraz
   `seria_w_grze` (bez powtórzeń) wchodzą do grafu odsyłaczy, list filtrów i sekcji
   „Z tej serii” na stronach poszczególnych serii.
3. **Widok encji.** W infoboksie przy jednej serii nic się nie zmienia („Seria”); przy dwóch
   różnych seriach w `seria_w_grze` wiersz pokazuje „Serie” z dopiskiem gry przy każdym
   odsyłaczu. W podtytule serie rozdziela ukośnik.
4. **Weryfikacja dostaw.** `tools/uczestnicy-dostaw.mjs` sprawdza przypisanie danej gry
   według `seria_w_grze[gra] ?? seria`, więc obie dostawy pozostają w pełni wiążące bez
   dublowania stron.

## Odrzucone alternatywy

- **Dwie osobne strony (`heero-yuy` i `heero-yuy-ew`, `wing-gundam-zero` i `wing-gundam-zero-ew`)** —
  łamie ADR 0020 (jedna osoba i jedna maszyna mają jedną stronę rozdzieloną blokami `gra=…`)
  i rozbija historię postaci na dwa równoległe wpisy.
- **Nadpisanie pola `seria` na nowszą grę** — zrywa zgodność z dostawą *SRW OE* (ADR 0037)
  i usuwa encję z listy serii serialu telewizyjnego.

## Konsekwencje

- `heero-yuy` i `wing-gundam-zero` zachowują pojedyncze strony z `gry: [srw-oe, srw-y]` oraz
  `seria_w_grze` wskazującym *Mobile Suit Gundam Wing* dla OE i *Mobile Suit Gundam Wing:
  Endless Waltz* dla Y.
- `src/srw/registry.js` udostępnia wspólną funkcję `serieStrony(strona)`, używaną w
  walidacji, `render-entity.js`, `render-lists.js`, `tools/build.mjs` i testach.
