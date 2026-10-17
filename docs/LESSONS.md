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
