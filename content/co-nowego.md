# Co nowego

Dziennik zmian widoczny w witrynie pod `#/co-nowego`. Prowadzi go agent przy każdym PR:
dopisuje nowy wpis na górze, z datą i godziną publikacji (czas Europa/Warszawa, moment commita).

## 2026-10-18 00:58

- Himari: usunięta informacja wyprzedzająca rozegraną fabułę. Zewnętrzne źródło nie uprawnia do ujawniania przyszłych wydarzeń (ADR 0012).

Konwencja: `## 2026-10-18 00:35

- Uzbrojenie Exart: usunięta kolumna Gate (w dostawie wszędzie „None in this field”).
- Seishiro: pełne imię i nazwisko z dostawy (Seishiro Kusanagi).
- Teksty w blokach i strony encji korzystają z całej szerokości (bez ograniczenia 74 znaków).

## 2026-10-18 00:31

- Strony postaci, mechów, haseł, epizodów i scen: bez prawej kolumny. Informacje (pola, tagi, nawigacja) są w pasku na górze, a treść zajmuje całą szerokość.

## 2026-10-18 00:28

- Nowa dostawa: Exart (uzbrojenie, zdolności natywne, pilot domyślny) i umiejętności Seishiro. Dostawa zapisana 1:1 w `dostawy/srw-oe/`, a na stronach w blokach poziomu 1 (`menu`). Uzbrojenie Exart opisuje mech (ADR 0012).

## 2026-10-18 00:25

- Deweloperem Super Robot Wars OE jest Banpresto (z LaunchBox). Wpis GameFAQs o sazanami usunięty z bazy.
- Strona główna: usunięta sekcja „Rozgrywka” z kartą gry.

## 2026-10-18 00:22

- Dr. Hell przeniesiony z sekcji „Postacie” do haseł: to postać z innej serii (*Mazinger Z*), a nie postać gry. Zasada zapisana w ADR 0013.

## 2026-10-18 00:13

- Źródła są przy konkretnych informacjach (link w tym samym punkcie), a nie w osobnej sekcji „Źródła”. Dotyczy wszystkich stron, w tym Jaku Empire.
- Walidacja: każde źródło z pola `zrodla` musi być podane w treści przy informacji, której dotyczy.

## RRRR-MM-DD GG:MM` otwiera wpis. Najnowsze wpisy na górze. Inne nagłówki są ignorowane.

## 2026-10-18 00:03

- Hasła (`pojecie`) mają teraz dane ze sprawdzonych źródeł (Wikipedia, Eldran Wiki, TV Tropes, JP Wikipedia) i wiedzę modelu oznaczoną jako niesprawdzona. Każde hasło ma źródła.
- Dziennik zmian: najnowsze wpisy na górze, każdy z godziną publikacji.
- Stopka każdej strony: data i godzina utworzenia oraz ostatniej modyfikacji. Strony list i strona główna pokazują zakres całej bazy.
- Epizod: Muge Empire i Universal Century mają źródła, a nie tylko wiedzę modelu. Pozostałe frakcje z prologu mają źródła w hasłach.

## 2026-10-17 23:55

- Rozwinięcie SRW OE: postać Dr. Hell i hasło Devil Gundam Incident (oba wymienione w prologu), z danymi ze sprawdzonych źródeł i odsyłaczami w epizodzie. Nawiązania, rozbieżności i wiedza modelu są w epizodzie.

## 2026-10-17 23:53

- Menu główne: Sceny, Epizody, Postacie, Mechy. Gry, Serie, Hasła, Tagi, Co nowego i O bazie w stopce.
- Treść sceny pokazana z formatowaniem (bez znaczników md). Co nowego: poprawiony układ punktów.
- Connect i Connect Force to jedna organizacja, więc jest jedno hasło.

## 2026-10-17 23:46

- Nowy typ strony „Hasło” (`pojecie`, dział „Hasła”): podstrony w stylu wiki dla organizacji, er i państw. Pole `kategoria` jest swobodne.
- Pierwsze dziewięć haseł wyłącznie z prologu: Connect Force, Muge Empire, Earth Federation, Universal Century, U.C. 0079, Mechanization Empire, Jaku Empire, Evil God Drago, Daimakai.

## 2026-10-17 23:43

- Zasady (ADR 0012): nowe encje tylko wprost z dostawy (skryptu); bez wiedzy o przyszłości względem stanu fabuły; bronie nie są osobnym typem, tylko częścią opisu mechów.
- Nawigacja: gra → epizod → scena. Dodany dział „Sceny”; usunięte „Bronie”.
- Dodany mech Exart (CF-00) wprost z skryptu, z pilotem Seishiro. Uzbrojenie nieznane, zapisane jako brak.

