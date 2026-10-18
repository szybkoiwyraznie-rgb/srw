# Instrukcja dla agentów — SRW Database

> **To jest jedyny plik startowy sesji.** Po odczytaniu go w całości wykonaj kolejno:
> **(1) otwarcie PR ze wstępnym planem → (2) lektura obowiązkowa → (3) audyt poprzedniego
> scalonego PR: (3a) merytoryczny z kwerendą, (3b) kodu, (3c) pozostałych zmian →
> (4) domyślna pętla jakości bazy.** Szczegóły: §3 i ADR 0014. Nie czekaj na osobne zlecenie
> rozszerzania bazy w tych granicach; konkretne zlecenie właściciela wyznacza priorytet pracy.

## 1. Czym jest ten projekt

Prywatny **dziennik rozgrywki** w gry z serii *Super Robot Wars* prowadzony równolegle z graniem.
Baza rośnie w tempie grania: jeden rozegrany epizod = jeden skrypt = kilkanaście nowych wpisów.

Czym to **nie jest**:

- nie jest serwisem fanowskim ani encyklopedią całej serii — opisujemy **tylko to, co zostało rozegrane**,
- nie jest projektem tłumaczeniowym — repozytorium `mtgcrawler/srw-oe-translation` jest osobną sprawą
  i nie dostarcza tu żadnego materiału,
- nie jest produktem dla publiczności — witryna ma `noindex`, a jej odbiorcą jest właściciel.

Trzy zdania, które wyznaczają wszystkie decyzje: **właściciel tylko gra i tylko wrzuca skrypt.
Agent buduje z niego bazę. Witryna istnieje po to, żeby oglądać zależności i czytać analizy.**

## 2. Pętla epizodu (po dostawie nowego skryptu)

Materiał wejściowy: plik `episodes/<gra>/epNNN.md` (surowy skrypt, często plus lista nowych
postaci/mechów podana w wiadomości). Wynik pracy:

1. **Wpis epizodu** `content/epizody/<gra>-epNNN.md` — streszczenie, sceny, wątki anime, komentarz,
   obsada. To najważniejszy wpis: z niego wynikają wszystkie odsyłacze.
2. **Encje** — dla każdej postaci i mecha ze skryptu wpis w odpowiednim dziale. Bronie opisujesz
   w treści mecha (nie jako osobny wpis). Nowe encje tylko wprost z dostawy (ADR 0012): nie zakładasz
   encji wynikającej z innej encji. Encja już istniejąca **nie jest duplikowana**: dopisujesz jej
   nowe wystąpienie (pole `gry`, `mechy`) i uzupełniasz treść, jeśli skrypt wniósł coś nowego.
3. **Relacje** — pola frontmattera (`postacie`, `mechy`, `serie`, `gra`) plus wikilinki
   w treści. Bez nich wpis jest wyspą: nie pojawi się w „Wymienione w" na stronie encji.
4. **Analiza i komentarz** — gdzie wątek pochodzi z anime (seria + odcinek, jeśli wiadomo),
   co dodano, co zmieniono, czego zabrakło. Tabela `## Wątki anime` w treści epizodu.
5. **Dziennik zmian** — nowy wpis na górze `content/co-nowego.md`, nagłówek `## RRRR-MM-DD GG:MM` (godzina publikacji, Europa/Warszawa).
6. **Zielono** — `npm test` i `npm run build` muszą przejść. Build nie wypuści artefaktu
   z martwym wikilinkiem, brakującym odsyłaczem albo niepoprawnym oznaczeniem pochodzenia.

Szczegółowa lista kroków: `docs/guides/PRZEPLYW_EPIZODU.md`.

## 3. Tryb sesji (ADR 0007 i 0014)

### Kolejność domyślna

1. **Otwórz PR ze wstępnym planem sesji.** Po odczytaniu tego pliku sprawdź gałąź i stan
   repozytorium. Pracuj wyłącznie na gałęzi przypisanej do sesji. Jeśli PR sesji już istnieje,
   kontynuuj go — nie twórz drugiego. W nowej sesji: pusty commit porządkowy
   (`git commit --allow-empty`), push gałęzi sesji, `gh pr create`. Plan obejmuje lekturę,
   audyt w trzech częściach i pętlę jakości; **audyt oznacz jako do wykonania**, nie jako gotowy.
   PR powstaje przed lekturą pozostałych dokumentów i przed zmianami merytorycznymi.
2. **Wykonaj lekturę obowiązkową.** Przeczytaj wszystkie ADR-y w `docs/decisions/` po kolei,
   potem `docs/LESSONS.md`, `docs/guides/ENVIRONMENT.md` i `docs/guides/SCHEMAT_DANYCH.md`.
   Każdy plik w całości — jeśli narzędzie utnie wynik, dobierz resztę. Pobierz pełną historię
   gita, jeśli klon jest płytki. Przy nowej dostawie przeczytaj również
   `docs/guides/PRZEPLYW_EPIZODU.md` i cały materiał wejściowy.
