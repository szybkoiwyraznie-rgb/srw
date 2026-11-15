# Archiwum wewnętrznych notatek zmian

Przeniesiono z witryny 2026-10-19 (ADR 0018). Historyczne notatki opisują stan
w chwili zapisu; nie zastępują aktualnych decyzji i zasad.

- 2026-11-15 16:20 — powłoka z indeksem i leniwe ciała stron (ADR 0041, na wzór `wwm` ADR 0017): `npm run build` daje `dist/index.html` (268 kB: styl, kod, indeks gzip+base64) i `dist/data/` (346 ciał, 1769 kB; teksty do wyszukiwarki 657 kB, dziennik 161 kB — osobne pliki). `npm run build:single` zachowuje dawny artefakt jednoplikowy dla `file://`. Uchylony punkt 4 ADR 0001; nowy `src/srw/ladowanie.js`, asynchroniczny router z tokenem renderu, komunikat błędu przy braku pliku, `obraz` w indeksie dla miniatur list. Testy: `build`, `ladowanie`, `powloka` (dymny start prawdziwego skryptu w vm). 474/474.
- 2026-11-15 15:05 — dostawa rozmów niebojowych z A. Adventu (SRW Y, plik `dostawy/srw-y/Y_dostawa_1_1C_Advent_chats.txt`, trzy rozmowy: pamięć STG, załoga asysty, DLC). Nowe hasło `zaloga-asysty` (pochodzenie: skrypt); uzupełnione `pamiec-stg` (MXP, trzy ścieżki, wybór Echiki), `nira-kana-i` (serce okrętu), `a-advent` (załoga asysty), `wren` i `echika-y-franburnett`. Rozmowa o DLC pominięta — to informacja o dodatku, nie o świecie. Testy 461/461, build 346 stron.
- 2026-11-14 21:45 — etykieta galerii odczepiona od kolejności pola `gry`: test dostawy sprawdza, że etykieta należy do listy gier strony (a nie że jest pierwsza), test kart listy sprawdza obecność postaci na liście każdego zadeklarowanego tytułu; adnotacja w ADR 0020 uchyla „kolejność gier z pola `gry`”. Usunięte meta-komentarze o bazie i stronach z treści (wing-gundam-zero, wing-gundam-zero-nb, serie Gundam 00 i Gundam Wing, mobile-armor, uc-0079); zakaz rozciągnięty testem na boksy `{{zrodlo}}` i `{{wiedza}}`.
- 2026-11-14 21:20 — dostawa dziewięciu ilustracji misji 3-1: pięć plików jednostek (dwa ujęcia Gundam Exia, trzy Wing Zero z wariantem „NB”) i cztery portrety (Garma Zabi, Heero Yuy, Setsuna F. Seisei, Uragan); galerie na siedmiu stronach, manifest wyrównany do 195 encji i 246 plików, odczyt listy R2: Actions 43641769280 (249 obiektów). Klucz „Setsuna F. Seisei.png” zachowuje pisownię właściciela. Wing Zero i Wing Zero NB to w bazie dwie maszyny (jak Cybuster i Cybird): „Wing Zero NB.png” dostała nowa strona wing-gundam-zero-nb, a rekord „Wing Zero/NB” z dostawy obsługuje obie strony; mapowanie nazwy w tools/uczestnicy-dostaw.mjs wskazuje stronę bazową. Galeria Heero ma etykietę OE, bo stamtąd pochodzą ilustracje; kolejność pola gry jest przypadkowa i nie wyznacza etykiet.
- 2026-11-10 23:15 — dostawa 34 ilustracji misji 2-8: po dwa pliki pięciu jednostek (Bolt Robo/Anti-Air, Brocken/Cannon, Daiteioh, Ganbaruger, Gandoppler) i 24 portrety (Eldran, uczniowie klasy Obrony Ziemi i z Go-Saurera, piloci Ganbarugera i Daiteioha); galerie na 29 stronach, manifest wyrównany do 191 encji i 240 plików, odczyt listy R2: Actions 42909697708. Klucze Bolt Robo mają w buckecie dwie spacje po „Robo”. Boks „Powiązania” zwinięty do 50 pozycji z przyciskiem „Rozwiń” (ADR 0039).
- 2026-11-09 12:05–13:40 — układ boksów stron encji bez tytułów opisowych (ADR 0035), kryterium udziału w grze i hasła dla osób wspominanych (ADR 0013), mówcy prologu SRW Y w Postaciach, ciaśniejsze odstępy między boksami.
- 2026-11-09 18:20–18:55 — jeden boks opisowy na grę na stronach encji: usunięte agentowe parafrazy dublujące opisy z dostawy (20 stron), pary kanonicznych opisów scalone w jeden boks (zamza-zah, invader, mechabestia, mucus); reguła dopisana do ADR 0035.
- 2026-11-09 19:10–19:40 — audyt boksów źródeł/wiedzy: 10 stron ze źródłami podzielonymi na kilka boksów scalonych w jeden blok `{{zrodlo}}` z sekcjami (m.in. kuro, shiro, cybuster, devil-gundam-incident), 17 boksów-dodatków („Pozostałe jednostki…”, „Dane z misji”, „Umiejętność pilota”) wchodzi jako sekcje boksów opisowych; dubli treści nie znaleziono.

