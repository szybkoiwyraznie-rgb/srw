# 0001 — Treść jako dane w markdownie, artefakt jako produkt buildu

Data: 2026-10-13
Status: obowiązujący

## Kontekst

Baza będzie rosła przez lata, obsługiwana przez kolejne sesje agentowe z różnymi modelami.
Pierwszy odruch — „napiszmy strony w HTML-u" — oznaczałby, że treść i prezentacja są tym samym
plikiem, a każda zmiana wyglądu wymaga dotknięcia treści.

## Decyzja

1. **Treść żyje w `content/**` jako markdown z frontmatterem** i jest jedynym źródłem prawdy.
2. **`dist/index.html` jest produktem buildu** — nie jest commitowany i nie wolno go ręcznie edytować.
3. **Build jest bramką jakości**: waliduje odsyłacze, typy, pochodzenie i źródła; przy problemie
   nie wypuszcza artefaktu.
4. **Witryna to jeden samowystarczalny plik HTML**, który działa identycznie przez HTTPS
   i z dysku (`file://`).

## Konsekwencje

- Zmiana wyglądu nigdy nie dotyka treści i odwrotnie.
- Baza jest czytelna bez witryny (zwykłe pliki w repozytorium) i sensownie wygląda w `git diff`.
- Nie ma backendu ani bazy danych — przy skali jednej gry rocznie byłby to koszt bez zysku.
- Konsekwencja uboczna: jeśli kiedyś będzie potrzebny SQL, da się go zbudować z tych samych
  plików (np. DuckDB bezpośrednio na repozytorium), bez migracji.