3. **Przeprowadź audyt poprzedniego scalonego PR.** Ustal go przez
   `gh pr list --state merged --limit 3`, przeczytaj opis, listę plików i diff
   (`gh pr view <nr>`, `gh pr diff <nr>`). Audytuj faktyczne zmiany, nie tylko opis PR.
   Wyniki poniższych części zapisz oddzielnie w opisie PR sesji:
   - **(3a) Merytoryczny audyt zmian w stronach bazy, oparty na kwerendzie.** Porównaj zmienione
     twierdzenia z nietykalnymi skryptami i dostawami. Dla danych spoza dostawy przeprowadź
     kwerendę i odczytaj źródła potwierdzające konkretne fakty. Sprawdź poprawność, związek
     źródła z twierdzeniem, poziomy wiarygodności, relacje i granicę rozegranej fabuły.
     Sam działający URL, opis poprzedniego agenta ani zielone testy nie są potwierdzeniem
     merytorycznym. Zapisz, co sprawdzono, w jakim źródle i kiedy; oddziel ustalenia od luk.
     Nieudana kwerenda lub brak dostępu oznacza brak weryfikacji, nie potwierdzenie.
   - **(3b) Audyt zmian w kodzie.** Przeczytaj zmieniony kod i odpowiednie testy. Sprawdź
     zgodność z ADR-ami, regresje, walidację danych, bezpieczeństwo i wpływ na renderowanie.
     Uruchom `npm test` i `npm run build`; zielony wynik nie zastępuje przeglądu kodu.
   - **(3c) Audyt pozostałych zmian**, np. dokumentacji, konfiguracji i procesu. Sprawdź
     spójność instrukcji, ADR-ów i implementacji. Gdy danej kategorii zmian nie było,
     zaznacz „nie dotyczy”. W każdej części podaj zakres i nieweryfikowane kwestie.
4. **Uruchom domyślną pętlę jakości bazy.** Nie czekaj na osobne zlecenie po audycie:
   pogłębiaj wpisy, uzupełniaj powiązania i twórz brakujące encje dopuszczone przez ADR-y.
   Nowe fakty mogą pochodzić z kwerendy albo pamięci modelu, z jawnym rozdzieleniem poziomów.
   Dla każdego małego kroku:
   - wybierz konkretną lukę lub błąd, zaczynając od ustaleń audytu, i dopisz cel do planu PR;
   - sprawdź materiał i granicę fabuły; kwerenda nie uprawnia do spoilerów;
   - uzupełnij wpisy i relacje: sprawdzone źródła w `{{zrodlo ... }}`, pamięć modelu
     w `{{wiedza ... }}` bez linków; dostawa pozostaje nadrzędna i niezmieniona;
   - nowe encje zakładaj **tylko wtedy, gdy występują wprost w istniejącej dostawie**
     (ADR 0012 i 0013), także jeśli wcześniej pominięto je przy przetwarzaniu.
     Kwerenda lub pamięć modelu nie są samodzielną podstawą utworzenia encji;
   - dodaj wpis do `content/co-nowego.md`, uruchom `npm test` i `npm run build`,
     zacommituj, wypchnij i zaktualizuj opis PR; potem przejdź do następnej luki.
   Nie dodawaj treści dla samej objętości. Gdy nie ma kolejnego uzasadnionego uzupełnienia
   zgodnego z zasadami, odnotuj wynik i zakończ turę. Blokadę lub potrzebę decyzji właściciela
   opisz w PR; pytaj tylko wtedy, gdy jest to konieczne do dalszej pracy.

### Reguły wspólne

- **Agent NIGDY sam nie scala PR-a i nigdy go nie zamyka.** Scalenie (squash) to wyłączna
  decyzja właściciela, wykonana jego kliknięciem. „Akceptuję”, „wygląda dobrze”, „czy to już
  na stronie?” nie są poleceniem scalenia. Scalenie lub zamknięcie PR-a kończy pracę sesji
  (`docs/guides/ENVIRONMENT.md` §2).
- **1 sesja = 1 gałąź = 1 PR.** Opis PR jest żywym dokumentem: plan, wyniki audytu,
  wykonane kroki i pozostałe luki aktualizuj kumulatywnie po każdym wypchniętym kroku.
- **Commituj często, pushuj natychmiast.** Każdy zielony krok to osobny commit i push,
  nie jeden wielki commit na koniec. Przed commitem sprawdź
  `git rev-parse --abbrev-ref HEAD` i `git status --short`; komunikat przez `git commit -F`
  z pliku poza repozytorium. Po resecie odtwórz stan z gałęzi sesji (`ENVIRONMENT.md` §3).
- **Tylko przyrostowo, nigdy force push, nigdy push do `main`.** Odrzucony push wymaga
  pobrania stanu zdalnego, nie użycia `--force`.
- **Domyślna zgoda dotyczy jakości bazy**, nie dowolnych funkcji silnika, zmian workflowów
  czy niezwiązanych porządków dokumentacji. Takie pomysły zgłaszaj jako propozycje.
  Audyt kodu i dokumentacji nie jest automatyczną zgodą na ich przebudowę.

## 4. Twarde zasady danych

