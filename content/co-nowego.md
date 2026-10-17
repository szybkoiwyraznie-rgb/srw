# Co nowego

Dziennik zmian widoczny w witrynie pod `#/co-nowego`. Prowadzi go agent przy każdym PR:
wpis dodaje się jako nowy nagłówek dnia, a pod nim punktowane zmiany. Najnowsze na górze.

Konwencja: `## RRRR-MM-DD` otwiera wpis dnia. Inne nagłówki są ignorowane.

## 2026-10-17

- Sceny jako osobny typ strony (ADR 0008): treść sceny dosłownie ze skryptu (build sprawdza
  wierność), analiza pod spodem; strona epizodu zbiera sceny w sekcję „Sceny". Demo: cztery
  sceny z `demo-ep001`.
- Witryna w trybie jasnym (decyzja właściciela) — zmieniona paleta i kolory plakietek.
- Naprawiono listy: zawinięta pozycja nie rozpada się na osobny akapit, a pusta linia
  między pozycjami nie dzieli listy na dwie (numeracja nie startuje od nowa).

## 2026-10-14

- Ustalono model sesji agenta (ADR 0007): PR z planem i audytem na starcie, treść tylko
  z zatwierdzonego flow, commit i push po każdym zielonym kroku, scalanie wyłącznie
  po stronie właściciela.
- Przepisano opis środowiska pracy (`docs/guides/ENVIRONMENT.md`) i dopisano lekcje L6–L10
  przeniesione z pozostałych repozytoriów właściciela. Treść bazy bez zmian.

## 2026-10-13

- Powstała baza: struktura katalogów, silnik witryny, build i publikacja na GitHub Pages.
- Dodano wpisy demonstracyjne (gra DEMO, przykładowy epizod 01 oraz sześć encji:
  trzy postacie, trzy mechy, pięć broni i trzy serie anime) — do zastąpienia realnymi danymi.
- Ustalono znaczniki pochodzenia informacji (`skrypt` / `menu` / `wiedza`) i zasadę źródeł
  dla wiedzy spoza rozgrywki.
