# Co nowego

Dziennik zmian widoczny w witrynie pod `#/co-nowego`. Prowadzi go agent przy każdym PR:
wpis dodaje się jako nowy nagłówek dnia, a pod nim punktowane zmiany. Najnowsze na górze.

Konwencja: `## RRRR-MM-DD` otwiera wpis dnia. Inne nagłówki są ignorowane.

## 2026-10-17

- Zasady (ADR 0012): nowe encje tylko wprost z dostawy (skryptu); bez wiedzy o przyszłości względem
  stanu fabuły; bronie nie są osobnym typem, tylko częścią opisu mechów.
- Nawigacja: gra → epizod → scena. Dodany dział „Sceny”; usunięte „Bronie”.
- Dodany mech Exart (CF-00) wprost z skryptu, z pilotem Seishiro. Uzbrojenie nieznane, zapisane jako brak.
- Menu główne: Sceny, Epizody, Postacie, Mechy. Gry, Serie, Hasła, Tagi, Co nowego i O bazie w stopce.
  Treść sceny pokazana z formatowaniem (bez znaczników md). Co nowego: poprawiony układ punktów.
- Rozwinięcie SRW OE: postać Dr. Hell i hasło Devil Gundam Incident (oba wymienione w prologu), z danymi
  ze sprawdzonych źródeł i odsyłaczami w epizodzie. Nawiązania, rozbieżności i wiedza modelu są w epizodzie.
- Nowy typ strony „Hasło” (`pojecie`, dział „Hasła”): podstrony w stylu wiki dla organizacji, er i państw.
  Pierwsze dziewięć haseł wyłącznie z prologu: Connect Force, Muge Empire, Earth Federation, Universal Century,
  U.C. 0079, Mechanization Empire, Jaku Empire, Evil God Drago, Daimakai. Pole `kategoria` jest swobodne.
- Rozwinięcie dostawy SRW OE (flow absorpcji, ADR 0010): gra uzupełniona o platformę i rok ze źródeł
  (PSP, 2013), postacie o wiek, seiyuu i nazwisko ze źródeł, epizod o wątki, nawiązania (Dr. Hell z Mazinger Z,
  Devil Gundam z G Gundam), wiedzę modelu bez linków i rozbieżności. Każdy fragment ma swój poziom.
- Pierwsza prawdziwa dostawa: Super Robot Wars OE, Episode 0 (`episodes/srw-oe/ep000.md`, zapisany
  1:1). Scena 0-1 (dosłowna treść skryptu, analiza z samego skryptu), postacie Seishiro i Himari
  Yaegaki, gra i epizod. Dostawa jest poziomu `skrypt`, białe tło.
- Usunięto demo w całości: gra, epizod, cztery sceny, skrypt demonstracyjny, wpisy mechów, pilotów
  i serii. Zniknął też baner „baza demonstracyjna”.
- Schemat: `numer` epizodu może być 0; postać i mech nie muszą mieć serii (oryginalne postacie i mechy gry).
- Poziom `menu` to dostawa właściciela o mechach, pilotach i broniach, nie tylko odczyt z ekranów
  gry (doprecyzowanie ADR 0010). Zawsze poziom 1, zapisywana w repozytorium 1:1.
- Sceny jako osobny typ strony (ADR 0008): treść sceny dosłownie ze skryptu (build sprawdza
  wierność), analiza pod spodem; strona epizodu zbiera sceny w sekcję „Sceny”. Numer sceny to
  dowolny tekst, a adres sceny powstaje z tytułu. Demo: cztery sceny z `demo-ep001`.
- Źródła tylko po sprawdzeniu (ADR 0009): adresy bez weryfikacji usunięte z bazy; „wiedza modelu”
  oznacza teraz treść niesprawdzoną, bez linków. Getter-1 jako pierwszy wpis „ze źródła”.
- Poziomy wiarygodności (ADR 0010): kolor tła zamiast plakietek — białe dostawa właściciela,
  pastelowy niebieski źródła sprawdzone, pastelowy zielony wiedza i analiza modelu. Zapisana
  procedura asymilacji dostaw.
- Poziom wiarygodności na fragmencie, nie na stronie (ADR 0011): blok `{{zrodlo ... }}` (także
  `skrypt`, `menu`, `wiedza`). Strona może łączyć poziomy; fragment bez bloku to błąd builda.
  Listy i strony są neutralne.
- Usunięto ikonki typów stron z całej witryny (nagłówki, listy, wyniki wyszukiwania, linki).
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
