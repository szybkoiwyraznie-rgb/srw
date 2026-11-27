# Archiwum wewnętrznych notatek zmian

Przeniesiono z witryny 2026-10-19 (ADR 0018). Historyczne notatki opisują stan
w chwili zapisu; nie zastępują aktualnych decyzji i zasad.

- 2026-11-27 19:20 — dostawa ilustracji misji 4-4 SRW OE: dziewięć plików jednostek (Bat-Shu ×2, Gawain ×2, L-Gaim ×2, Novel D-Sserd ×2, Turner) i siedem portretów (C.C. — klucz „C. C..png”, Daba Myroad, Fannaria Amm, Gaw Ha Leccee, Lelouch vi Britannia — klucz „Lelouch Lamperouge.png”, Lilis Faw, Mirawoo Kyao). Galerie w blokach menu srw-oe przed parametrami; manifest 267 encji / 339 plików. Odczyt R2: Actions 46048452541, check-run 140673488206 — 16/16 kluczy, bucket 343 obiekty (jeden poza odczytanymi częściami 1–10 z 12, niezidentyfikowany). Bez wpisu w dzienniku (L36).
- 2026-11-20 00:15 — rozdzielenie mechów z Macross Frontier na osobne strony dla każdej formy (zgodnie ze wzorcem Cybuster/Cybird oraz Wing Gundam Zero / Wing Zero NB): Macross Quarter w trybie fortecy (`macross-quarter`) i w trybie ataku (`macross-quarter-attack-mode`), a także pary Fighter i Battroid dla RVF-25 Messiah (`rvf-25-messiah` i `rvf-25-messiah-battroid`), VF-25F Messiah (`vf-25f-messiah` i `vf-25f-messiah-battroid`) oraz VF-25G Messiah (`vf-25g-messiah` i `vf-25g-messiah-battroid`). Każda z 8 form ma własną stronę, parametry uzbrojenia i macierzyste zdolności z dostawy 3-5, wzajemne powiązania transformacji oraz przypisane ilustracje z R2 w `media/ilustracje.json` (łącznie 240 encji, 303 obrazy). Piloci otrzymali powiązania do obu form, zaktualizowano powiązania w serii Macross Frontier. Testy 537/537 pass, build 424 stron / 6554 powiązania.
- 2026-11-19 22:50 — dostawa ilustracji misji 3-5 SRW OE: 20 plików jednostek w korzeniu (Braver, Daljan, Enhanced Layzner, Macross Quarter w trybach Atack i Fortress oraz po cztery pliki w trybach Battroid i Fighter dla RVF-25 Messiah, VF-25F Messiah i VF-25G Messiah) oraz 10 portretów w characters/ (Albatro Null Eiji Asuka, Alto Saotome, Bobby Margot, Catherine Glass, Gosterro, Jeffrey Wilder, Luca Angeloni, Michael Blanc oraz Monica Lang i Rei — nowe strony postaci z ADR 0017); klucze potwierdza odczyt listy R2 z 2026-11-20 (Actions 44808040752, check-run 136537087021). Klucz „Cathering Glass.png” zachowuje pisownię właściciela, tytuł strony to Catherine Glass. Wszystkie 15 istniejących stron zyskało sekcję ## Ilustracje przed ## Parametry. W src/srw/markdown.js i test/dostawa-pl.test.js dodano obsługę zbalansowanych nawiasów w linkach Markdown (![]() i []()). Nowe strony monica-lang i rei powiązane w seriach (L16). Testy 536/536, build 420 stron / 6520 powiązań.
- 2026-11-18 14:34 — na wyraźne, wyjątkowe polecenie właściciela usunięto jedną kwestię z dostawy 3-4, archiwum epizodu i sceny oraz wynikające z niej opisy i powiązania. Dostawa po korekcie: 33560 B, SHA-256 `562a3f09c7287acd3f04eb560ebe5da0c353c3a054bf7753df6608b3c8776cd5`; kontrola wierności i testy uwzględniają ten stan. Pozostała treść dostawy nie została zmieniona. Sprostowanie wcześniejszego błędnego przypisania mówcy uchylono; podział drużyn z 2-8 pozostaje bez zmian.
- 2026-11-18 14:20 — uzupełniono opisy decyzji o podziale drużyn po scenie 2-8 w hasłach postaci, maszyn i organizacji; dopisano test ciągłości tej decyzji (L26).
- 2026-11-18 14:15 — audyt parametrów: 18 maszyn i cztery postacie OE pokazują dane w `{{menu}}` po galerii; uzbrojenie Exii oraz dwóch form Wing Zero uzupełniono z dostaw 3-1 i 3-2. Wing Zero otrzymuje odrębny profil trybu MS, wcześniej skopiowany z NB. Uzupełniono nazwy skrócone Asuki i Garmy, sprostowano opisy scen 1-3, 1-5 i 3-1 oraz dodano testy widoczności parametrów i odrębności obu form. Dodatkowe źródło w haśle Hiromiego Tachibany.
- 2026-11-18 11:22 — dostawa ilustracji 3-4 (`Geloog Standard.png`, `Geloog Standard 2.png`, 2 167 858 B i 2 442 838 B, zmodyfikowane 11:17 UTC): klucze wzięte z odczytu listy R2 (Actions 44293747719, check-run 134765303083; 274 obiekty, poza manifestem tylko trzy wycofane portrety z Macross Delty), nie ze zrzutu właściciela — pisownia „Geloog” zachowana, tytuł strony to *Gelgoog* z dostawy tekstowej. Galeria na `content/mechy/gelgoog.md` w bloku `{{menu gra=srw-oe}}` przed „Parametrami”, wpis `gelgoog` w manifeście, `dostarczono` = 2026-11-18, liczby 271 obrazów / 217 encji (136 portretów, 135 plików jednostek). Nowy test dostawy w `test/dostawa-pl.test.js` (klucze, galeria, zakres gry, rozdzielność od dowódczego Gelgooga Chara). Testy 507/507, build 386 stron.
- 2026-11-18 09:16 — proza widoczna w witrynie przepisana na świat (ADR 0018 pkt 3, adnotacja 2026-11-18): w 24 plikach `content/sceny/`, pięciu archiwach epizodów, `content/postacie/mikhail-kaminsky.md` i `content/pojecia/krzyz-zeonu.md` zniknęły zdania, których podmiotem była gra („gra przenosi”, „gra zachowuje”, „w grze pluton czeka”, „scenariusz gry pomija”, „dialogi warunkowe”, „do gry należy”), a zostały porównania z pierwowzorem i treść o postaciach, maszynach i wydarzeniach. W dzienniku publicznym przepisano osiem pozycji z tym samym podmiotem (`2026-11-17 20:32`, `2026-11-09 13:58`, `2026-11-07 21:55`, `2026-11-02 13:14`, `2026-10-24 22:50`, `2026-10-24 21:48`, `2026-10-17 23:55`), bez zmiany ich treści merytorycznej. Strażnicy: lista `technikalia` w `test/dziennik-zmian.test.js` rozszerzona o „analizę”, „komentarz”, „streszczenie”, „scenariusz”, „własnymi słowami”, „język warsztatu”, redakcję i podmiot „gra …”; nowy test `proza scen i epizodów mówi o świecie, nie o grze jako autorze` w `test/sceny.test.js`. Lekcja L25. Testy 506/506, build 386 stron.
- 2026-11-18 09:10 — z dziennika publicznego usunięte dwa wpisy z 2026-11-17 21:39, które opisywały pracę nad analizami („trzynaście części analizy opisuje teraz wydarzenia sceny własnymi słowami”, „język warsztatu zniknął z analiz scen”), a nie świat — naruszenie ADR 0018 pkt 3 i adnotacji z 2026-11-09. Treść merytoryczna obu wpisów: analiza sceny 3-3 opowiada o pierwszym zetknięciu Shigego i Sakakiego z kolonią, odprawie Seishira na White Base, samotności Keroro w obcym mieście, zabezpieczaniu bezzałogowych Laborów, rezonansie, który je budzi, przybyciu Amura i Kaia, powściągliwości walki w zabudowie i śledztwie kończącym się nowym programem ochronnym. Przy okazji z prozy scen i epizodów zniknęły zwroty o autorze („gra pokazuje”, „gra przenosi”, „scenariusz gry”, „dialogi warunkowe”, „scena nie mówi”): opisują przebieg wydarzeń albo różnicę wobec pierwowzoru, nie warsztat. Testy 505/505, build 386 stron.
- 2026-11-18 08:30 — dostawa 3-4 „Szturm na kryjówkę piratów” (`dostawy/srw-oe/dostawa_3_4.txt`, 33608 B, sha256 f1ca4f3c…): archiwum epizodu 3 domknięte skryptem misji, nowa scena `srw-oe-ep3-kryjowka-piratow` (6 bloków skryptu, 6 par analizy), strony `gelgoog` (dane menu z 8 linii), `pilot-ms` (SP 10, Atak 105, Obr 66, Cel 126, Unik 61, umiejętność „Szeregowy”) i `stacja-mars`; `pilot-ms` dopisany do `piloci` czterech maszyn (Gelgoog, Rick Dom, Zaku II/Bazooka, Zaku II/Karabin maszynowy), `pilot-ms` i bohaterowie misji dopełniają obsadę epizodu. Trzy wiersze wątków epizodu (cztery w scenie), akapit streszczenia; pusta stopka `## Wariant tekstu DLC — Szturm na kryjówkę piratów` (bez żadnych zmienionych kwestii) zostaje poza archiwum i poza prozą witryny (ADR 0018). Testy 505/505 (nowy `test/epizod-3-misja-4.test.js`), build 386 stron, `tools/uczestnicy-dostaw.mjs`: 238/238 par nazw i 414/414 par jednostka–pilot.
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

