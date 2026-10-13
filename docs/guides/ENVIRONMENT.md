# Środowisko pracy

Stałe ograniczenia, które dotyczą każdej sesji agentowej. Jeśli coś tu jest nieaktualne —
popraw, ale nie usuwaj wpisu bez powodu: to ostrzeżenia z realnych przypadków.

## Node i zależności

- Silnik witryny (`src/srw/`) działa na Node ≥ 22 i w przeglądarce, **bez zależności runtime**.
- Testy i build nie wymagają `npm install` — nie ma zależności produkcyjnych ani dev.
- Trzy komendy wystarczają do wszystkiego: `npm test`, `npm run build`, `npm run serve`.

## Git

- Praca na gałęzi sesji; `main` aktualizowany przez scalenie PR-a (decyzja właściciela).
- **Force push zakazany** na każdej gałęzi.
- Po resecie środowiska sprawdź `git log --oneline -3` i `git status`, zanim zaczniesz pisać.
- Daty „utworzono / zaktualizowano" w stopkach stron pochodzą z historii gita. W płytkim
  klonie (`fetch-depth: 1`) są niepełne — dlatego workflow używa `fetch-depth: 0`.

## Sieć

- Build i testy **nie korzystają z sieci**. Źródła (`zrodla`) są weryfikowane tylko pod
  kątem formatu adresu, nie dostępności.
- Wyszukiwanie działa lokalnie w przeglądarce; witryna nie wykonuje żadnych zapytań na zewnątrz.

## Rozmiary

- Artefakt `dist/index.html` ma pozostać w granicach pojedynczych megabajtów.
  Gdyby rósł, winne są zwykle osadzone obrazy — te trzymamy poza repozytorium.
- GitHub Pages ma miękki limit 1 GB publikacji i 100 GB ruchu miesięcznie. Przy tej skali
  projektu granice są odległe, ale ilustracje to najczęstszy sposób ich dotknięcia.

## Publikacja

- Push do `main` → `pages.yml` → testy → build → GitHub Pages.
- Artefakt ma `noindex, nofollow`: witryna nie jest podlinkowana i nie ma być wyszukiwana.
  To nie zastępuje rozwagi — repozytorium jest publiczne, więc treść jest publiczna.
