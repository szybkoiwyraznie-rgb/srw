# 0006 — Swoboda formy: brak zamkniętych list sekcji i tagów

Data: 2026-10-13
Status: obowiązujący

## Kontekst

Projekt prowadzi jedna osoba, ale pracują nad nim kolejne sesje agentowe — za każdym razem
inny model, z inną wiedzą, innym stylem i innymi pomysłami na to, co warto opisać. Pokusa,
żeby to ujednolicić („każda postać ma dokładnie te same sekcje, każdy tag pochodzi ze słownika"),
prowadzi do dwóch szkód: wpisy stają się szablonowe, a praca agenta zamienia się w wypełnianie
formularza zamiast pisania o tym, co faktycznie było ciekawe w rozegranym materiale.

## Decyzja

1. **Lista sekcji w treści jest otwarta.** Wymagane są tylko `## Opis` (encje) i `## Streszczenie`
   (epizod); reszta zależy od materiału.
2. **Tagi są swobodne** — bez słownika i bez walidacji poza formatem sluga.
3. **Nie ma obowiązku jednolitego stylu narracji.** Kolejne sesje mogą pisać inaczej.
4. **Istniejące wpisy można zmieniać i pogłębiać** — to normalna praca, nie naruszenie zasady.
5. **Pilnowane jest tylko to, co chroni graf i czytelnika**: istnienie odsyłaczy, zgodność
   typów, niezmienność slugów, znaczniki pochodzenia i źródła dla wiedzy modelu (ADR 0004).

## Konsekwencje

- Baza zyskuje na różnorodności, a kolejne sesje wnoszą to, w czym są mocne.
- Kosztem jest mniejsza przewidywalność: dwie postacie mogą mieć zupełnie inne sekcje.
  To akceptowalne — czytelnikiem jest właściciel, a wartość bierze się z treści, nie z układu.
- Granica jest ostra i wąska: **swoboda dotyczy formy, nie faktów ani grafu.** Zmiana zasad
  dotyczących danych wymaga nowego ADR-a.