## 2026-11-25 — wpisy usunięte z dziennika (ilustracje to media, nie fabuła)

Polecenie właściciela z 2026-11-25 20:27: dziennik nie ogłasza portretów, ujęć ani innych mediów
i nie relacjonuje uzupełniania opisów — baza jest o fabule (ADR 0018, adnotacja
2026-11-25). Usunięte z `content/co-nowego.md`:

- ## 2026-11-25 20:14
- - Portrety mają piloci drużyny Good Thunder — [[shingo-hojo|Shingo Hojo]], [[killy-gagley|Killy Gagley]] i [[remy-shimada|Remy Shimada]] — oraz [[mina-roshan|Mina Roshan]] i [[ram-hoa|Ram Hoa]] z mostka [[macross-quarter|Macross Quartera]]; [[goshogun-robo|GoShogun]] i jego mroczny przeciwnik [[dark-go-saurer|Dark Go-Saurer]] pokazują się w dwóch ujęciach każdy.
- ## 2026-11-17 19:52
- - **Wizerunki [[sergeant-keroro|sierżanta Keroro]] i jego maszyn** — portret [[sergeant-keroro|sierżanta Keroro]], dwa obrazy [[keroro-robo-mk-ii|Keroro Robo Mk-II]] i jeden wizerunek jego lotniczej formy [[keroro-jet|Keroro Jet]].
- - **Wizerunki obsady i maszyn z [[srw-y-ep1-misja-2a-przebudzenie-niebianskiego-demona|„Przebudzenia niebiańskiego demona”]]** — własne portrety mają [[show-kamui|Show Kamui]], [[hayato-jin|Hayato Jin]], [[shikishima|Shikishima]] i [[igari|Igari]] z [[laboratorium-saotome|Laboratorium Saotome]] oraz [[yume-minami|Yume Minami]], [[koyomi-yamanaka|Koyomi Yamanaka]], [[chise-asukagawa|Chise Asukagawa]], [[mei|Mei]] i [[matka-yomogiego|matka Yomogiego]] z [[miasto-yagami|miasta Yagami]], a sylwetki bojowe prezentują [[getter-arc|Getter Arc]], [[getter-kirik|Getter Kirik]], [[getter-khan|Getter Khan]], [[insector|Insector]] i [[zordo-xx|Zordo XX]].
- ## 2026-11-15 22:05
- - [[gihren-zabi|Gihren Zabi]] i [[kycilia-zabi|Kycilia Zabi]] mają własne portrety, a [[invader-air|Invader/Air]] i [[metal-beast-muszla|Metalowa Bestia]] — ujęcia w walce: latający [[invader|Invader]] jedno, Bestia dwa, w tym wariant ze skorupą widzianą z bliska.
- ## 2026-11-14 21:20
- - [[gundam-exia|Gundam Exia]] ma dwa własne ujęcia, [[wing-gundam-zero|Wing Gundam Zero]] dwa, a jego skrzydlata forma [[wing-gundam-zero-nb|Wing Zero NB]] jedno. - Portrety mają [[garma-zabi|Garma Zabi]], [[heero-yuy|Heero Yuy]], [[setsuna-f-seiei|Setsuna F. Seiei]] i [[uragan|Uragan]] — czterej świadkowie kurylskiej zasadzki, od atakującego obserwatorium Garmy po dowódcę odsieczy.

