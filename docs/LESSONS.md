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
