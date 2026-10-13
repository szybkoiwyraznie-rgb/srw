# 0003 — Typy stron, działy i niezmienny slug

Data: 2026-10-13
Status: obowiązujący

## Kontekst

Każdy byt w bazie (gra, epizod, postać, mech, broń, seria anime) musi mieć stabilny
identyfikator, bo od niego zależą wszystkie odsyłacze. Baza ma rosnąć przez lata i być
uzupełniana przez sesje, które nie pamiętają poprzednich.

## Decyzja

1. **Sześć typów stron**: `gra`, `epizod`, `postac`, `mech`, `bron`, `seria`. Dział katalogu
   w `content/` odpowiada typowi; rozjazd jest błędem buildu.
2. **`slug` jest niezmienny i unikalny w całej bazie** (jedna przestrzeń nazw). Raz nadany
   zostaje, nawet jeśli zmieni się pisownia tytułu wpisu.
3. **Slug buduje się z tytułu** funkcją `slugify` (małe litery ASCII, myślniki). Przy kolizji
   nazw dopisuje się wyróżnik: rok, oznaczenie wariantu albo slug gry.
4. **Plik nosi nazwę sluga**: `content/<dział>/<slug>.md`.
5. **Rozgałęzienia obsługujemy w obrębie epizodu**, nie przez duplikowanie wpisów: epizod ma
   pola `numer` i `trasa`, a kolejność na liście wynika z numeru w obrębie gry.
6. **Wariant maszyny to osobny wpis** — jeśli gra traktuje go jako oddzielną jednostkę
   (inne parametry, inny pilot), dostaje własny slug i odsyłacz do bazowego mecha.

## Konsekwencje

- Graf jest stabilny: zmiana tytułu nie zrywa odsyłaczy.
- Kosztem jest dyscyplina: nie wolno „poprawiać" slugów przy okazji redakcji.
- Jedna przestrzeń nazw oznacza, że slug gry i postać nie mogą się nazywać tak samo —
  wyróżnik rozwiązuje sprawę, ale trzeba o tym pamiętać przy tworzeniu nowych wpisów.