## 2026-10-17 23:36

- Rozwinięcie dostawy SRW OE (flow absorpcji, ADR 0010): gra uzupełniona o platformę i rok ze źródeł (PSP, 2013), postacie o wiek, seiyuu i nazwisko ze źródeł, epizod o wątki, nawiązania (Dr. Hell z Mazinger Z, Devil Gundam z G Gundam), wiedzę modelu bez linków i rozbieżności. Każdy fragment ma swój poziom.

## 2026-10-17 23:32

- Skrypt SRW OE: usunięte artefakty kopiowania (`\!`, `\.`, `&gt;`). Blok sceny przebudowany z oczyszczonego skryptu.

## 2026-10-17 23:28

- Pierwsza prawdziwa dostawa: Super Robot Wars OE, Episode 0 (`episodes/srw-oe/ep000.md`, zapisany 1:1). Scena 0-1 (dosłowna treść skryptu, analiza z samego skryptu), postacie Seishiro i Himari Yaegaki, gra i epizod. Dostawa jest poziomu `skrypt`, białe tło.
- Usunięto demo w całości: gra, epizod, cztery sceny, skrypt demonstracyjny, wpisy mechów, pilotów i serii. Zniknął też baner „baza demonstracyjna”.
- Schemat: `numer` epizodu może być 0; postać i mech nie muszą mieć serii (oryginalne postacie i mechy gry).

## 2026-10-17 22:39

- Poziom `menu` to dostawa właściciela o mechach, pilotach i uzbrojeniu, nie tylko odczyt z ekranów gry (doprecyzowanie ADR 0010). Zawsze poziom 1, zapisywana w repozytorium 1:1.

## 2026-10-17 22:36

- Poziom wiarygodności na fragmencie, nie na stronie (ADR 0011): blok `{{zrodlo ... }}` (także `skrypt`, `menu`, `wiedza`). Strona może łączyć poziomy; fragment bez bloku to błąd builda. Listy i strony są neutralne.

## 2026-10-17 22:31

- Poziomy wiarygodności (ADR 0010): kolor tła zamiast plakietek — białe dostawa właściciela, pastelowy niebieski źródła sprawdzone, pastelowy zielony wiedza i analiza modelu. Zapisana procedura asymilacji dostaw.

## 2026-10-17 22:18

- Usunięto ikonki typów stron z całej witryny (nagłówki, listy, wyniki wyszukiwania, linki).

## 2026-10-17 22:06

- Źródła tylko po sprawdzeniu (ADR 0009): adresy bez weryfikacji usunięte z bazy; „wiedza modelu” oznacza teraz treść niesprawdzoną, bez linków. Numer sceny dowolny, slug z tytułu (ADR 0008).

## 2026-10-17 21:59

- Sceny jako osobny typ strony (ADR 0008): treść sceny dosłownie ze skryptu (build sprawdza wierność), analiza pod spodem; strona epizodu zbiera sceny w sekcję „Sceny”. Demo: cztery sceny z `demo-ep001`.

## 2026-10-17 21:57

- Witryna w trybie jasnym (decyzja właściciela): zmieniona paleta i kolory plakietek.
- Naprawiono listy: zawinięta pozycja nie rozpada się na osobny akapit, a pusta linia między pozycjami nie dzieli listy na dwie.

## 2026-10-17 21:42

- Model sesji agenta (ADR 0007): PR z planem i audytem na starcie, treść tylko z zatwierdzonego flow, commit i push po każdym zielonym kroku, scalanie wyłącznie po stronie właściciela.
- Przepisano opis środowiska pracy (`docs/guides/ENVIRONMENT.md`) i dopisano lekcje L6–L10 przeniesione z pozostałych repozytoriów właściciela. Treść bazy bez zmian.

## 2026-10-13 21:12

- Powstała baza: struktura katalogów, silnik witryny, build i publikacja na GitHub Pages.
- Dodano wpisy demonstracyjne (gra DEMO, przykładowy epizod 01 oraz sześć encji: trzy postacie, trzy mechy, pięć broni i trzy serie anime) — do zastąpienia realnymi danymi.
- Ustalono znaczniki pochodzenia informacji (`skrypt` / `menu` / `wiedza`) i zasadę źródeł dla wiedzy spoza rozgrywki.