- **Slug jest niezmienny.** Raz nadany identyfikator żyje na zawsze — zmiana zrywa cały graf.
  Nowy slug buduj z tytułu (`[[slugify]]`: małe litery, myślniki), a przy kolizji dopisz
  wyróżnik (rok, wariant, gra).
- **Ścieżki i odsyłacze muszą istnieć.** Pole `seria`/`mechy`/`bronie`/`gra` wskazuje na wpis
  o właściwym typie; build to sprawdza i przerywa pracę przy błędzie.
- **Skryptu epizodu nie poprawiasz.** `episodes/**` to archiwum rozgrywki — czytasz, nie edytujesz.
- **Nie wyprzedzaj fabuły (ADR 0012).** Nie dodawaj wydarzeń ani ról postaci ujawnianych
  dopiero po aktualnie rozegranym materiale, nawet jeśli potwierdza je zewnętrzne źródło.
  Nie przenoś takich informacji do osobnej sekcji ani pod oznaczenie spoilera.
- **Nie wymyślaj faktów.** Czego nie ma w skrypcie i czego nie potwierdza źródło, tego nie wpisujesz
  jako ustalenia. Luka opisana wprost („w skrypcie nie pada tytuł odcinka") jest lepsza niż
  pewnie brzmiąca nieprawda.
- **Rozdzielaj poziomy pewności.** Pole `pochodzenie`: `skrypt` (wprost z gry), `menu` (dostawa
  właściciela o mechach, pilotach i broniach), `zrodlo` (treść potwierdzona w sprawdzonym źródle — `zrodla` i `## Źródła`), `wiedza` (kontekst agenta, **niesprawdzony** — bez linków; ADR 0009).
- **Statystyki i arsenał należą do pary (mech, gra), nie do mecha.** Jeśli skrypt lub dostawa `menu` podaje
  parametry w konkretnym tytule, zapisz je w polu `w_gre` (klucz = slug gry), a nie w opisie ogólnym.

## 5. Swoboda formy jest zaletą

Różne modele, różne style i różne epoki tego projektu mają prawo pisać inaczej. Dlatego:

- **nie ma zamkniętej listy sekcji** — obowiązkowe są tylko `Opis` (encje) i `Streszczenie` (epizod);
  resztę sekcji dobierasz do materiału,
- **nie ma obowiązkowego słownika tagów** — tagi są swobodne, byle slugami,
- **nie ma jednego słusznego stylu narracji** — pisz dobrze i konkretnie, a nie jednolicie,
- **stare wpisy można zmieniać** — poprawianie i pogłębianie istniejących stron jest normalną pracą,
  o ile nie łamie §4.

Jedyne, czego naprawdę pilnujemy: **graf się nie rozjeżdża, a czytelnik wie, skąd pochodzi informacja.**

## 6. Czego nie robić

- Nie pisać treści w HTML-u ani nie dotykać `dist/` (to produkt buildu, nadpisywany).
- Nie zmieniać slugów istniejących wpisów.
- Nie wrzucać dużych obrazów do repozytorium — do repo trafiają miniatury i manifest w `media/`,
  oryginały leżą poza gitem. Wpis bez ilustracji ma się renderować poprawnie.
- Listę ilustracji z R2 pobieraj przez ręczny workflow `r2-inventory.yml` (ADR 0015);
  procedura: `docs/guides/ILUSTRACJE_R2.md`. Nie proś o klucze w czacie.
- Nie wypełniać pól na siłę. Pusta lista znaczy „jeszcze nie wiem" i jest w porządku.
- Nie dodawać zależności npm do silnika witryny (`src/srw/`). Zależności build-time wymagają ADR-a.
- Nie scalać i nie zamykać PR-ów, nie pushować do `main`, nie robić force push (ADR 0007).
- Nie wychodzić poza pętlę epizodu, domyślną pętlę jakości i bezpośrednie zlecenia właściciela (ADR 0014).
- Nie czekać z commitem na koniec zadania — po każdym zielonym kroku commit i push.

## 7. Komendy

```bash
npm test          # testy integralności (node --test)
npm run build     # dist/index.html — jeden samowystarczalny plik
npm run serve     # podgląd na http://0.0.0.0:3000
```

Publikacja dzieje się sama: push do `main` → workflow `pages.yml` → nowa wersja witryny.

## 8. Gdzie zapisać regułę, żeby nie przepadła

| Rodzaj treści | Miejsce |
|---|---|
| Wiążąca decyzja (schemat, proces, granice projektu) | `docs/decisions/NNNN-*.md` |
| Powtarzalna pułapka, lekcja z sesji | `docs/LESSONS.md` |
| Stałe ograniczenia środowiska | `docs/guides/ENVIRONMENT.md` |
| Schemat pól i przykład frontmattera | `docs/guides/SCHEMAT_DANYCH.md` |
| Lista kroków przy nowym epizodzie | `docs/guides/PRZEPLYW_EPIZODU.md` |
| Plan, audyt i stan jednej sesji (jednorazowe) | opis PR sesji — nie czat, nie pliki w `/tmp` |
| Pomysł spoza zatwierdzonego flow | propozycja w opisie PR; realizacja dopiero po zgodzie właściciela |
