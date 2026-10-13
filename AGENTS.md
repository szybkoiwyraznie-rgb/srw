# Instrukcja dla agentów — SRW Database

> **To jest jedyny plik startowy sesji.** Niezależnie od treści pierwszej wiadomości właściciela:
> przeczytaj ten plik w całości, potem `docs/decisions/` (wszystkie ADR-y), `docs/LESSONS.md`
> i `docs/guides/SCHEMAT_DANYCH.md`. Dopiero potem odpowiadaj i bierz się do pracy.

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

## 2. Pętla epizodu (praca domyślna)

Materiał wejściowy: plik `episodes/<gra>/epNNN.md` (surowy skrypt, często plus lista nowych
postaci/mechów/broni podana w wiadomości). Wynik pracy:

1. **Wpis epizodu** `content/epizody/<gra>-epNNN.md` — streszczenie, sceny, wątki anime, komentarz,
   obsada. To najważniejszy wpis: z niego wynikają wszystkie odsyłacze.
2. **Encje** — dla każdej postaci, mecha i broni ze skryptu wpis w odpowiednim dziale.
   Encja już istniejąca **nie jest duplikowana**: dopisujesz jej nowe wystąpienie
   (pole `gry`, `mechy`, `bronie`) i uzupełniasz treść, jeśli skrypt wniósł coś nowego.
3. **Relacje** — pola frontmattera (`postacie`, `mechy`, `bronie`, `serie`, `gra`) plus wikilinki
   w treści. Bez nich wpis jest wyspą: nie pojawi się w „Wymienione w" na stronie encji.
4. **Analiza i komentarz** — gdzie wątek pochodzi z anime (seria + odcinek, jeśli wiadomo),
   co dodano, co zmieniono, czego zabrakło. Tabela `## Wątki anime` w treści epizodu.
5. **Dziennik zmian** — punkt w `content/co-nowego.md` z datą dnia.
6. **Zielono** — `npm test` i `npm run build` muszą przejść. Build nie wypuści artefaktu
   z martwym wikilinkiem, brakującym odsyłaczem albo wiedzą bez źródeł.

Szczegółowa lista kroków: `docs/guides/PRZEPLYW_EPIZODU.md`.

## 3. Tryb sesji

1. **PR na starcie.** Gałąź sesji i PR istnieją przed pierwszą zmianą w treści; scalanie
   (squash) należy do właściciela.
2. **Inkrementalne commity.** Każdy zielony krok (`npm test` + `npm run build`) to osobny commit.
   Zakaz jednego wielkiego commita na całą sesję.
3. **Tylko przyrostowo, nigdy force push.**
4. **Audyt poprzedniego PR** przed nową pracą — krótki przegląd, co wniósł i czy nie zostawił
   długu (nierozwiązane odsyłacze, wpisy bez źródeł). Wynik w opisie PR.
5. Pytaj właściciela **tylko wtedy, gdy jesteś zablokowany** decyzją, której nie możesz podjąć
   sam (nowy ADR, sprzeczność zasad, zmiana zakresu). Domyślną pracą jest pętla z §2.

## 4. Twarde zasady danych

- **Slug jest niezmienny.** Raz nadany identyfikator żyje na zawsze — zmiana zrywa cały graf.
  Nowy slug buduj z tytułu (`[[slugify]]`: małe litery, myślniki), a przy kolizji dopisz
  wyróżnik (rok, wariant, gra).
- **Ścieżki i odsyłacze muszą istnieć.** Pole `seria`/`mechy`/`bronie`/`gra` wskazuje na wpis
  o właściwym typie; build to sprawdza i przerywa pracę przy błędzie.
- **Skryptu epizodu nie poprawiasz.** `episodes/**` to archiwum rozgrywki — czytasz, nie edytujesz.
- **Nie wymyślaj faktów.** Czego nie ma w skrypcie i czego nie potwierdza źródło, tego nie wpisujesz
  jako ustalenia. Luka opisana wprost („w skrypcie nie pada tytuł odcinka") jest lepsza niż
  pewnie brzmiąca nieprawda.
- **Rozdzielaj poziomy pewności.** Pole `pochodzenie`: `skrypt` (wprost z gry), `menu` (odczyt
  z ekranów), `wiedza` (kontekst agenta — **wymaga** `zrodla` i sekcji `## Źródła`).
- **Statystyki i arsenał należą do pary (mech, gra), nie do mecha.** Jeśli skrypt lub menu podaje
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
- Nie wypełniać pól na siłę. Pusta lista znaczy „jeszcze nie wiem" i jest w porządku.
- Nie dodawać zależności npm do silnika witryny (`src/srw/`). Zależności build-time wymagają ADR-a.

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
