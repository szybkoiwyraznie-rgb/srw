# episodes/ — skrypty epizodów

Tu trafia **jedyny materiał, który pisze właściciel**: przepisany skrypt rozegranego epizodu.
Wszystko pozostałe w tym repozytorium (wpisy encji, analizy, linkowanie) powstaje z tego pliku.

## Układ katalogów

```
episodes/
  <slug-gry>/
    ep001.md
    ep002.md
```

Jedna gra = jeden katalog, nazwany slugiem gry z `content/gry/<slug>.md`.
Jeden epizod = jeden plik. Plik jest **nienaruszalny**: agent go czyta, ale nie poprawia,
nie skraca i nie formatuje. To archiwum rozgrywki, nie źródło stylistyczne.

## Format pliku

Format jest celowo swobodny — liczy się to, żeby dało się rozpoznać mówców i granice scen.

```markdown
# Ep. 12 — Tytuł odcinka (jeśli gra go pokazuje)

Gra: Super Robot Taisen ...
Trasa: Real Robot
Rozegrano: 2026-10-20

## Ep. 12 — Tytuł / trasa: Real Robot

NARRACJA: opis tego, co widać na ekranie, przejścia, przerywniki.

AMURO: kwestia dialogowa.

KOJI: kolejna kwestia — jedna linia na wypowiedź.
```

Zasady, które mają znaczenie dla bazy:

- **`NAZWA: tekst`** — mówca wielkimi literami, dwukropek, treść. Z tego agent tworzy listę
  postaci obecnych w epizodzie.
- **`NARRACJA:`** — wtrącenia narratora; nie stają się postacią i nie generują wpisu.
- **Numer epizodu i trasa muszą być stabilne** — z nich powstaje slug wpisu i porządek listy.
  Jeśli gra numeruje epizody od nowa na każdej trasie, zapisz numer i trasę jawnie.
- Nazwy mechów, broni i ataków pisz **tak, jak widzisz je w grze** (jeśli znasz zapis japoński,
  dopisz go nawiasem). Od dokładności nazw zależą odsyłacze w bazie.
- Znaki, których nie umiesz odczytać, oznaczaj `[?]` — agent ma prawo zostawić po nich lukę
  w bazie zamiast zgadywać.

## Parzystość

Każdy plik w tym katalogu musi mieć odpowiadający wpis w `content/epizody/<slug>.md`.
Skrypt bez wpisu **wywala build** — to celowe: oznacza materiał, który czeka na przetworzenie.
