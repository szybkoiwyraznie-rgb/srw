# 0005 — Proces: pętla epizodu, dziennik zmian, publikacja

Data: 2026-10-13
Status: obowiązujący

## Kontekst

Projekt rośnie jako efekt uboczny grania: jedno rozegranie → jeden materiał wejściowy →
jedna porcja pracy agenta. Proces musi być na tyle krótki, żeby nie zniechęcał do jego
uruchamiania po każdym epizodzie, i na tyle rygorystyczny, żeby baza po dwudziestu sesjach
była spójna.

## Decyzja

1. **Materiałem wejściowym jest skrypt epizodu** w `episodes/<slug-gry>/epNNN.md`, pisany
   przez właściciela. Plik jest **read-only**: archiwum rozgrywki, nie źródło stylistyczne.
2. **Parzystość jest wymuszana przez build**: każdy plik w `episodes/` musi mieć wpis
   w `content/epizody/` (pole `skrypt` wskazuje plik). Skrypt bez wpisu = czerwony build,
   bo oznacza materiał czekający na przetworzenie.
3. **Praca domyślna agenta = pętla epizodu** (`docs/guides/PRZEPLYW_EPIZODU.md`): wpis epizodu,
   encje, relacje, analiza wątków, dziennik zmian, testy, commit.
4. **Dziennik zmian** (`content/co-nowego.md`) jest częścią definicji „skończonej pracy":
   wpis w witrynie `#/co-nowego` ma mówić, co doszło od poprzedniego razu.
5. **Tryb sesji**: PR powstaje na starcie, commit po każdym zielonym kroku, force push zakazany,
   scalanie należy do właściciela.
6. **Publikacja jest automatyczna**: push do `main` → testy → build → GitHub Pages.
   Nikt nie publikuje ręcznie ani nie edytuje artefaktu.

## Konsekwencje

- Stan bazy zawsze odzwierciedla stan repozytorium; nie ma kroku „a teraz wypchnij stronę".
- Czerwony build po wrzuceniu skryptu jest **informacją**, nie awarią: pokazuje, co czeka
  na przetworzenie.
- Nowa sesja agentowa nie potrzebuje historii czatu, żeby działać poprawnie — wystarczy
  repozytorium (stąd waga `AGENTS.md` i ADR-ów).
