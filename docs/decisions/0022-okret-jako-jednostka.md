# 0022 — Okręt bojowy jest jednostką typu `mech`

Data: 2026-10-20
Status: obowiązujący; doprecyzowuje ADR 0012 i schemat danych.

## Kontekst

Dostawa z 2026-10-20 opisuje White Base tak samo jak inne jednostki bojowe: ma domyślną
załogę (Bright Noa, Mirai Yashima), macierzyste zdolności maszyny i tabelę uzbrojenia.
W bazie White Base istniało dotąd jako hasło (`typ: pojecie`, `kategoria: okręt`) — bez
załogi i bez parametrów. Slug jest niezmienny i jedna przestrzeń nazw nie pozwala mieć
jednocześnie hasła i jednostki o tym samym slugu.

## Decyzja

1. **Typ `mech` oznacza jednostkę bojową, nie tylko humanoidalną maszynę.** Obejmuje
   mobile suitów, laborów i okręty, które w grze mają załogę, zdolności i uzbrojenie.
   Pojęcia (`typ: pojecie`) pozostają dla świata, technologii, organizacji i miejsc.
2. **White Base przechodzi z hasła na jednostkę** po dostawie parametrów. Plik przenosi
   się z `content/pojecia/` do `content/mechy/`, a `kategoria: okręt` znika — rodzaj
   jednostki opisuje treść. Slug `white-base` i wszystkie odsyłacze pozostają bez zmian.
3. **Relacje idą za typem.** Epizod i scena wymieniają White Base w `mechy`, nie w `pojecia`;
   załoga (Bright Noa, Mirai Yashima) wskazuje ją w `mechy`. Walidator pilnuje typów.
4. **To nie jest nowa encja.** Treść opisu, źródła i data utworzenia zostają; dochodzą
   parametry i ilustracja. Zasady ADR 0012–0013 i 0017 obowiązują bez zmian.

## Odrzucone alternatywy

- **Dwa wpisy o tym samym slugu** — niedozwolone; jedna przestrzeń nazw, jedno hasło.
- **Osobny slug `white-base-okret`** — tworzy drugą stronę tej samej rzeczy i rozjeżdża
  odsyłacze z epizodu i scen.
- **Nowy typ `okret`** — poszerza schemat bez potrzeby; parametry i relacje są identyczne
  jak dla mechów, a różnica jest opisowa, nie strukturalna.

## Konsekwencje

Liczba haseł spada o jeden, a mechów rośnie o jeden; suma stron się nie zmienia.
Kolejne okręty z dostaw trafiają od razu do `content/mechy/`.
