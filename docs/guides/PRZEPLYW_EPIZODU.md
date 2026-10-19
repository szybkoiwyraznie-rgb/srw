# Przepływ: nowy epizod → baza

Lista kroków dla agenta, który dostał skrypt rozegranego epizodu. Kolejność jest istotna,
bo każdy krok korzysta z poprzedniego.

## 0. Rozpoznanie materiału

- Przeczytaj skrypt w całości (plik z `episodes/`). Ustal: gra, numer epizodu, trasa
  (jeśli gra ma rozgałęzienia), mówcy, maszyny, broń, sceny, punkty zwrotne.
- Sprawdź, czy gra i epizod już istnieją w bazie (`content/gry/`, `content/epizody/`).
  **Nie twórz duplikatów** — istniejący wpis się dopisuje.
- Jeśli w materiale jest coś nieczytelnego albo sprzecznego, zapisz to jako lukę
  (np. „w skrypcie nazwa maszyny nieczytelna"), a nie jako domysł.

## 1. Wpis gry (jeśli to nowy tytuł)

`content/gry/<slug>.md` — platforma, rok, status `w-toku`, krótki opis. Jeśli to pierwszy
epizod nowej gry, dopisz też zdanie o tym, że baza rusza z tym tytułem.

## 1a. Sceny (ADR 0008)

Najpierw sceny, bo są nośnikiem treści: `content/sceny/<slug-epizodu>-<tytul-sceny>.md` — po jednym
pliku na scenę skryptu. Treść sceny to dosłowny fragment skryptu w bloku `:::skrypt`, a `## Analiza`
opisuje wątki i nawiązania. Numer sceny przepisz tak, jak podaje skrypt (numeracja zależy od gry).

## 2. Wpis epizodu (agregacja scen)

`content/epizody/<gra>-ep<NNN>.md` — frontmatter: `gra`, `numer`, `rozegrano` (data rozegrania,
nie data commita), `skrypt`, listy `postacie` / `mechy` / `serie`, `pochodzenie: skrypt`,
tagi. Treść:

- `## Streszczenie` — co się stało, bez streszczania każdej kwestii,
- sekcji „Sceny” nie piszesz ręcznie — lista powstaje z wpisów `scena` (ADR 0008),
- `## Wątki anime` — tabela proweniencji (seria, odcinek, typ, różnice),
- `## Komentarz` — kontekst: co epizod robi z materiałem źródłowym, co pomija, co zmienia.

## 3. Encje

Dla każdej postaci i mecha obecnej w skrypcie (ADR 0012):

- **nowa encja** → nowy wpis w `content/postacie/` | `content/mechy/`, tylko jeśli występuje wprost
  w skrypcie lub dostawie, z odsyłaczem do serii i do pozycji powiązanych,
- **encja istniejąca** → dopisujesz wystąpienie (pole `gry`, `mechy`) i pogłębiasz
  opis tylko tym, co wnosi nowy materiał.
- **bronie** → w treści wpisu mecha, w sekcji o uzbrojeniu. Osobnych wpisów broni nie tworzymy.

Uwaga na poziom szczegółu: **statystyki i uzbrojenie opisują parę (mech, gra)**, nie mecha.
Wiedza o późniejszych epizodach i losach postaci do wpisu nie trafia (ADR 0012).
Jeśli menu gry podało parametry, zapisz je w `w_gre`, nie w opisie ogólnym.

### Dostawy ilustracyjne (ADR 0017)

Ilustracja właściciela jest samodzielną dostawą postaci lub mecha, także bez opisu tekstowego.
Sprawdź istniejące slugi, utwórz brakujący wpis, przypisz obraz i uzupełnij opis kwerendą
lub pamięcią modelu, z właściwymi blokami wiarygodności. Nie dopisuj udziału w scenie,
daty debiutu ani domyślnej załogi bez potwierdzenia w odpowiednim materiale.

## 4. Serie anime

Encja `seria` to nie streszczenie anime — to węzeł grafu: rok, rodzaj, liczba odcinków
i powód, dla którego ta seria jest w bazie (kto i co z niej pochodzi). Analiza konkretnych
odcinków i różnic wobec gry żyje w wpisie epizodu, w tabeli wątków.

## 5. Linkowanie

- Pola frontmattera dla relacji strukturalnych (obsada, sprzęt, seria, gra).
- Wikilinki w treści dla wszystkiego, co naturalnie pojawia się w zdaniu — wtedy w „Wymienione w"
  na stronie encji widać, w których epizodach postać się przewinęła.
- Nie linkuj na zapas: `[[slug]]` do wpisu, który nie istnieje, **wywala build**.

## 6. Dziennik zmian

Wpis na górze `content/co-nowego.md` z nagłówkiem `## RRRR-MM-DD GG:MM` (godzina publikacji): co doszło do bazy w tej sesji
(epizod, nowe encje, pogłębione wpisy). Krótko, rzeczowo, po polsku.

## 7. Kontrola i commit

```bash
npm test && npm run build
```

Build sprawdza: istnienie wszystkich odsyłaczy, zgodność typów, źródła przy `pochodzenie: zrodlo`
i brak adresów przy `pochodzenie: wiedza` (ADR 0009), wierność scen względem skryptu,
parzystość skryptów i wpisów, brak duplikatów slugów. Zielony wynik = commit.

## 8. Czego nie robić w tej pętli

- Nie poprawiać skryptu w `episodes/` (archiwum rozgrywki, read-only).
- Nie tworzyć encji „na przyszłość" — wpis bez materiału źródłowego zwykle okazuje się błędny.
- Nie wyrównywać stylu starych wpisów do nowych. Różnorodność jest zaletą, dopóki trzymają się
  zasady pochodzenia i graf.
