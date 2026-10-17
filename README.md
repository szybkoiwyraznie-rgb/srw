# SRW Database

> **Agent / nowa sesja:** jedyny plik startowy to [`AGENTS.md`](AGENTS.md).
> Czytasz go w całości, potem `docs/decisions/`, `docs/LESSONS.md`,
> `docs/guides/ENVIRONMENT.md` i `docs/guides/SCHEMAT_DANYCH.md` — **zanim** napiszesz
> cokolwiek do właściciela. Pierwszą czynnością jest otwarcie PR-a sesji (ADR 0007).

Prywatny dziennik rozgrywki i baza wiedzy o grach z serii *Super Robot Wars*, prowadzony
równolegle z graniem. Nie jest to serwis fanowski: baza opisuje tylko to, co zostało rozegrane,
a rośnie w tempie przechodzenia kolejnych epizodów.

**Podział pracy:** właściciel gra i wrzuca przepisany skrypt epizodu. Agent zamienia skrypt
w bazę — wpisy postaci, mechów, broni i serii anime, powiązania między nimi oraz analizy tego,
skąd wzięte są poszczególne wątki. Witryna jest interfejsem do oglądania tych zależności.

## Status

Fundamenty: struktura repozytorium, silnik witryny, walidacja integralności, build do jednego
pliku HTML, CI i publikacja na GitHub Pages. Baza zawiera wpisy demonstracyjne — zostaną
zastąpione danymi z pierwszego rozegranego epizodu.

## Szybki start

```bash
npm test          # testy integralności bazy i dokumentacji
npm run build     # → dist/index.html (jeden samowystarczalny plik)
npm run serve     # podgląd na http://0.0.0.0:3000
```

Artefakt otwiera się też bezpośrednio z dysku (`file://`) — routing jest po hashu, wyszukiwanie
działa po stronie przeglądarki, zero zależności runtime.

## Mapa projektu

| Ścieżka | Co to jest |
|---|---|
| `episodes/` | surowe skrypty epizodów — **jedyny** materiał pisany przez właściciela, read-only |
| `content/gry/` | tytuły gier |
| `content/epizody/` | rozegrane epizody: streszczenie, wątki anime, komentarz (sceny agregowane) |
| `content/sceny/` | sceny epizodów: dosłowna treść z skryptu i analiza (ADR 0008) |
| `content/postacie/`, `content/mechy/`, `content/bronie/` | encje występujące w epizodach |
| `content/serie/` | serie anime/manga, z których pochodzi wszystko powyższe |
| `content/co-nowego.md` | dziennik zmian widoczny w witrynie |
| `src/srw/` | silnik witryny (ESM, zero zależności) |
| `tools/` | build, serwer podglądu, runner testów |
| `test/` | testy integralności bazy |
| `docs/` | ADR-y, przewodniki, lekcje |
| `dist/` | produkt buildu (nie commitowany) |

## Zasady w skrócie

- **Baza jest grafem.** Postać → mech → broń → epizod → seria anime. Wszystko linkowane
  wikilinkami `[[slug]]` i polami frontmattera; build nie przepuści martwego odsyłacza.
- **Pochodzenie informacji jest widoczne.** `skrypt` / `menu` / `wiedza` — a wiedza modelu
  bez źródeł nie przechodzi buildu.
- **Skrypt bez wpisu epizodu wywala build.** To celowe: oznacza materiał czekający na przetworzenie.
- **Slug jest niezmienny.** Zmiana identyfikatora zrywa cały graf.
- **Swoboda formy jest zaletą.** Nie ma zamkniętej listy sekcji ani słownika tagów — kolejne sesje,
  modele i style mają prawo pisać inaczej, o ile graf i znaczniki pochodzenia się trzymają.
- **Sesja agenta = jedna gałąź i jeden PR.** PR z planem i audytem powstaje przed pierwszą zmianą,
  commit i push idą po każdym zielonym kroku, treść wynika tylko z zatwierdzonego flow,
  a scala wyłącznie właściciel — agent nigdy (ADR 0007, `docs/guides/ENVIRONMENT.md`).

## Publikacja

Push do `main` → GitHub Actions (`pages.yml`) → testy → build → GitHub Pages.
Witryna ma `noindex`; nie jest podlinkowana i nie ma być wyszukiwana.
