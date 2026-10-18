# 0014 — Start sesji: PR, lektura, audyt i domyślna pętla jakości

Data: 2026-10-18
Status: obowiązujący; zmienia ADR 0007 w zakresie kolejności startu i domyślnego zakresu pracy.

## Kontekst

Właściciel zlecił doprecyzowanie domyślnego działania agenta: najpierw PR ze wstępnym
planem, następnie lektura obowiązkowa, audyt poprzedniego PR w trzech częściach i aktywna
pętla jakości bazy. Dotychczas ADR 0007 wymagał gotowego audytu już przy otwarciu PR,
a po audycie bez nowej dostawy lub zlecenia nakazywał czekać. Te reguły zostają zastąpione.

## Decyzja

### 1. Kolejność startu

Po odczytaniu pliku startowego `AGENTS.md` agent wykonuje kolejno:

1. **Otwarcie PR ze wstępnym planem sesji.** Pusty commit porządkowy i push na gałąź
   przypisaną do sesji, potem PR. Jeśli PR tej sesji już istnieje, agent go kontynuuje.
   Początkowy plan obejmuje lekturę, audyt i pętlę jakości; audyt ma status „do wykonania”.
2. **Lekturę obowiązkową** według `AGENTS.md`: wszystkie ADR-y, lekcje, środowisko,
   schemat danych; przy nowej dostawie także przewodnik pętli epizodu i materiał wejściowy.
3. **Audyt poprzedniego scalonego PR**, oparty na opisie, liście plików i faktycznym diffie.
4. **Domyślną pętlę jakości**, bez oczekiwania na osobne zlecenie rozszerzania bazy.

Plan i audyt są uzupełniane w opisie PR sesji w miarę wykonania, nie deklarowane na wyrost.
Konkretne zlecenie właściciela wyznacza priorytet pracy.

### 2. Trzy części audytu

- **3a — merytoryczny audyt zmian w stronach bazy, oparty na kwerendzie.** Zmienione
  twierdzenia są porównywane ze skryptami i dostawami, a dane zewnętrzne weryfikowane
  przez kwerendę i odczyt źródeł. Agent sprawdza konkretne fakty, źródła przy danych,
  poziomy wiarygodności, powiązania oraz zgodność z granicą rozegranej fabuły.
  Pamięć modelu nie zastępuje kwerendy w tej części audytu.
- **3b — audyt zmian w kodzie.** Przegląd zmienionego kodu i odpowiednich testów pod kątem
  zgodności z ADR-ami, regresji, walidacji, bezpieczeństwa i renderowania; uruchomienie
  `npm test` oraz `npm run build`. Zielone testy nie zastępują przeglądu kodu.
- **3c — audyt innych zmian**, np. dokumentacji, konfiguracji i procesu: spójność instrukcji,
  decyzji i implementacji. Brak zmian w danej kategorii oznacza „nie dotyczy”.

Wyniki każdej części trafiają osobno do opisu PR: zakres, sprawdzone ustalenia, wykryte
błędy i nieweryfikowane kwestie. Przy kwerendzie agent zapisuje źródło, potwierdzany fakt
i datę sprawdzenia. Opis wcześniejszego agenta ani poprawny format URL nie są dowodem.
Brak dostępu lub nieudana kwerenda pozostają jawną luką, nie pozytywnym wynikiem audytu.

### 3. Domyślna pętla jakości

Stałą zgodą właściciela objęte są rozszerzanie i poprawianie wpisów bazy, uzupełnianie
powiązań oraz zakładanie brakujących encji dozwolonych przez dotychczasowe ADR-y.
Nowe fakty mogą pochodzić z kwerendy albo pamięci modelu. Agent zaczyna od konkretnych
ustaleń audytu i luk w bazie, planuje mały krok, uzupełnia materiał, sprawdza jakość,
commituje i pushuje oraz aktualizuje opis PR, a następnie wybiera kolejny uzasadniony krok.
Brak nowego skryptu nie oznacza automatycznego oczekiwania na zlecenie.

Pętla nie nakazuje produkowania treści na siłę. Gdy nie ma dalszego uzasadnionego kroku
zgodnego z zasadami, agent zapisuje stan i kończy turę; przy blokadzie wymagającej decyzji
właściciela zadaje konkretne pytanie.

### 4. Granice pozostają w mocy

- **Nowe encje tylko wprost z dostawy (ADR 0012 i 0013).** Można utworzyć wpis encji wcześniej
  pominiętej w istniejącym materiale. Nie można zakładać encji wyłącznie dlatego, że pojawiła
  się w kwerendzie, pamięci modelu albo opisie innej encji.
- **Bez wyprzedzania fabuły.** Nawet potwierdzony w źródle fakt o późniejszym wydarzeniu lub
  roli postaci nie trafia do bazy — także do osobnej sekcji czy pod oznaczenie spoilera.
- **Pochodzenie na fragmentach (ADR 0009–0011).** Sprawdzone dane zewnętrzne to `zrodlo`,
  pamięć modelu to `wiedza`, jawnie niesprawdzona i bez linków udających źródła. Dostawy
  `skrypt` i `menu` są nadrzędne, a ich archiwalne pliki pozostają nietykalne.
- **Graf i identyfikatory.** Slugi pozostają niezmienne, relacje prowadzą do istniejących
  wpisów właściwego typu, encje nie są duplikowane.
- **Nie jest to zgoda na dowolne zmiany kodu lub dokumentacji.** Audyt nie upoważnia do
  samodzielnego wdrażania funkcji silnika, przebudowy workflowów czy niezwiązanych porządków.
  Takie prace nadal wymagają zlecenia właściciela; propozycje trafiają do PR lub czatu.
- **Kontrola i trwałość.** Po zmianie bazy wpis do `content/co-nowego.md`; każdy zielony krok
  (`npm test` i `npm run build`) to osobny commit i natychmiastowy push na gałąź sesji.
  Jeden PR na sesję, bez force push, bez pushowania do `main`, bez scalania i zamykania
  PR przez agenta. Pozostałe reguły ADR 0007 nie ulegają zmianie.

## Konsekwencje

- PR powstaje przed pełną lekturą i audytem, a jego opis rzetelnie odróżnia plan od wyniku.
- Audyt nie ogranicza się do zielonych testów: zawiera sprawdzenie treści przez kwerendę,
  przegląd kodu i kontrolę pozostałych zmian.
- Baza może zyskiwać na jakości bez nowej dostawy i bez każdorazowej zgody na pogłębienie
  wpisu, ale nie rozszerza się na niezamówione encje ani przyszłość fabuły.
- W razie sprzeczności z wcześniejszym nakazem czekania lub gotowego audytu przy otwarciu
  PR obowiązuje ten ADR. Operacyjna instrukcja startu znajduje się w `AGENTS.md` §3.
