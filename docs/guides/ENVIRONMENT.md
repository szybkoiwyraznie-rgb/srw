# Środowisko sesji agentowej — ograniczenia i pułapki (dokument trwały)

> Ten plik zbiera **stałe właściwości środowiska**, które dotyczą każdej sesji
> agenta w sandboxie Areny. Nie opisuje jednej sesji — od tego jest opis PR.
> Konwencja i większość reguł pochodzą z pozostałych repozytoriów właściciela
> (`mtg`, `AME`, `okolica`), gdzie przeżyły kilkadziesiąt sesji; fakty poniżej
> zostały **zmierzone w tym sandboxie 2026-10-14** (sesja PR #3). Jeśli coś się
> zmieniło — popraw z datą i pomiarem, ale nie usuwaj wpisu bez powodu.

Powiązania: `AGENTS.md` §3 (tryb sesji), ADR 0007 (model sesji), `docs/LESSONS.md`.

## 1. Izolacja sesji — co NAPRAWDĘ przetrwa

Nowa sesja startuje z czystego, **płytkiego** klona i ma dostęp wyłącznie do:

1. **gałęzi `main` na GitHubie** (stan po scaleniu PR poprzedniej sesji),
2. **tekstu pierwszego promptu** właściciela,
3. tego, co sama wypchnie na swoją gałąź `arena/<id>`.

**Nie przetrwa NIC innego** — pliki lokalne, `/tmp`, historia czatu, pamięć sesji,
zmienne środowiskowe, zainstalowane pakiety, uruchomione serwery, niewypchnięte
commity. Konsekwencje:

- **Praca istnieje dopiero po `git push`.** Commituj po każdym zielonym kroku
  i od razu pushuj. Nie czekaj z commitem na „koniec zadania".
- Wszystko trwałe zapisuj w repozytorium (treść, ADR, lekcje, ten plik).
  Blok podsumowania w czacie jest kopią wiedzy z repo, nie jej nośnikiem.

## 2. Koniec dostępu: scalenie albo zamknięcie PR = KONIEC PRACY sesji

Sesja jest przypięta do jednej gałęzi `arena/<id>` i jednego PR-a. Gdy właściciel
**scali** albo **zamknie** ten PR, sesja traci rację bytu — gałąź przestaje być
celem pracy, a dostęp do GitHuba z tego sandboxa nie jest już gwarantowany
(token sesji wygasa / zostaje odcięty). Zatem:

- **Nie zostawiaj niczego „na po scaleniu".** Każdy wynik ma być w PR-ze, zanim
  właściciel go dotknie; opis PR ma być aktualny po każdym wypchniętym commicie
  merytorycznym (żywy dokument gałęzi, nie etap zamknięcia).
- Po informacji o scaleniu/zamknięciu PR agent **nie zakłada nowej gałęzi, nie
  pushuje i nie otwiera nowego PR-a** — kolejną pracę zaczyna kolejna sesja
  z nowym promptem właściciela.
- **Agent NIGDY sam nie scala PR-a i nigdy go nie zamyka** — także po
  akceptacji treści, także gdy wszystko jest zielone, także gdy właściciel
  pyta „czy to już jest na stronie?". Akceptacja wyniku ≠ polecenie scalenia
  (lekcja L7). Poprawna odpowiedź brzmi: „zmiany są w PR #N, scalenie należy
  do Ciebie".

## 3. Sandbox potrafi zresetować workspace w trakcie sesji

**Objaw:** lokalny `HEAD` nagle wskazuje `main`, commity sesji „znikają",
`git push` odrzuca (*non-fast-forward*), w `git reflog` świeży wpis `clone: from …`;
`/tmp` pusty; czasem `gh auth status` → *token is no longer valid*.

**To nie jest utrata pracy — o ile commity były wypchnięte.** Procedura:

```bash
git rev-parse --abbrev-ref HEAD && git log --oneline -3 && git status   # gdzie jestem
git ls-remote --heads origin                     # czy praca jest na zdalnej gałęzi?
git fetch origin arena/<id>
git reset --hard FETCH_HEAD                      # odtwórz historię sesji lokalnie
git push -u origin arena/<id>                    # pierwszy push po odzyskaniu z -u
```

**Gdy drzewo robocze ma stan końcowy, a obiekty gita zniknęły** (zmiany są
w plikach, ale nie w commitach): ZANIM wykonasz `reset --hard`, skopiuj repo
(`cp -a /home/user/srw /tmp/kopia`), zresetuj do `FETCH_HEAD`, skopiuj
zawartość z powrotem (bez `.git`) — `git status` pokaże realny przyrost; uruchom
bramę i odtwórz commity. Alternatywa bez kopiowania: `git fetch origin arena/<id>`
+ `git reset --mixed FETCH_HEAD` przesuwa wskaźnik i indeks, nie rusza plików.

Jeśli po resecie commit wylądował na `main`: `git branch backup-<opis> <sha>`
→ `git fetch origin arena/<id>` → `git reset --hard FETCH_HEAD` → `git cherry-pick <sha>`.
`--force` jest zakazany zawsze: zdalna gałąź jest źródłem prawdy.

**Profilaktyka:** po każdym commicie `git log --oneline -1`; push od razu; przed
każdym commitem `git rev-parse --abbrev-ref HEAD` (commit poza gałęzią sesji to
sierota — nie wejdzie do PR-a i przepadnie).

## 4. Git i GitHub (pomiar 2026-10-14)

- **Token** działa jako konto właściciela (`gh auth status` → `szybkoiwyraznie-rgb`,
  `GH_TOKEN`), nie jako bot. W PR #2 z gałęzi `arena/…` zmieniono
  `.github/workflows/*.yml` — w tym repozytorium push do workflowów **działa**
  (w siostrzanych projektach bot dostawał 403 `workflows`). Mimo to workflowy
  zmieniaj tylko na zlecenie właściciela.
- **Token potrafi wygasnąć w trakcie sesji** (objaw: push prosi o hasło,
  `gh auth status` → *token no longer valid*). Commity lokalne są bezpieczne —
  commituj dalej lokalnie, poproś właściciela o ponowne połączenie GitHuba
  w Arenie i ponów push. **Nigdy nie proś o token, hasło ani kod 2FA w czacie.**
- **Klon startowy jest płytki** (`git rev-parse --is-shallow-repository` → `true`,
  1 commit). `git fetch --unshallow origin` działa i daje pełną historię —
  zrób to na starcie, bo `datyGit` w `tools/build.mjs` liczy stopki
  „utworzono / zaktualizowano" z historii pliku; z płytkiego klonu daty są
  fałszywe, a build ostrzega na stderr („UWAGA: płytki klon gita…").
  **Nie filtruj wyjścia builda do jednej linii** — ostrzeżenie przepada.
- **Komunikaty commitów pisz do pliku poza repozytorium** (np. `/tmp/msg.txt`)
  i commituj przez `git commit -F /tmp/msg.txt`. Backticki i `$(...)`
  w `git commit -m "…"` wykonują podstawienie komend basha i zjadają słowa
  z komunikatu (sprawdzone 2026-10-14).
- **`git add -A` commituje więcej, niż opisuje komunikat.** Przed commitem
  `git status --short` i porównanie z zakresem kroku; przy wątpliwościach
  `git add <ścieżki>` jawnie. Rozjazd po pushu: nie poprawiaj historii —
  opisz w opisie PR.
- **Bramy jakości nie podłączaj do potoku w łańcuchu `&&`.** `npm test 2>&1 | tail`
  zwraca kod wyjścia `tail`, nie testów — commit poszedłby z czerwonym testem.
  Uruchamiaj `npm test` jako samodzielne polecenie i patrz na kod wyjścia
  (albo `npm test >/tmp/t.log 2>&1 && …`, log oglądaj osobno).
- **`gh pr edit` nie działa** (potwierdzone 2026-10-14: błąd GraphQL
  `Projects (classic) is being deprecated … projectCards`). Opis PR aktualizuj przez
  `gh api -X PATCH repos/szybkoiwyraznie-rgb/srw/pulls/<nr> -F body=@/tmp/pr-body.md`
  (plik z opisem trzymaj poza repo i dopisuj do niego kumulatywnie).
- `git checkout <plik>` cofa niezacommitowane zmiany w tym pliku — commituj,
  zanim sięgniesz po takie operacje.
- Praca wyłącznie na gałęzi `arena/<id>`; nigdy push do `main`; nigdy `--force`;
  nigdy `gh pr merge` / `gh pr close` (§2).

## 5. Sieć i narzędzia (pomiar 2026-10-14)

| Co | Stan | Konsekwencja praktyczna |
|---|---|---|
| `curl https://api.github.com` | 200 | `gh` działa |
| `curl https://registry.npmjs.org/` | 200 | `npm i` wykonalne — ale tylko **poza repo** (silnik ma zero zależności, ADR 0002) |
| `curl https://pypi.org/simple/` | 200 | `pip install` wykonalne (narzędzia pomocnicze poza repo) |
| `curl https://en.wikipedia.org`, `raw.githubusercontent.com` | **000 — zablokowane** | źródeł do `zrodla` **nie weryfikujesz curl-em**; używaj narzędzi agenta (`web_search`, `fetch_page`) |
| Node / npm / Python / git | v22.22.3 / 10.9.8 / 3.11.2 / 2.39.5 | `engines: node >=22` spełnione |
| `write_file`, `edit_file` | **zachowują UTF-8** (test: „Zażółć gęślą jaźń", makrony, kana) | w `AME`/`mtg-game` `edit_file` psuł polskie znaki — tu nie; i tak po edycji przejrzyj `git diff` |

- Build i testy **nie korzystają z sieci** — źródła sprawdzane tylko pod kątem
  formatu adresu, nie dostępności.
- Narzędzia pomocnicze (np. headless Chromium z paczki `@sparticuz/chromium`,
  rasteryzacja obrazów) instaluj wyłącznie poza repozytorium, np.
  w `/home/user/.narzedzia`; przed każdym `npm i` sprawdź `pwd`. Nie łącz
  instalacji fallbackiem `||` z poleceniem, które może się nie udać przed
  zmianą katalogu (lekcja z `AME`: `cd … && … || npm i …` zainstalował pakiety
  w repo).
- Pliki poza `/home/user` (w tym `/tmp`) znikają z sesją — komunikaty commitów
  i opisy PR trzymaj tam świadomie, ale nic trwałego.

## 6. Podgląd dla właściciela

- `npm run serve` (narzędziem `start_process`) słucha na `0.0.0.0:3000`; port
  staje się widoczny jako live preview pod `https://3000-<sandbox>.e2b.app`.
- Przed wystawieniem podglądu: klon pełny (§4), świeży `npm run build` **po**
  ostatniej zmianie treści, kontrola jednej starszej strony (data utworzenia
  sprzed dni, nie z dziś).
- Artefakt `dist/index.html` ma pozostać w granicach pojedynczych megabajtów;
  winne wzrostowi są zwykle osadzone obrazy — te trzymamy poza repozytorium.
- Preview umiera razem z sandboxem; trwałość daje tylko push.

## 7. Czas wykonania (orientacyjnie, baza 16 stron)

| Operacja | Czas |
|---|---|
| `npm test` | ~0,5 s (rośnie z liczbą stron) |
| `npm run build` | ~1 s |
| CI na PR (checkout + testy + build) | ~30–60 s |

## 8. Publikacja

- Push do `main` → `pages.yml` → testy → build → GitHub Pages. Nikt nie publikuje
  ręcznie; agent nie pushuje do `main`, więc publikacja jest zawsze skutkiem
  scalenia PR-a przez właściciela.
- Artefakt ma `noindex, nofollow`, ale repozytorium jest publiczne — treść jest
  publiczna.

## 9. Checklista startu sesji

0. `git rev-parse --abbrev-ref HEAD`, `git log --oneline -3`, `git status`,
   `git rev-parse --is-shallow-repository` → jeśli `true`: `git fetch --unshallow origin`.
1. Lektura obowiązkowa wg `AGENTS.md` (w całości, w kolejności).
2. `npm test` + `npm run build` — zieloność przed zmianami.
3. **PR sesji otwarty PRZED pierwszą zmianą w treści** (pusty commit porządkowy
   `git commit --allow-empty` → `git push -u origin arena/<id>` → `gh pr create`),
   z planem działania i audytem poprzedniego PR w opisie.
4. Audyt poprzedniego scalonego PR (`gh pr list --state merged --limit 3`,
   `gh pr view <nr> --json files,body`, diff) — wynik w opisie PR.
5. Brak zlecenia po audycie = **czekaj na flow właściciela**; nie dodawaj treści
   z własnej inicjatywy (ADR 0007).

## 10. Checklista przed oddaniem PR-a właścicielowi

1. `npm test` i `npm run build` zielone, build bez ostrzeżenia o płytkim klonie.
2. Wszystko zacommitowane **i wypchnięte** (`git status` czysty,
   `git log origin/arena/<id> -1` = `HEAD`).
3. `content/co-nowego.md` ma wpis dnia, jeśli zmieniła się baza.
4. Reguły trwałe trafiły do ADR / `AGENTS.md` / `LESSONS.md` / tego pliku —
   nie tylko do czatu.
5. Opis PR zaktualizowany kumulatywnie (plan z odhaczonymi punktami, audyt,
   odstępstwa). PR **pozostaje otwarty** — scala właściciel.
