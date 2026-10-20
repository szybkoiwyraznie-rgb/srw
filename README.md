# SRW Database

> **Agent / nowa sesja:** jedyny plik startowy to [`AGENTS.md`](AGENTS.md).
> Po jego odczytaniu: **PR ze wstępnym planem → lektura obowiązkowa → audyt poprzedniego
> scalonego PR (merytoryczny z kwerendą, kodu, pozostałych zmian) → domyślna pętla jakości bazy**
> (ADR 0014). Nie czekaj na osobne zlecenie pogłębiania wpisów w granicach ADR-ów.

Prywatny dziennik rozgrywki i baza wiedzy o grach z serii *Super Robot Wars*, prowadzony
równolegle z graniem. Nie jest to serwis fanowski: baza opisuje tylko to, co zostało rozegrane,
a rośnie w tempie przechodzenia kolejnych epizodów.

**Podział pracy:** właściciel gra i wrzuca przepisany skrypt epizodu. Agent zamienia skrypt
w bazę — wpisy postaci, mechów (z uzbrojeniem) i serii anime, powiązania między nimi oraz analizy tego,
skąd wzięte są poszczególne wątki. Witryna jest interfejsem do oglądania tych zależności.

## Status

Fundamenty: struktura repozytorium, silnik witryny, walidacja integralności, build do jednego
pliku HTML, CI i publikacja na GitHub Pages. Baza zawiera pierwszą prawdziwą dostawę
(Super Robot Wars OE, Episode 0). Demo zostało usunięte w całości.

## Szybki start

```bash
npm test          # testy integralności bazy i dokumentacji
npm run build     # → dist/index.html (jeden samowystarczalny plik)
npm run serve     # podgląd na http://0.0.0.0:3000
```

Artefakt otwiera się też bezpośrednio z dysku (`file://`) — routing jest po hashu, wyszukiwanie
działa po stronie przeglądarki, zero zależności runtime. Zewnętrzne ilustracje z R2
wymagają sieci; ich brak nie blokuje czytania tekstu (ADR 0016). Kliknięcie ilustracji
powiększa ją do pełnego ekranu (ADR 0019).

## Mapa projektu

| Ścieżka | Co to jest |
|---|---|
| `episodes/` | surowe skrypty epizodów — **jedyny** materiał pisany przez właściciela, read-only |
| `content/gry/` | tytuły gier |
| `content/epizody/` | rozegrane epizody: streszczenie, wątki anime, komentarz (sceny agregowane) |
| `content/sceny/` | sceny epizodów: dosłowna treść z skryptu i analiza (ADR 0008) |
| `content/postacie/`, `content/mechy/` | encje występujące w epizodach |
| `content/serie/` | serie anime/manga, z których pochodzi wszystko powyższe |
| `content/co-nowego.md` | dziennik zmian widoczny w witrynie |
| `src/srw/` | silnik witryny (ESM, zero zależności) |
| `tools/` | build, serwer podglądu, runner testów |
| `test/` | testy integralności bazy |
| `docs/` | ADR-y, przewodniki, lekcje |
| `dist/` | produkt buildu (nie commitowany) |

## Zasady w skrócie

- **Baza jest grafem.** Gra → epizod → scena → postać i mech → seria anime. Wszystko linkowane
  wikilinkami `[[slug]]` i polami frontmattera; build nie przepuści martwego odsyłacza.
- **Pochodzenie informacji jest widoczne.** `skrypt` / `menu` (dostawa właściciela o mechach, pilotach, uzbrojeniu) / `zrodlo` (sprawdzone w źródle) /
  `wiedza` (niesprawdzona, bez linków). Adres trafia do bazy dopiero po sprawdzeniu (ADR 0009).
- **Skrypt bez wpisu epizodu wywala build.** To celowe: oznacza materiał czekający na przetworzenie.
- **Slug jest niezmienny.** Zmiana identyfikatora zrywa cały graf.
- **Ilustracja to też dostawa encji.** Dla postaci lub mecha dostarczonego obrazem agent
  tworzy wpis, nawet jeśli brak opisu tekstowego; uzupełnia go kwerendą lub oznaczoną
  pamięcią modelu, bez wyprzedzania fabuły (ADR 0017).
- **Swoboda formy jest zaletą.** Nie ma zamkniętej listy sekcji ani słownika tagów — kolejne sesje,
  modele i style mają prawo pisać inaczej, o ile graf i znaczniki pochodzenia się trzymają.
- **Sesja agenta = jedna gałąź i jeden PR.** PR z planem i audytem powstaje przed pierwszą zmianą,
  commit i push idą po każdym zielonym kroku, treść powstaje w pętli epizodu, domyślnej pętli jakości lub na zlecenie,
  a scala wyłącznie właściciel — agent nigdy (ADR 0007 i 0014, `docs/guides/ENVIRONMENT.md`).

## Publikacja

Push do `main` → GitHub Actions (`pages.yml`) → testy → build → GitHub Pages.
Witryna ma `noindex`; nie jest podlinkowana i nie ma być wyszukiwana.
