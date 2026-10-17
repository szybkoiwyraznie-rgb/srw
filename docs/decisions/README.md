# Rejestr decyzji (ADR)

Każda wiążąca decyzja projektowa żyje tu jako osobny plik `NNNN-krotki-tytul.md`.
ADR jest nadrzędny wobec praktyki i wobec tego, co „tak się przyjęło" w poprzednich sesjach.

Zasady:

- **Numer rośnie, nic nie jest usuwane.** Wycofana decyzja dostaje nowy ADR, który ją zastępuje,
  a stary zostaje z adnotacją.
- **ADR pisze się wtedy, gdy decyzja wiąże na przyszłość** — schemat danych, proces, granice
  projektu. Nie dla każdej zmiany w treści.
- Przed pracą przeczytaj wszystkie ADR-y w całości. Kolejność czytania: od 0001 w górę.

| Numer | Tytuł |
|---|---|
| [0001](0001-architektura-tresci-i-artefaktu.md) | Treść jako dane w markdownie, artefakt jako produkt buildu |
| [0002](0002-silnik-bez-zaleznosci.md) | Silnik witryny bez zależności, routing po hashu |
| [0003](0003-schemat-stron-i-identyfikatory.md) | Typy stron, działy i niezmienny slug |
| [0004](0004-pochodzenie-informacji.md) | Pochodzenie informacji i obowiązek źródeł dla wiedzy modelu |
| [0005](0005-proces-petla-epizodu.md) | Proces: pętla epizodu, dziennik zmian, publikacja |
| [0006](0006-swoboda-formy.md) | Swoboda formy: brak zamkniętych list sekcji i tagów |
| [0007](0007-model-sesji-pr-zakres-commity.md) | Model sesji: PR na starcie, zakaz scalania, zakres z zatwierdzonego flow, commity przyrostowe |
| [0008](0008-sceny-jako-osobny-typ.md) | Sceny jako osobny typ strony; epizod agreguje sceny |
| [0009](0009-zrodla-tylko-sprawdzone.md) | Źródło wpisujemy tylko po sprawdzeniu; wiedza niesprawdzona nie ma linków |
| [0010](0010-poziomy-wiarygodnosci-i-asymilacja.md) | Poziomy wiarygodności, kolor zamiast plakietek, procedura asymilacji dostaw |