# Co nowego

Dziennik zmian widoczny w witrynie pod `#/co-nowego`. Prowadzi go agent przy każdym PR:
dopisuje nowy wpis na górze, z datą i godziną publikacji (czas Europa/Warszawa, moment commita).

## 2026-11-15 22:05

- Dostawa ilustracji do wpisów z epizodu 3-2 (ADR 0017): portrety `characters/Gihren Zabi.png` i `characters/Kycilia Zabi.png`, ujęcia maszyn `Invader - latający.png` oraz `Metal Beast.png` + `Metal Beast 2.png`. Trafiły do bloków `{{menu gra=srw-oe}}` → „Ilustracje” w `gihren-zabi`, `kycilia-zabi`, `invader-air` i `metal-beast-muszla`; `metal-beast-muszla` ma dwa ujęcia z licznikiem „1 z 2”/„2 z 2”. Wpis w dzienniku zmian dopisany, testy ADR 0018 zielone.

## 2026-11-15 21:40

- Dostawa `dostawa_3_2.txt` (epizod 3-2, `DL103_12`) wprowadzona do bazy: archiwum `episodes/srw-oe/ep003.md` (dopisany skrypt 3-2), scena `srw-oe-ep3-skradajacy-sie-cien` (11 bloków `:::skrypt`, mapa `sekcje_analizy` 11 par), epizod `srw-oe-ep3` (druga misja w streszczeniu, pięć nowych wierszy proweniencji, trzy akapity komentarza).
- Nowe encje: mechy `invader-air`, `metal-beast-muszla` (parametry z dostawy w `w_gre`), postacie `gihren-zabi`, `kycilia-zabi` (parametry z menu), hasła `cyber-newtype`, `sily-kolonii`. Dopisane wystąpienia: `invader`, `suol`, `sayla-mass`, `michel-ninorich`, `asuka-tsukishiro`, `isao-ota`, `kanuka-clancy`, `mikiyasu-shinshi`.
- Surowa dostawa w `dostawy/srw-oe/dostawa_3_2.txt` (bajt w bajt); katalog roboczy `google_drive/` usunięty, bo testy pilnują jego braku.
- `node tools/uczestnicy-dostaw.mjs` bez rozbieżności (218/218 przypisań, 393/393 par jednostka–pilot); `npm test` 474/474.

## 2026-10-19 19:20

- Szablon epizodu nie przypomina o brakującej dacie rozegrania. Podana data nadal jest wyświetlana; brak daty nie tworzy sekcji „Do uzupełnienia” ani pustego podtytułu.

## 2026-10-19 19:18

- Usunięto informację wyprzedzającą fabułę z wpisu Himari oraz jej powtórzenia w danych i wpisie Exarta, komentarzu epizodu i dawnych notatkach dziennika. Pozostawiono wyłącznie rolę operatorki ujawnioną w szkoleniu podstawowym.
- Oznaczenie informacji jako pochodzącej z menu nie uchyla zakazu wyprzedzania fabuły. Archiwalna dostawa pozostaje niezmieniona, ale nie wszystkie jej dane mogą zostać opublikowane w bazie.

## 2026-10-19 19:10

- Ilustracja właściciela jest pełnoprawną dostawą encji (ADR 0017): brak tekstu nie blokuje utworzenia wpisu, opis uzupełnia agent na podstawie kwerendy lub jawnie oznaczonej pamięci modelu.
- Nowe postacie: Kuro i Shiro, z ilustracjami R2, opisami na podstawie Akurasu i Super Robot Wars Wiki oraz powiązaniami z Masakim i Cybusterem. Bez dopisywania ich do sceny 0-1 lub domyślnej załogi z dostawy parametrów.
- Wszystkie 15 ilustracji z przekazanej listy przypisane do 10 encji. Kwerenda opisu nie oznacza niezależnego sprawdzenia zawartości obrazów w R2.

## 2026-10-19 19:00

- Dodane 13 ilustracji z R2 do ośmiu wpisów: Exart (3), Cybuster (2), Cybird (1), Brocken (2), Real PG Gundam (2), Seishiro (1), Himari (1) i Masaki (1). Podglądy z odnośnikami do oryginałów, bez kopiowania dużych plików do repozytorium.
- Przypisania zgodne z listą plików przekazaną przez właściciela; manifest przechowuje jawny status braku niezależnej weryfikacji zdalnej. Kuro i Shiro pozostają nieprzypisani do czasu dostawy danych o tych encjach.

## 2026-10-19 18:59