Przy tej samej okazji przepisano na zdania o świecie wpisy, które mówiły o samej bazie
(„nabiera wyrazu”, „ma nawiązanie”, „prowadzi do odcinka”, „ma opis z serialu”, „zyskała
tło”, „mają pełniejsze opisy”, „jest opisany osobno”, „uwzględniono reprezentację”,
„w wykazie maszyn”, „reprezentują”): 2026-11-25 20:21, 20:04, 19:59, 19:55;
2026-11-23 23:36; 2026-11-20 22:40; 2026-11-14 14:12; 2026-11-11 17:30. Treść merytoryczna bez zmian.

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

## 2026-11-16 — wpisy usunięte z dziennika (interfejs i układ tabel)

Na wniosek właściciela z 2026-11-16 publiczny dziennik mówi wyłącznie o fabule.
Poniżej notatki o interfejsie i formacie, usunięte z `content/co-nowego.md`:

- 2026-11-16 12:15 — quick menu ze spisem boksów u szczytu prawej kolumny na każdej podstronie z co najmniej dwoma boksami (ADR 0042); nowy `src/srw/skoki-w-stronie.js`, test `test/spis-boksow.test.js`.
- 2026-11-16 10:40 — wątki scen w jednym czterokolumnowym kształcie tabeli we wszystkich scenach; motyw, pochodzenie, odcinek pierwowzoru i różnice w jednym wierszu (ADR 0031); nowy `test/watki-scen.test.js`. Rozdzielenie zbiorczych wątków na Patlabor i wkład gry oraz na Zeon, 08. Pluton MS i pierwszego Gundama zostało opisane w samych scenach.
