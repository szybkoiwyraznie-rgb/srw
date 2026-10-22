# 0028 — Stały live preview od początku sesji

Data: 2026-10-22
Status: obowiązujący; zmienia ADR 0014 w zakresie kolejności startu sesji i utrzymania podglądu.

## Kontekst

ADR 0014 rozpoczynał pracę od otwarcia PR, a podgląd był dotąd opisany jako czynność
wykonywana dopiero przed pokazaniem wyniku. Właściciel polecił, aby podgląd aplikacji był
uruchamiany zaraz po rozpoczęciu każdej nowej sesji agenta i pozostawał aktywny przez cały
czas jej trwania. Reguła musi przetrwać reset kontekstu, dlatego nie może pozostać wyłącznie
w opisie jednego PR ani w rozmowie.

## Decyzja

### 1. Podgląd jest pierwszym krokiem operacyjnym

Po odczytaniu pliku startowego `AGENTS.md` agent najpierw sprawdza przypisaną gałąź i stan
repozytorium, a po resecie odzyskuje zdalny stan sesji. Jeśli klon jest płytki, pobiera pełną
historię. Następnie, przed otwarciem lub aktualizacją PR, dalszą lekturą, audytem i pracą
merytoryczną:

1. wykonuje świeży `npm run build`;
2. uruchamia `npm run serve` przez narzędzie do długotrwałych procesów `start_process`;
3. potwierdza, że proces działa i słucha na `0.0.0.0:3000`.

Kontrola i ewentualne odzyskanie właściwej gałęzi są warunkiem bezpieczeństwa tego kroku,
nie osobnym etapem pracy poprzedzającym podgląd. Kolejność z ADR 0014 zostaje więc
rozszerzona do: **stały podgląd → PR i plan → lektura → audyt → pętla jakości**.

### 2. Proces działa przez całą sesję

Agent nie zatrzymuje podglądu pomiędzy zmianami, testami, commitami ani pushami i nie
wyłącza go w celu oszczędzenia zasobów. Ten sam proces pozostaje aktywny do końca sesji.
Przed zakończeniem każdej tury agent sprawdza jego stan oraz nasłuch portu.

Po awarii procesu lub resecie workspace'u agent odzyskuje gałąź, ponownie buduje artefakt
i natychmiast uruchamia podgląd, zanim wróci do zwykłej pracy. Zniknięcie procesu nie jest
powodem do odłożenia restartu na moment prezentacji wyniku.

### 3. Podgląd pokazuje bieżący artefakt

`tools/serve.mjs` odczytuje `dist/index.html` przy każdym żądaniu, dlatego udany build
odświeża treść bez restartowania serwera. Po każdej zmianie źródeł, danych lub mediów
wpływającej na witrynę agent ponownie wykonuje `npm run build` i pozostawia proces serwera
aktywny. `dist/` pozostaje produktem buildu i nie jest ręcznie edytowany ani commitowany.

Podgląd jest narzędziem roboczym sandboxa, nie publikacją i nie nośnikiem trwałości.
Sandbox może zniknąć; trwałość zmian nadal zapewniają wyłącznie commit i push.

## Odrzucone alternatywy

- **Uruchomienie podglądu dopiero po zakończeniu zmian** — właściciel nie ma stałego dostępu
  do aktualnego stanu pracy i przeczy to poleceniu uruchamiania go na początku sesji.
- **Krótkotrwałe `npm run serve` przez zwykły proces powłoki** — proces może zniknąć po
  zakończeniu wywołania; serwer ma być zarządzany jako długotrwały proces sesji.
- **Restart serwera po każdym buildzie** — jest zbędny, ponieważ serwer czyta artefakt dla
  każdego żądania, a restart tworzy niepotrzebną przerwę w dostępności.
- **Sama instrukcja w opisie PR lub czacie** — nie przetrwa do kolejnej sesji.

## Konsekwencje

- `AGENTS.md` i checklista środowiska zaczynają pracę od live preview, przed PR-em.
- Każda sesja od początku udostępnia właścicielowi bieżący artefakt na porcie 3000.
- Zmiany wpływające na witrynę wymagają odbudowy `dist`, ale nie restartu działającego
  procesu.
- Awaria lub reset wprowadzają obowiązek natychmiastowego odtworzenia podglądu.
- Pozostała treść ADR 0014, w tym jeden PR na sesję, audyt i pętla jakości, pozostaje w mocy.
