# 0041 — Powłoka z indeksem i leniwe dociąganie ciał stron

Data: 2026-11-15
Status: obowiązujący; **uchyla punkt 4 ADR 0001** (jeden samowystarczalny plik) i zastępuje go
modelem dwuczłonowym. Tryb jednoplikowy zostaje jako `npm run build:single`.

## Kontekst

Baza urosła do 346 stron i artefakt przekroczył 3,5 MB, choć to dopiero początek: każda dostawa
dodaje strony, galerie i dziennik. Witryna wysyłała czytelnikowi **całą bazę** — HTML wszystkich
stron, teksty do wyszukiwarki i cały dziennik — zanim pokazała pierwszą stronę. Wzrost liczby
stron był więc jednocześnie wzrostem czasu startu, a nie tylko rozmiaru plików.

W projekcie `wwm` ten sam problem rozwiązano powłoką z indeksem i osobnymi plikami ciał stron
(ADR 0017 tamtego repozytorium); rozwiązanie sprawdziło się, więc tu przenosimy je w całości.

## Decyzja

1. **Domyślny `npm run build` daje dwa człony.** `dist/index.html` to powłoka: styl, sklejone
   moduły i **indeks** (metadane stron, graf odsyłaczy, tagi, statystyki, miniatury kart)
   spakowany gzip+base64. Ciała stron leżą w `dist/data/<slug>.json` i są dociągane dopiero
   przy wejściu w stronę.
2. **Ciało strony to `html`, `boksy` albo `sekcje`** — dokładnie ta reprezentacja, której
   potrzebuje renderer danej strony. Reszta pól (typ, tytuł, odsyłacze, daty, miniatura,
   pseudonim, gry) zostaje w indeksie, żeby listy, tagi i graf działały bez sieci.
3. **Osobne pliki dla tego, co rośnie najszybciej.** `data/teksty.json` (pełnotekstowy indeks
   wyszukiwarki) dociąga się przy pierwszym zapytaniu, `data/co-nowego.json` (dziennik) — na
   starcie, bo strona główna pokazuje ostatnie wpisy.
4. **Renderery zostają synchroniczne.** `dociagnijStrone(slug)` robi `Object.assign` ciała na
   wpis w `SRW_DATA.strony`, więc `renderEncja`/`renderScena`/`renderEpizod` nie wiedzą,
   skąd wzięły dane. Router czeka na dociągnięcie tylko na trasach stron; listy, tagi i strona
   główna pracują od razu na indeksie.
5. **Szybka nawigacja nie może podmienić widoku.** Każdy render bierze token; spóźniona
   odpowiedź sieci dla starej trasy jest odrzucana.
6. **Błąd dociągania jest widoczny.** Zamiast pustej strony czytelnik dostaje komunikat
   i podpowiedź, że wersja z podziałem wymaga serwera HTTP.
7. **Tryb jednoplikowy zostaje:** `npm run build:single` (albo `node tools/build.mjs --single`)
   pakuje wszystko do jednego pliku — archiwum offline, otwierane z dysku (`file://`), oraz
   tryb, w którym pracują testy rendererów. Wtedy `SRW_DATA` jest wstrzykiwane w całości,
   a moduł ładowania nic nie dociąga.
8. **Publikacja bez zmian:** Pages wysyła cały katalog `dist/` (powłoka + `data/`), więc
   model plikowy jest domyślny także na produkcji.

## Odrzucone alternatywy

- **Dzielenie po typie strony** (`postacie.json`, `mechy.json`) — czytelnik i tak pobierałby
  wszystkie 144 postacie, żeby przeczytać jedną.
- **Dociąganie markdownu i renderowanie w przeglądarce** — przenosi walidację odsyłaczy i
  parsowanie na klienta, dubluje kod resolvera i psuje gwarancję „build nie wypuszcza martwych
  linków”.
- **Service worker i cache offline w trybie plików** — nie działa dla `file://` i nic nie daje
  prywatnej witrynie czytanej z serwera.
- **Kompresja całego artefaktu** — zmniejszyłaby transfer, ale nadal wysyłałaby całą bazę na
  start; nie rozwiązuje problemu rosnącego czasu startu.

## Konsekwencje i kontrola

- Powłoka rośnie tylko przez indeks (dziś ~268 kB przy 3,5 MB całości); pojedyncza strona to
  kilka–kilkadziesiąt kB zamiast megabajtów.
- Kopia witryny to **oba** elementy: `index.html` i `data/`. Skopiowanie samego pliku daje
  powłokę bez treści — dlatego komunikat błędu mówi o wersji jednoplikowej.
- `test/build.test.js` pilnuje podziału (powłoka bez ciał, `data/` z ciałem każdej strony,
  miniatura w indeksie, tryb jednoplikowy bez katalogu `data/`); `test/ladowanie.test.js`
  uruchamia prawdziwy kod ładowania na artefakcie i sprawdza dociąganie, cache i błąd 404.
