# Lekcje

Rejestr powtarzalnych pułapek i heurystyk — nieformalny, ale obowiązujący: jeśli coś tu jest,
to znaczy, że już raz nas ugryzło. Nowa lekcja = nowy wpis na końcu listy, z datą.

## L1 — Skrypt bez wpisu epizodu to nie awaria, to kolejka (2026-10-13)

Build przerywa pracę, gdy w `episodes/` leży plik bez odpowiednika w `content/epizody/`.
To celowe. Odruch „wyłączmy ten test, bo blokuje" jest błędny — komunikat wskazuje materiał,
który czeka na przetworzenie. Rozwiązaniem jest wpis epizodu, nie zmiana walidacji.

## L2 — Nazwy zapisuj tak, jak są w grze (2026-10-13)

Slug i tytuł encji biorą się z tego, co widać na ekranie albo w skrypcie. Transkrypcje robione
z pamięci rozjeżdżają się między sesjami („Getter-1" vs „Getter 1" vs „Getter One") i tworzą
duplikaty wpisów. Przy pierwszym rozjeździe scalamy wpisy, ale **slug zostaje ten pierwszy**
(ADR 0003) — dlatego lepiej zapisywać dokładnie.

## L3 — Wikilink z etykietą w tabeli wymaga escapowanego pionka (2026-10-13)

W komórce tabeli zapis `[[slug|etykieta]]` rozsypie kolumnę, bo `|` jest separatorem.
Piszemy `[[slug\|etykieta]]`. Parser tabel to obsługuje.

## L4 — Pochodzenie `wiedza` bez źródeł zatrzymuje build (2026-10-13)

Jeżeli wpis opisuje coś spoza rozgrywki (daty emisji, fabułę anime, pochodzenie postaci),
potrzebuje `pochodzenie: wiedza`, pola `zrodla` i sekcji `## Źródła`. Wyjściem nie jest
usunięcie znacznika, lecz znalezienie źródła albo przepisanie wpisu tak, by opisywał wyłącznie
to, co wiadomo z gry.

## L5 — Nie ujednolicaj przy okazji (2026-10-13)

Przy pracy nad nowym epizodem kusi, żeby „przy okazji" wyrównać stare wpisy do nowego stylu.
Nie robimy tego: różnorodność jest zamierzona (ADR 0006), a wartość sesji leży w nowym
materiale. Pogłębianie starych wpisów jest w porządku, gdy wynika z nowych faktów.

## L6 — Praca istnieje dopiero po `git push`; sandbox resetuje workspace (2026-10-14, dziedziczona z `mtg`/`AME`)

Sandbox Areny potrafi w trakcie sesji odtworzyć workspace ze świeżego klona: `HEAD` wraca
na `main`, lokalne commity i `/tmp` znikają, a pamięć sesji nie pamięta, że już to robiła.
Przetrwa wyłącznie to, co jest na zdalnej gałęzi `arena/<id>`. Dlatego commit i push następują
po **każdym** zielonym kroku, nie na końcu zadania; przed commitem `git rev-parse --abbrev-ref HEAD`
(commit poza gałęzią sesji nie trafi do PR-a); po commicie `git log --oneline -1`.
Procedura odzyskania po resecie: `docs/guides/ENVIRONMENT.md` §3 — bez `--force`.

## L7 — Akceptacja wyniku nie jest poleceniem scalenia PR (2026-10-14, dziedziczona z `AME` L18)

W `AME` właściciel napisał „akceptuję wszystkie cztery featury", a agent wykonał `gh pr merge`
— i usłyszał: „skąd Ci przyszło do głowy scalać?". Akceptacja treści, zielone testy ani pytanie
„czy to już na stronie?" nie są poleceniem merge. **Agent nigdy nie scala i nie zamyka PR-a**
(ADR 0007); odpowiedź brzmi „zmiany są w PR #N, scalenie należy do Ciebie". Scalenie lub
zamknięcie PR-a kończy pracę sesji — dostęp do GitHuba nie jest po nim gwarantowany
(`ENVIRONMENT.md` §2), więc nic nie zostawia się „na po scaleniu". Błędnego merge'a nie
cofa się pushem do `main` — opisuje się stan i czeka na decyzję właściciela.

## L8 — Brama jakości w potoku maskuje czerwony test (2026-10-14, dziedziczona z `AME` L19)

Łańcuch `npm test 2>&1 | grep -E '^# (pass|fail)' && npm run build && git commit && git push`
wykonał się „do końca" przy `# fail 1`: kod wyjścia potoku to kod **ostatniego** polecenia,
a `grep` znalazł dopasowania i zwrócił 0. Testy uruchamiaj jako samodzielne polecenie i patrz
na ich kod wyjścia (`npm test >/tmp/t.log 2>&1; echo $?`), a log oglądaj osobno. Dotyczy
każdej bramy, po której następuje commit. Nie filtruj też stderr builda do jednej linii —
przepada ostrzeżenie o płytkim klonie (fałszywe daty w stopkach stron).

## L9 — Komunikat commita przez `git commit -F`, nie `-m` (2026-10-14, dziedziczona z `AME`/`okolica`)

Backticki i `$(...)` w `git commit -m "…"` są dla basha podstawieniem komend: komunikat traci
słowa, a w skrajnym przypadku uruchamia polecenie (sprawdzone tutaj 2026-10-14). Komunikat
piszemy do pliku **poza repozytorium** (`/tmp/msg.txt`) i commitujemy `git commit -F /tmp/msg.txt`.
To samo dotyczy opisu PR: `gh pr create --body-file` / `gh api … -F body=@plik`.

## L10 — Opis PR to żywy dokument gałęzi, nie etap zamknięcia (2026-10-14, dziedziczona z `mtg` L9)

W `mtg` PR zaciągnął trzy commity merytoryczne, a jego opis do scalenia wymieniał tylko
pierwszy; kolejna sesja rekonstruowała zakres z `git log`. Tu nie ma handoffów ani dziennika
sesji — **opis PR jest jedynym nośnikiem planu, audytu i stanu sesji**, który przeżyje reset
sandboxa i koniec czatu. Aktualizuje się go kumulatywnie po każdym wypchniętym commicie
merytorycznym (odhaczony plan, odstępstwa, pomiary), zanim właściciel zdąży PR scalić.

## L11 — Adres bez sprawdzenia to nie źródło (2026-10-17)

Agent wpisał do `zrodla` adresy Wikipedii z pamięci i oznaczył wpisy „wiedza modelu”. Na stronie
wyglądało to jak potwierdzone źródła, a nikt ich nie czytał (sandbox nie zna treści linków bez
`fetch_page`). Właściciel: „źródło ma sens tylko wtedy, gdy jest sprawdzone”. Zasada: adres trafia
do `zrodla` dopiero po otwarciu strony i potwierdzeniu treści; niesprawdzona wiedza nie ma linków
(ADR 0009). Niesprawdzone adresy są kolejką w opisie PR, nie w bazie.

## L12 — Wersja generyczna mecha to wymysł, nie skrót (2026-10-22)

Dla trzech wersji Zaku II z dostawy powstała strona „Zaku II” jako wygodny cel odsyłaczy:
bez rekordu w dostawach, bez parametrów, bez ilustracji. Przez kilka dni zbierała linki
z epizodów, scen, postaci i haseł, więc wyglądała na pełnoprawną jednostkę. Właściciel:
„nie ma czegoś takiego jak Zaku II w dostawach — są trzy warianty”. **Strona mecha musi mieć
rekord w dostawie**; nie tworzymy strony nadrzędnej dla rodziny maszyn, a odsyłacze prowadzą
do konkretnych wersji. Gdy strona jednak zniknie, usuwamy też jej wpisy z pól `mechy`,
odsyłacze w prozie i asercje testów — inaczej build zatrzyma się na nieistniejącej encji
(ADR 0029, test `test/mechy-z-dostawy.test.js`).

## L13 — Lista odcinków ma dwie numeracje; bierzemy oryginalną (2026-11-07)

Wikipedia podaje odcinki *Mobile Suit Gundam* w dwóch kolumnach: `No. overall` (emisja
japońska) i `No. Eng` (emisja angielska, która **pomija odc. 15 „Cucuruz Doan's Island”**).
Od odcinka 16 obie numeracje różnią się o jeden, więc przepisanie liczby z niewłaściwej
kolumny daje odcinek obok. Tak powstał błąd w scenie 2-6: „A Decoy in Space” i „Breakthrough”
dostały numery 30 i 31, choć przytoczone obok japońskie daty emisji (3 i 10 listopada 1979)
należą do odcinków **31 i 32**. Reszta bazy używa numeracji oryginalnej (odc. 20, 24, 25, 29).

Zasada: w kolumnie „Odcinek w źródle” i w blokach „Nawiązania do oryginalnych odcinków”
podajemy numer z **oryginalnej emisji**. Przy odczycie tabeli sprawdź, którą kolumnę czytasz,
i zweryfikuj numer datą emisji albo opisem odcinka — tytuł sam w sobie nie rozstrzyga,
bo wersja angielska zachowuje tytuły, a przesuwa numery. To samo dotyczy innych serii
z pominiętym odcinkiem w zagranicznej emisji.

## L14 — Nie każda strona ma dostać blok źródłowy; część zakazów siedzi w testach (2026-11-07)

Przy uzupełnianiu brakujących bloków `{{zrodlo}}` łatwo uznać, że każda strona bez tła jest
luką do załatania. Tak nie jest. `test/tla-pierwowzorow.test.js` trzyma listę encji, które
**nie mogą** mieć bloku tła ani adresów w `zrodla`: zbiorcze profile (`zolnierz-*`,
`oficer-*`), sprzęt pola walki (`h-bomb-missile`, `turret`) oraz jednostki i systemy
oryginalne dla gry (`exart`, `cybird`, `control-ai`, `shinohara-hos`, `mechabestia`,
`mucus`, `invader`). Dopisanie tam akapitu — nawet z porządnym źródłem o wydarzeniu,
w którym sprzęt bierze udział — wywraca test, bo decyzja brzmi: osobnego pierwowzoru
do zacytowania nie ma, a sam opis wydarzenia należy do hasła o wydarzeniu.

Drugi rodzaj zakazu dotyczy pojedynczych słów. `test/epizod-2-misja-3.test.js` nie dopuszcza
nazwy „Black Wing” ani losów Alana na stronach obsady treningu, bo gra prowadzi tę obsadę
inaczej niż serial. Zanim dopiszesz tło postaci z dodatkowej serii, przeszukaj `test/`
po slugu strony — zakaz bywa zapisany w teście konkretnej misji, nie w ADR.

## L15 — Lista wpisana w test to stan z dnia napisania, nie reguła (2026-11-10)

`test/srw-y.test.js` porównywał `postacie` epizodu SRW Y z listą wpisaną na sztywno, a Kojiego,
Amuro i Brighta — mówców prologu — rozliczał osobną gałęzią „kameo z innych gier”, której
wystarczał odsyłacz w analizie sceny. Gałąź pochodziła z wcześniejszego modelu (obsada = rekordy
uczestników misji) i przetrwała adnotację do ADR 0013, według której mówca w skrypcie jest
postacią. Trzy osoby prowadzące dialog nie były więc w obsadzie epizodu, a agent zgłosił to jako
„propozycję wymagającą zmiany testu”, zamiast naprawić. Właściciel: „jeśli zabrania, to znaczy,
że test jest błędny i trzeba go zmienić”.

Zasada: gdy test stoi w sprzeczności z ADR albo z dostawą, usterką jest test. Poprawiamy go
razem z treścią, w tym samym commicie — to naprawa bazy, nie zmiana wymagająca osobnej zgody.
Zanim rozbieżność trafi do „propozycji”, sprawdź, skąd wzięła się asercja (`git log -S`):
lista przepisana z ówczesnego stanu bazy niczego nie rozstrzyga. Tam, gdzie się da, test
powinien wyprowadzać oczekiwanie z dostawy (tu: mówcy ze skryptu), a nie z listy w kodzie.

## L16 — Wyliczenie pisane ręcznie obok listy z pól starzeje się po cichu (2026-11-10)

Strona serii *Matchless Raijin-Oh* wymieniała w zdaniu „W Super Robot Wars OE serię
reprezentują…” dziesięcioro uczniów. Sesja, która dodała czworo kolejnych (Hidenori Kondo,
Hiroshi Takamori, Miki Mano, Yu Izumi), ustawiła im pole `seria`, więc lista „Z tej serii”
urosła sama — ale zdania nikt nie dopisał. „Powiązania” zbierały wikilinki z tego zdania,
więc strona pokazywała dwie różne listy tych samych postaci (15 i 11). Tak samo strona
*Mobile Police Patlabor* nie wymieniała żołnierza JSDF ani Brockena/Cannon. Żaden test tego nie
widział: pole było poprawne, zdanie było prawdziwe, tylko niepełne.

Zasada: lista budowana z pól jest jedynym kompletnym wykazem (ADR 0036) i silnik nie pokazuje
jej drugi raz w kolumnie bocznej. Zdanie w treści serii mówi, kto i co ją reprezentuje, ale to
ręczna robota — dodając stronę z polem `seria`, otwórz stronę tej serii i dopisz nową pozycję,
jeśli opis gry wymienia obsadę albo maszyny. Szybka kontrola: na stronie serii każda pozycja
„Z tej serii” powinna dać się znaleźć w opisie albo opis nie powinien udawać pełnej listy.

## L17 — Mówca i uczestnik to ta sama osoba: skrypt zna przezwisko, lista zna nazwisko i serię (2026-11-10)

W misji 2-8 SRW OE mówią „Potato”, „Bon”, „Chobi”, „Kuko”, „Two” i „Mabo”. Sesja założyła
im strony pod przezwiskami, bez serii, z opisem „uczeń z towarzystwa Akademii Hinobori” —
a dodatek tej samej dostawy wymienia z nazwiska i z serią dokładnie tylu uczniów, ilu
mówców zostało bez pary. Eldran dostał stronę bez serii, bo `test/tagi.test.js` wymagał od
każdej strony *Raijin-Oh* tagu `eldran`, a strona `eldran` nie może tagować samej siebie:
test dało się uciszyć tylko przez pominięcie serii. Żołnierz JSDF miał odwrotnie — serię,
której dostawa mu nie daje. Żaden test tego nie widział, bo żaden nie czytał listy uczestników.

Zasada: zanim powstanie strona mówcy, znajdź go na liście uczestników tej samej dostawy —
tam jest nazwa strony i jej seria (ADR 0037). Przezwisko trafia do pola `pseudonim`. Gdy test
nie pozwala wpisać tego, co mówi dostawa, usterką jest test (L15), nie dostawa. Kontrola:
`node tools/uczestnicy-dostaw.mjs` — ma wypisać same zgodne przypisania.

## L18 — Załoga to cały wiersz jednostki, a test pisany ze stanu bazy utrwala brak (2026-11-10)

Dostawa misji 2-8 SRW OE podaje „Daiteioh — pilot główny: Taro Omomo — piloci wspierający
w misji: Mai Ozora, Kakeru Daichi”. Do pola `piloci` trafił sam pilot główny, a test misji
zapisał to jako oczekiwany stan (`deepEqual(piloci, ['taro-omomo'])`) — od tej chwili pilnował
błędu. Podobnie testy starszych misji wymagały dokładnej listy maszyn Żołnierza Zeonu, więc
każda nowa dostawa z kolejną jego maszyną musiała albo złamać test, albo pominąć wpis;
pominięto sześć.

Zasada: oczekiwaną załogę test bierze z dostawy, nie z bazy (ADR 0037 pkt 7). Test jednej
misji sprawdza „zawiera”, nie „jest dokładnie”, gdy lista rośnie z kolejnymi dostawami;
komplet pilnuje jeden test czytający wszystkie dostawy naraz.

## L19 — Jedno źródło milczy? Otwórz następne, zanim zapytasz właściciela (2026-11-10)

Angielska Wikipedia nie podaje płci bliźniąt Sato z *Go-Saurera*. Strona Harumi dostała
więc opis bez rodzaju gramatycznego, a pytanie o płeć — najpierw jej, potem siostry —
trafiło dwa razy do właściciela. Tymczasem SRW Wiki ma w metryce każdej postaci pole
„性別” i pisze wprost „双子姉妹”; jedno wyszukiwanie zamykało sprawę.

Zasada: brak informacji w pierwszym źródle to powód, by otworzyć drugie (dla postaci
z gier SRW — japońską SRW Wiki), nie by pisać naokoło ani pytać. Do właściciela trafia
dopiero to, czego nie rozstrzyga żadne dostępne źródło — z podaniem, gdzie szukano.

## L20 — Stan bieżący przypinaj w jednym teście, nie w teście każdej dostawy (2026-11-10)

Dostawa 34 ilustracji zmieniła trzy liczby w manifeście (pliki, encje, data). Te same
liczby stały w sześciu miejscach czterech plików testowych: testy misji 2-5, 2-6 i 2-7
sprawdzały nie tylko własne klucze, ale i to, że manifest ma dokładnie 206 plików
i datę 2026-11-09 — czyli stan z dnia, w którym je pisano. Każda następna dostawa
musiałaby je wszystkie poprawiać, a poprawianie cudzego testu „żeby przeszedł” to
dokładnie ten odruch, przed którym test ma chronić.

Zasada: test dostawy pilnuje tego, co do niej należy i co się już nie zmieni (jej klucze,
jej numer odczytu, „manifest nie jest starszy ode mnie”). Sumy i datę bieżącą trzyma
jeden test stanu, wyprowadzający liczby z danych wszędzie, gdzie się da (L15).

## L21 — Nazwa członu w opisie pilota nie czyni zeń jednostki (2026-11-11)

Profil Yomogiego w dostawie SRW Y mówi, że „po rozłączeniu Dynazenona steruje smoczym
humanoidem Dyna Soldier”, a profil Gaumy wymienia Dyna Diver tworzący nogi robota. To opisy
członów jednej maszyny, nie rekordy jednostek. Próba założenia strony `dyna-soldier` przeszła
build, ale wywróciła trzy testy: brak karty w `w_gre`, brak zakresu w danych menu i — przede
wszystkim — brak jakiegokolwiek udziału w grze (nie mówi, nie ma ilustracji, nie stoi w obsadzie
misji). Słusznie: dostawa nie daje tej maszynie ani parametrów, ani wystąpienia.

Zasada: wzmianka o członie lub podzespole w cudzym profilu to nie rekord jednostki
(ADR 0029 pkt 1). Maszyna dostaje stronę, gdy ma własny wpis w menu, kartę w dostawie
albo występuje w scenie — a jeśli żaden z tych warunków nie zachodzi, zostaje opisem
w treści postaci, do której należy.

## L22 — Źródło zewnętrzne nie może przeczyć dostawie po cichu (2026-11-13)

Audyt PR #35 trafił na zdanie o Gazie C: „Oznaczenie MMT-1 pochodziło od wewnętrznej nomenklatury
Axis, a AMX-003 nadała maszynie Federacja”. Stało ono trzy akapity pod zdaniem z dostawy, według
którego maszyna „ma oznaczenia obu armii: Axis (AMX-003) i Federacji (MMT-1)” — czyli dokładnie
odwrotnie. Oba porządki mają źródła: Gundam Wiki wywodzi AMX z „Axis mobile weapon”, a MMT-1
z pierwotnego oznaczenia seryjnej transformowalnej maszyny, starsze opracowania (i część forów)
oddają AMX-003 Federacji. Sesja wybrała wersję zewnętrzną, nie zauważając, że przeczy ona
materiałowi, na którym stoi reszta strony.

Zasada: gdy źródło zewnętrzne mówi co innego niż dostawa, rozbieżność opisuje się wprost
(„źródła podają niejednolicie…”), a nie rozstrzyga po cichu na korzyść tego, co wygodniejsze.
Dostawa jest rozstrzygnięciem dla danych gry; źródło zewnętrzne tłumaczy tylko tło. Test tego nie
widzi — czyta pola, nie akapity — więc sprzeczność wyłapuje dopiero audyt następnej sesji.

## L23 — Cytat w prozie i nawiązanie do odcinka wymagają sprawdzenia w materiale (2026-11-15)

Audyt PR #36 znalazł dwa błędy tej samej rodziny, oba pod poziomem `skrypt`.

**Cytat bez pokrycia.** Strona `cyber-newtype` podawała w cudzysłowie zdanie „na siłę dało się
stworzyć takiego człowieka" oraz twierdziła, że Kei „chce szukać dowodów w gruzach", a Himari
„odmawia zgody na eksperymenty". Żadne z tych zdań nie występuje w `dostawa_3_2.txt`; Kei mówi,
że Connect dał się oszukać, a Himari chce szukać ocalałych. Hasło `sily-kolonii` miało podobny
cytat („Jeśli chcieli się zbroić…"), którego w skrypcie nie ma. Fragment z poziomem `skrypt`
brzmi wtedy jak dostawa, choć jest parafrazą albo dopiskiem modelu — najgorszy możliwy wariant,
bo czytelnik nie ma powodu go kwestionować.

**Nawiązanie do odcinka bez pokrycia w źródle.** Blok „Nawiązania do oryginalnych odcinków" sceny
3-2 wiązał rozmowę Gihrena z Kycilią z **czternastym** odcinkiem *Mobile Suit Gundam*, twierdząc,
że „Zeon rozwija w nim badania nad Newtype'ami". Odc. 14 „Time, Be Still" opowiada o bombach
zegarowych podłożonych w Gundamie; nic z tego nie dotyczy rozmowy rodzeństwa Zabi. Adres
w `zrodla` był poprawny i otwierał się — ale nie potwierdzał twierdzenia, co jest naruszeniem
ADR 0009 i L11 w drugim wariancie: nie „nieotwarty adres", tylko „adres, który mówi coś innego".

Zasady:

- **Zanim wstawisz cytat, znajdź go w pliku dostawy albo skrypcie** (`grep` po kilku słowach).
  Jeżeli w materiale go nie ma, nie ma też cudzysłowu — zdanie opisuje świat, a nie udaje dialogu.
- **Nawiązanie do odcinka to twierdzenie o treści tego odcinka.** Sam numer i tytuł nie wystarczą:
  przeczytaj streszczenie w otwartym źródle i sprawdź, czy opowiada o tym, do czego je przypinasz.
  Jeśli nie — nawiązania nie ma (scena bez odcinka nie dostaje bloku, `PRZEPLYW_EPIZODU.md` §1a).
- Po usunięciu jedynego użycia adresu **usuń go z `zrodla`** — test integralności pilnuje, by
  każde zadeklarowane źródło było linkiem przy informacji w treści, i słusznie czerwienieje.
- Test tego nie widzi: blok `{{zrodlo}}` przechodzi walidację poziomów i adresów. Rozbieżność
  wyłapuje dopiero kwerenda audytu — dlatego cytaty i numery odcinków są pierwszym celem 3a.

## L24 — Proza o grze nie może opowiadać pierwowzoru (2026-11-16)

Właściciel wskazał kartę Zordo XX: „Pancerz jest tak wytrzymały, że nie imają się go ani
Getter Tomahawk, ani Getter Beam. W misji <<…>> zwraca się przeciw Getterowi D2 i Getter
Arcowi; pokonuje go dopiero wspólny atak obu maszyn.” Pierwsze zdanie jest prawdziwe i pochodzi
z encyklopedii gry. Drugie opisuje **mangę**: tam Getter D2 i Getter Arc rzeczywiście kończą
potwora dwoma jednoczesnymi Getter Beamami. W grze Takuma przesiada się do Arca, bo D2 jest
„na granicy wytrzymałości”, a o wspólnym ataku nie ma ani słowa — a samej nazwy „Zordo XX”
skrypt nie wymienia nigdy (Takuma mówi „ten wielki”).

Ten sam błąd w tej samej dostawie w innych miejscach: Insectorzy „nie przypominają
Imperium Yoma ani Imperium Dinozaurów” (skrypt mówi o Hyakki i Dinozaurach — Yoma to inna
seria), a laboratorium „kryje coś, czego nie wolno odkryć wrogowi” (skrypt: nie wolno pozwolić,
by odkryli, co jest **pod** laboratorium). Odwrotny błąd zdarzył się przy karcie Show Kamuia:
dosłowne zdanie z encyklopedii gry „Pilot Getter Kirika.” (`dostawa_1_2a.txt`) omyłkowo uznano
za dopisek spoza gry i nadpisano parafrazą, zamiast zachować tekst encyklopedii.

W drugą stronę poszła też korekta kart Insectora i Zordo XX: w `dostawa_1_2a.txt` obie maszyny
należą do sekcji „Pozostałe grupy” jako `grupa czerwona 1` (przeciwnicy sterowani przez SI),
a ich karty pilota z SP i Duchem „Skup.” są technicznymi rekordami silnika SRW Y do obliczeń
walki — tymczasem na stronach i w teście opisano je błędnie jako „jednostki grywalne”.

Zasady:

- **Zdanie o zachowaniu maszyny w misji musi mieć zaczepienie w skrypcie, a opis z menu —
  w encyklopedii dostawy.** Jeśli skrypt mówi tylko „przesiadajcie się tutaj”, to jest cała
  prawda o finale walki; reszta z pierwowzoru idzie do `{{zrodlo}}`. I odwrotnie: nie kasuj
  dosłownego zdania z sekcji `Encyklopedia` dostawy w przekonaniu, że pochodzi z anime.
- **Karta pilota w dostawie nie czyni jednostki grywalną.** O przynależności rozstrzyga lista
  uczestników misji (`Jednostki gracza` kontra `grupa czerwona` w `Pozostałe grupy`). Wrogie
  maszyny i potwory w SRW Y mają techniczne rekordy pilota o nazwie jednostki — `piloci` zostaje
  wtedy `[]`, bez nazywania ich ani „jednostkami grywalnymi”, ani „bronią bez załogi”, jeśli
  materiał tego nie przesądza.
- **Nazw z encyklopedii nie wkładaj w usta postaci, jeśli nie padają w dialogach.** Nazwa
  jednostki z sekcji `UCZESTNICY` („Zordo XX”) jest kanoniczną nazwą z gry, ale jeśli dialog
  mówi wyłącznie „ten wielki”, zaznacz to wiernie i nie ujawniaj przy tym nazw frakcji z anime,
  których rozegrane misje jeszcze nie wprowadziły (ADR 0012).
- **Komunikat asercji i sam test muszą być prawdziwe (L15).** Test wymuszający fałszywe zdanie
  w treści utrwala błąd merytoryczny zamiast przed nim chronić.
- Test `proza o wydarzeniach gry trzyma się tego, co mówi skrypt` w `test/epizod-y-misja-2a.test.js`
  pilnuje finału walki, braku fałszywej grywalności wrogów i braku spoilerów frakcji.
- **Zasada, która opisuje samą siebie, jest naruszeniem (ADR 0018 pkt 3).** Wpis dziennika
  o tym, że „analiza opisuje teraz wydarzenia sceny własnymi słowami” albo że „język warsztatu
  zniknął z analiz”, mówi o redagowaniu, nie o świecie — nawet jeśli chwali wykonanie zasady.
  O pracy nad bazą pisze `docs/HISTORIA_WEWNETRZNA.md`; dziennik dostaje treść merytoryczną
  (kto, czym, gdzie, z jakim skutkiem). Strażnicy: `test/dziennik-zmian.test.js` (słowa
  „analiza”, „komentarz”, „streszczenie”, „scenariusz”, „własnymi słowami”, podmiot „gra …”)
  oraz nowy test w `test/sceny.test.js` dla prozy scen i epizodów.
- **Podmiotem zdania w prozie jest świat, nie gra.** „Gra przenosi”, „W grze pluton czeka”,
  „scenariusz gry pomija” opisują rekord, nie wydarzenie. Naturalne zastępstwa: „tutaj”,
  „tym razem”, „ta wersja”, „starcie toczy się”, „obaj są sojusznikami”. Wyjątki zostają:
  „gra polityczna”, „gra w piłkę”, „świat gry” jako nazwa uniwersum w zdaniu o świecie —
  dlatego testy celują w czasowniki i przyimki („w grze”, „do gry”, „tej gry”), a nie w samo
  słowo „gra”. Weryfikacja idzie po prozie, nie po tabelach hurtowo: w kolumnie „Różnice”
  część zdań to legalne porównania z pierwowzorem, więc każdy wiersz kwalifikuje się ręcznie.

## L26. Sprawdzaj imienników i chronologię scen

Nazwa skrócona z katalogu pilota nie rozstrzyga automatycznie tożsamości
mówcy o tym samym imieniu. Przed przypisaniem sprawdź miejsce, chronologię,
obsadę oraz różnicę między opcjonalnymi dialogami a przebiegiem wyprawy.
Nie przedstawiaj hipotezy jako potwierdzonego faktu; test nie może jej utrwalać.

Podział drużyn z misji 2-8 powinien być dostępny na stronach drużyn i maszyn,
nie tylko w długim zapisie sceny. Zgodnie z późniejszą decyzją właściciela
usunięto jedną nienależącą do misji 3-4 kwestię również z dostawy i archiwum;
był to konkretny wyjątek, a nie ogólne pozwolenie na edycję źródeł.

## L27. Sprawdzaj podgląd i powłokę jak użytkownik

Sama obecność znaczników galerii nie dowodzi, że kliknięcie działa: podgląd
rzucił błąd niezdefiniowanej zmiennej dopiero po otwarciu dialogu. Testuj
również zdarzenia, fokus i zamknięcie oraz jawnie ukrywaj nieotwarty dialog
w przeglądarkach bez natywnej obsługi. Sprawdzaj położenie obrazów we
wszystkich zbudowanych ciałach, nie tylko na jednej przykładowej stronie.

Nawigacja asynchroniczna musi pokazać stan ładowania i czytelny błąd, również
przy uszkodzonym JSON-ie lub błędzie renderowania; opóźniona odpowiedź nie
może nadpisać późniejszej trasy. Wersjonowanie adresów danych skrótem treści
ogranicza mieszanie nowej powłoki z przestarzałymi plikami z cache po wdrożeniu.
Nie uznawaj tych zabezpieczeń za dowód przyczyny błędu, którego nie udało się
odtworzyć w konkretnym środowisku czytelnika.

## L28 — „Pilot” o nazwie jednostki to rekord silnika, nie osoba (2026-11-19)

Wiersz listy jednostek misji 1-3A SRW Y brzmi `**Shalbandes** — pilot główny: Hard Fall
Kaiju Shalbandes — grupa czerwona 1`. Poprzednia sesja rozpoznała wzorzec „brak osobowego
pilota” dla rekordów **równych** nazwie jednostki (Insector, Zordo XX), ale nie dla rekordu
o nazwie jednostki z doklejonym podtytułem typu. „Hard Fall Kaiju” to podtytuł kaiju
(急転直下怪獣), więc ten sam techniczny rekord przeszedł jako osoba: powstała strona postaci
z `rola: pilot`, a `piloci` kaiju nie było puste — wbrew regule z L24 i wbrew testowi, który
dla Insectora wymagał czegoś odwrotnego.

Zasady:

- **Porównuj nazwę pilota z nazwą jednostki po słowach, nie po równości znaków.** Rekord
  techniczny to taki, w którym cała nazwa jednostki występuje jako ciąg słów w nazwie pilota
  (`rekordBezOsoby` w `tools/uczestnicy-dostaw.mjs`). Wtedy `piloci: []`, a dane pilota idą
  na stronę jednostki.
- **Wzorzec sprawdzaj na wszystkich dostawach, nie na jednej.** Kontrola po całym `dostawy/`
  pokazała dokładnie jeden taki wiersz załogi (`dostawa_1_3a.txt:625`) — pozostałe trafienia
  to nagłówki dialogów OE, które nie są wierszami listy jednostek. Bez tego sprawdzenia
  poprawka mogła objąć nagłówki redakcyjne.
- **Narzędzie i treść poprawiaj jednym krokiem, z testem regresyjnym.** Sama zmiana danych
  (usunięcie strony) uruchamia `brakStrony` w `przypisaniaDostaw`, bo dostawa ma też sekcję
  pilota o tej nazwie; rekord bez osoby musi być rozliczany przez stronę jednostki w obu
  raportach.
- **Opis z podtytułem wymaga źródła przy informacji.** Nazwa „Hard Fall Kaiju” i jej znaczenie
  weszły do bloku `{{zrodlo}}` na stronie kaiju — bez linku przy zdaniu test integralności
  odrzuca zadeklarowany adres (L23).

## L29 — Skrót imienia w skrypcie to ta sama osoba, a rola zbiorowa nie jest postacią (2026-11-19)

W skrypcie misji 1-3A SRW Y ta sama postać mówi raz jako `**Show Kamui:**`, a raz jako
`**Kamui:**` — 17 i 18 kwestii. Skrót pojawia się w scenach zbiorowych, gdy w dialogu bierze
udział kilka osób naraz. To nie pseudonim, nie druga postać i nie „nierozstrzygnięta
tożsamość”: kwestie podpisane krótko należą do tej samej osoby co pełna etykieta i tak samo
wchodzą do jej strony, obsady sceny i epizodu. Podobnie `**Obywatel:**` (i `**Żołnierz
oddziału D2:**`, `**Prezenter:**`) to bezosobowy, zbiorowy głos miasta albo armii — nie
potrzebuje strony, choć mówi w scenie nieraz kilkanaście razy.

Zasady:

- **Tożsamość mówcy ustalaj z treści dialogu, nie z etykiety.** Skrót jest tą samą osobą,
  jeśli rozmowa i otoczenie na to wskazują; nie zakładaj nowej postaci tylko dlatego, że
  etykieta jest krótsza.
- **Skrót trafia do prozy jak zwykła wypowiedź.** Jeśli dana kwestia jest ważna (np. Kamui
  wypytuje Anninę o cel A. Adventu), opisujemy ją na stronie postaci bez komentarza
  o „innej etykiecie" — czytelnik ma widzieć wydarzenie, nie redakcyjną uwagę.
- **Cytat w scenie zostaje dosłowny.** Sekcja `:::skrypt` powtarza etykietę z dostawy
  (`**Kamui:**`), bo scena jest wiernym zapisem materiału; ujednolicenie dotyczy prozy
  i powiązań, nie cytatu.
- **Rola zbiorowa nie dostaje strony, ale zostaje w obsadzie skryptu.** `Obywatel` nie jest
  wpisem w `postacie` sceny — inaczej powstałaby pseudoosoba bez imienia (ADR 0013).

## L30 — Etapy o tym samym tytule w jednej misji mylą wycinanie skryptu (2026-11-19)

W dostawie 3-5 dwie sceny noszą nagłówek `### White Base / Mostek`. Wycinanie etapów
po samym tytule (`find(x => x.startsWith('### White Base / Mostek'))`) podstawiło pod drugi
etap pierwszy — a test wierności tego nie wykrył, bo porównuje tylko **pierwszy** blok
`:::skrypt` (intro), nie całość. Skrypt sceny rozjechał się z archiwum dopiero przy ręcznym
porównaniu `normalizujTekst` całości.

Zasady:

- **Etapy bierz w kolejności wystąpienia, nie po tytule.** Przy podziale archiwum na bloki
  iteruj linie i tnij na każdym `### `, zachowując kolejność; nie mapuj tytułów na listę.
- **Po każdej scenie porównaj całość, nie tylko pierwszy blok.** Dodatkowa asercja
  `normalizujTekst(bloki.join('\n')) === normalizujTekst(skrypt)` chroni przed cichym
  zgubieniem albo zdublowaniem etapu (test `epizod-3-misja-5`).
- **Powtórzony tytuł musi mieć osobne mapowanie w `sekcje_analizy`.** Liczba par musi
  równać się liczbie unikalnych wystąpień, inaczej build zgłasza brak mapowania.

## L31 — Blok `{{zrodlo}}` w scenie to osobny boks, nie podsekcja analizy (2026-11-19)

W scenach z nawiązaniami `{{zrodlo}}` otwiera się **po zamknięciu** bloku `{{skrypt}}`
z analizą i ma własny nagłówek `## Nawiązania do oryginalnych odcinków`; tabela Wątków
wraca do nowego bloku `{{skrypt}}`. Wstawienie `{{zrodlo}}` w środku analizy kończy się
komunikatami „zagnieżdżony blok” i „niezamknięty blok”.

Zasady:

- **Nie umieszczaj nagłówków `###` w boksie `{{zrodlo}}`** — walidator `sekcje_analizy`
  traktuje każdy `###` w sekcji „Analiza” jako podsekcję i żąda dla niej pary. Dziel
  nawiązania akapitami z pogrubionym wstępem (`**Layzner — …**`).
- **Każdy URL z frontmattera `zrodla` musi stać w treści** — inaczej `integralnosc.test.js`
  zgłasza źródło bez pokrycia. Dotyczy to także stron serii.
- **Data `sprawdzono` przy cytowanym źródle idzie zgodnie z dniem sprawdzenia**, a nie
  z dniem edycji pliku.

## L32 — Nawiasy w nazwach plików Markdown wymagają zbalansowanego wzorca (2026-11-19)

Pliki ilustracji wariantów i form transformacji, np. `RVF-25 (B).png` czy `VF-25F (F).png`,
zawierają nawiasy. Standardowy wzorzec Markdown `/!\[([^\]]*)\]\(([^)\s]+)\)/g` urywa URL
na pierwszym zamykającym nawiasie `)`, zostawiając `.png)` jako resztkę w tekście.
Podobnie wzorce w testach sprawdzające obecność linków w treści muszą używać
`((?:\([^)]*\)|[^)\s])+)` zamiast `([^)\s]+)`.

Zasady:

- **Wzorce linków i obrazów Markdown muszą obsługiwać nawiasy w URL.** Dopasowanie
  musi dopuszczać zbalansowaną parę `\([^)]*\)` wewnątrz URL, bo nazwy plików w buckecie R2
  mogą legalnie zawierać nawiasy (ADR 0015).
- **Asercje testów sprawdzające brak błędów JavaScriptu nie mogą używać surowego `null`.**
  Regex `/undefined|null/` w quick-menu dopasował `null` wewnątrz sluga postaci
  `albatro-null-eiji-asuka` w atrybucie `href`. Sprawdzaj tekst pozycji `>\s*(undefined|null)\s*<`
  oraz atrybut `data-cel="(undefined|null)"`.

## L33 — Blok źródła bez nagłówka wypada z testów nawigacji scen (2026-11-20)

Scena 3-5 dostała blok `{{zrodlo}}` z dwoma akapitami nawiązań, ale bez nagłówka
`## Nawiązania do oryginalnych odcinków` i bez zdania „Wydarzenia z tej sceny…”.
`test/nawiazania-scen.test.js` zbierał wyłącznie sceny zawierające ten nagłówek, więc nowy
blok w ogóle nie trafił pod kontrolę: testy były zielone, build poprawny, a sekcja nie
pojawiła się w spisie sceny. Dopiero audyt porównujący scenę z wzorcem pozostałych scen
pokazał brak.

Zasady:

- **Każdy blok `{{zrodlo}}` w scenie zaczyna się sekcją `## Nawiązania do oryginalnych
  odcinków` i zdaniem wiążącym wydarzenia z odcinkiem.** To nie ozdoba: bez nagłówka
  renderer nie zbuduje osobnej sekcji, a testy nawigacji nie widzą treści.
- **Test zbierający po nagłówku musi dodatkowo sprawdzać, że blok źródła ma nagłówek.**
  Inaczej nowy plik omija kontrolę, zamiast ją oblewać (L15).
- **Porównuj nową scenę ze sceną wzorcową, nie tylko z listą testów.** Zielony `npm test`
  nie dowodzi, że wszystkie sekcje sceny są na miejscu.
