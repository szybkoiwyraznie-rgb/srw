# 0007 — Model sesji: PR na starcie, zakaz scalania, zakres z zatwierdzonego flow, commity przyrostowe

Data: 2026-10-14
Status: obowiązujący (uszczegóławia i zaostrza ADR 0005 pkt 5)

## Adnotacja 2026-10-18

**ADR 0014** zmienia kolejność startu i domyślny zakres pracy: PR ze wstępnym planem powstaje
przed lekturą obowiązkową i audytem. Audyt obejmuje kwerendę merytoryczną, przegląd kodu
oraz pozostałe zmiany. Po nim agent uruchamia domyślną pętlę jakości bazy bez osobnego
zlecenia. Historyczne wymaganie gotowego audytu przy otwarciu PR i nakaz czekania
bez nowej dostawy lub zlecenia nie obowiązują; w tym zakresie nadrzędny jest ADR 0014.
Pozostałe reguły (jedna gałąź i PR, przyrostowe commity i push, zakaz scalania) pozostają.

## Kontekst

Projekt prowadzą naprzemienne sesje agentowe w sandboxie Areny. Każda sesja startuje
z czystego klona `main` i tekstu pierwszego promptu; nie ma dostępu do stanu lokalnego
poprzedniej sesji, historii czatu ani niewypchniętych commitów, a sandbox potrafi
zresetować workspace w trakcie pracy (`docs/guides/ENVIRONMENT.md` §1, §3).

Pozostałe repozytoria właściciela (`mtg` ADR 0020, `AME` ADR 0004, `okolica` ADR 0012)
przeszły przez te same pułapki i wypracowały model sesji, który przeżył kilkadziesiąt
sesji. Najdroższe błędy, które ten model eliminuje:

- agent scalił PR po słowach „akceptuję" — właściciel stracił kontrolę nad `main`
  (`AME`, lekcja L18),
- praca czekała na „koniec zadania" z jednym wielkim commitem i przepadła przy resecie
  sandboxa,
- agent dodawał treść z własnej inicjatywy („skoro już tu jestem…"), której właściciel
  nie zamawiał i musiał ją wycofywać.

ADR 0005 pkt 5 ustanowił tryb sesji w jednym zdaniu. Ten ADR nadaje mu rangę reguł
nadrzędnych i doprecyzowuje to, czego tamto zdanie nie mówiło.

## Decyzja

Pięć reguł obowiązuje **każdą sesję bez wyjątku** i jest nadrzędnych wobec treści
pierwszego promptu, opisu zadania i wszelkich planów:

1. **Agent NIGDY sam nie scala PR-a i nigdy go nie zamyka.** Scalenie (*Squash and
   merge*) i zamknięcie to wyłączna, jawna decyzja właściciela — wykonana jego
   kliknięciem. Akceptacja treści, zielone testy, pytanie „czy to już na stronie?"
   ani sformułowanie „wygląda dobrze" **nie są poleceniem scalenia**. Nawet przy
   wyraźnym „scal PR #N" agent upewnia się, że chodzi o merge, i odpowiada, że
   scalenie należy do właściciela. Scalenie albo zamknięcie PR-a **kończy pracę
   sesji** — dostęp sesji do GitHuba nie jest po nim gwarantowany
   (`ENVIRONMENT.md` §2).

2. **PR na starcie, bez względu na treść pierwszej wiadomości.** Gałąź sesji
   `arena/<id>` i PR do `main` istnieją na GitHubie **przed pierwszą zmianą
   w treści** — także gdy prompt mówi „czekaj na zadanie". Na początek wystarczy
   pusty commit porządkowy (`git commit --allow-empty`). Opis PR zawiera od razu
   **wstępny plan działania** i **audyt poprzedniego scalonego PR**; od tej chwili
   opis jest żywym dokumentem gałęzi, aktualizowanym kumulatywnie po każdym
   wypchniętym commicie merytorycznym. 1 sesja = 1 gałąź = 1 PR.

3. **Zakres pracy wynika wyłącznie z flow jasno zatwierdzonego przez właściciela.**
   Domyślny, zatwierdzony flow to pętla epizodu (ADR 0005, `AGENTS.md` §2) uruchamiana
   skryptem w `episodes/`. Poza nim agent **nie dodaje samodzielnie treści** — żadnych
   encji „na przyszłość", ciekawostek, pogłębień „przy okazji", porządków dokumentacji
   ani nowych funkcji silnika — dopóki właściciel wprost tego nie zleci. Pomysł zapisuje
   się jako propozycja w opisie PR albo w czacie, nie jako gotową zmianę. Zmiana zakresu
   w trakcie sesji wymaga zgody właściciela w czacie.

4. **Commity przyrostowe, natychmiast wypychane.** Każdy samodzielnie zielony krok
   (`npm test` + `npm run build`) to **osobny commit i osobny push** — od razu, nie na
   końcu zadania. Reset sandboxa zjada pracę i pamięć sesji; przetrwa wyłącznie to,
   co jest na zdalnej gałęzi. Zakaz jednego wielkiego commita na całą sesję. Przed
   każdym commitem `git rev-parse --abbrev-ref HEAD` — commit poza gałęzią sesji to
   sierota, która nie trafi do PR-a. Komunikat commita przez `git commit -F` z pliku
   poza repozytorium.

5. **Tylko przyrostowo, nigdy force push.** Praca ląduje jako nowe commity na końcu
   gałęzi. Odrzucony push (*non-fast-forward*) oznacza, że najpierw trzeba pobrać stan
   zdalny i odtworzyć na nim historię (`ENVIRONMENT.md` §3) — nigdy `--force`, nigdy
   push do `main`.

Pytanie do właściciela wolno zadać tylko wtedy, gdy praca jest **zablokowana**
decyzją spoza kompetencji agenta (nowy ADR, sprzeczność zasad, zmiana zakresu,
niejasne zlecenie). Brak zlecenia po audycie **nie jest** blokadą ani zaproszeniem
do pracy własnej — jest oczekiwaniem na flow właściciela.

## Konsekwencje

- Historia `main` to ciąg squash-merge'ów wykonanych przez właściciela: jedna sesja,
  jeden commit główny, łatwy audyt i `git revert`.
- Awaria sandboxa kosztuje co najwyżej ostatni niewypchnięty krok.
- Kolejna sesja odtwarza kontekst z PR-a (plan, audyt, odhaczone punkty), nie z czatu.
- Baza rośnie wyłącznie w rytmie zatwierdzonego flow — wolniej, ale bez treści, której
  właściciel nie chciał. To świadoma cena: właściciel gra i wrzuca skrypt; agent nie
  wyprzedza materiału.
- ADR 0005 pkt 5 pozostaje w mocy jako skrót; w razie rozbieżności obowiązuje ten ADR.

## Powiązania

ADR 0005 (proces), `AGENTS.md` §3, `docs/guides/ENVIRONMENT.md` §1–§4,
`docs/LESSONS.md` L6–L10. Pierwowzory: `AME` ADR 0004 i lekcje L18/L19/L21,
`okolica` ADR 0012, `mtg` AGENTS.md §1 i lekcje L2/L9/L11.