- Polski skrypt epizodu 0 zastąpił poprzednią dostawę; scena i streszczenie odtworzone z nowego materiału, bez zmiany adresów wpisów.
- Nowa polska dostawa: Exart, Cybuster, Cybird, Brocken i Real PG Gundam. Parametry przypisane do Super Robot Wars OE; dawna angielska dostawa usunięta z aktualnego drzewa.
- Nowe encje: Masaki Andoh, Control AI, cztery mechy, trzy serie z dostawy oraz Invaderzy. Nazwy haseł z prologu zgodne z polską wersją.
- Rozdzielone dane menu od fabuły: dostawa menu nie jest podstawą dopisywania wydarzeń do sceny 0-1. Usunięte wcześniejsze ujawnienie przyszłości z hasła Connect Force.

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

## 2026-11-09 — wpisy usunięte z dziennika (treść o procesie, nie o fabule)

Na wniosek właściciela z 2026-11-09 dziennik publiczny mówi wyłącznie o fabule.
Poniżej notatki o procesie, bazie i formatowaniu, usunięte z `content/co-nowego.md`
(przepisane wpisy fabularne zachowano w dzienniku w nowym brzmieniu):

- 2026-11-09 16:50 — dostawa 24 ilustracji SRW Y (osiem jednostek, szesnaście portretów): galerie na 24 stronach, manifest wyrównany do 162 encji i 206 plików; testy 410/0.
- 2026-11-09 15:40 — strona gry z kompletem danych wydawniczych; usunięta zdublowana lista obsady w menu serii.
- 2026-11-09 15:22 — strony czterech bohaterów z blokami obecności w SRW Y.
- 2026-11-09 15:05 — jedenaście nazwisk z prologu i misji dostało własne strony z podaniem odcinka/filmu i cytatem ze źródła.
- 2026-11-09 14:22 — formatowanie scen (ciasne kwestie dialogowe, puste linie między blokami) i odstęp w tytułach działów z wybranym zbiorem.
- 2026-11-09 13:58 — blok „Nawiązania do oryginalnych odcinków” w scenie 1-1C; motyw parady z źródłem w Code Geass zamiast w grze.
- 2026-11-09 13:45 — opis serii III Glorification rozdzielony na poziomy (menu gry / blok źródłowy).
- 2026-11-09 13:33 — Charakterystyka Takumy wrócona do dosłownego opisu z gry; sformułowania strony oficjalnej w źródle.
- 2026-11-09 12:56 — scena i epizod połączone z osobnymi hasłami głosów prologu.
- 2026-11-09 12:00 — pełne charakterystyki encyklopedyczne w profilach; zachowane osobne linie dialogu w widoku sceny.
- 2026-11-08 10:40 — ilustracje obsady misji „W pościgu za Zanzibarem”.
- 2026-11-08 10:30 — nowe strony Bigro, Gelgooga Chara i Tokwana; tabela komend pilotów.
- 2026-11-07 21:55 — tabela wątków epizodu 2 z numerami odcinków; hasła rozwinięte; opis obserwatorów poprawiony.
- 2026-11-07 09:51 — nowe strony i hasła; nowe hasło „mobile armor”; ilustracje; drugie wpisy w tabelach komend.
- 2026-11-05 19:05 — drugie wpisy w tabelach pilotów.
- 2026-11-02 13:47–12:10 — dopisywane pierwowzory, zapisy nazw w źródłach, oznaczenia rodzaju jednostki.
- 2026-11-02 11:47, 09:28 — portrety i ilustracje na stronach.
- 2026-11-01 19:43 — pełna analiza dialogów; nowe profile z uzbrojeniem; tabela parametrów.
- 2026-11-01 13:32 — nowe opisy; rozróżnienia wariantów; poprawki opisów.
- 2026-10-29 14:10–12:35 — rozdzielone sceny, poprawione opisy, portrety, strona Goro Ishidy, ilustracje jednostek (26 plików).
- 2026-10-28 11:40–10:45 — korekty opisów scen i haseł.
- 2026-10-27 23:32 — cztery nowe serie z opisami pierwowzorów.
- 2026-10-25 09:50–00:15 — uzupełnione dzieje haseł, nowa postać Bakuryu-Oh, portrety i galerie.
- 2026-10-24 22:50–00:19 — nowe misje, strony, portrety, galerie, opisy, tagi, poprawki idiomów, tabela komend.
- 2026-10-23 20:13–13:30 — nowe jednostki i pilocy, portrety, strony uczniów.
- 2026-10-22 19:05–07:40 — ilustracje, portrety, nowe strony i hasła, poprawki opisów, bloki porównań ze źródłami.
- 2026-10-21 21:43–00:12 — portrety, ilustracje, nowe jednostki/piloci/hasła, statystyki.
- 2026-10-20 23:50–17:08 — strony, wpisy obsady, ilustracje, parametry.
- 2026-10-19 23:15–19:10 — dane pozyskane kwerendą, opisy potwierdzone źródłami, galerie, parametry.
- 2026-10-17 23:55–23:28 — hasła i powiązania scen.
