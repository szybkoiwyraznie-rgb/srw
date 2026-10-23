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

### Nawiązania do oryginalnych odcinków

Częścią sceny jest osobny blok `## Nawiązania do oryginalnych odcinków`, umieszczony po `## Analiza`
i przed `## Wątki w scenie` (blok `{{zrodlo gra=wspolne ... }}`). Ma on powiedzieć wprost, do jakiego
odcinka serialu albo rozdziału mangi prowadzi scena:

- zacznij od zdania wiążącego konkretne wydarzenia ze sceny z odcinkiem: „Wydarzenia z tej sceny —
  … — nawiązują do **piątego odcinka** serialu …";
- podaj numer i tytuł odcinka oraz tytuł utworu; przy pracy zbiorczej — numer rozdziału;
- dopisz, co gra zachowuje, a co zmienia względem oryginału.

Blok powstaje **tylko wtedy, gdy nawiązanie rzeczywiście występuje** — scena bez odniesień do
konkretnych odcinków go nie dostaje. Każdy podany adres trafia do `zrodla` we frontmatterze tylko po
otwarciu strony (ADR 0009), a opisana sytuacja z oryginału nie może wyprzedzać materiału rozegranego
w grze (ADR 0012).

### Kotwice analizy (układ strony sceny)

Strona sceny ma dwie kolumny: w lewej analiza i treść sceny, w prawej obsada, nawiązania i wątki.
Aby podsekcja analizy prowadziła do swojego miejsca w treści, dopisz w frontmatterze mapę:

```yaml
sekcje_analizy:
  - Odprawa na stacji Connect → Stacja Connect / Okolice Ziemi
```

Po lewej stronie strzałki stoi tytuł `###` z `## Analiza`, po prawej tytuł `##`–`####`
z `## Treść sceny`. Powtórzony tytuł po dowolnej stronie zużywa kolejne wystąpienie w kolejności.
Każda podsekcja `###` analizy wymaga dokładnie jednej pary; brak, nadmiar albo literówka zatrzymują
build — mapa nie zgaduje. Scena bez podsekcji w analizie mapy nie potrzebuje.

Każda scena ma w analizie tyle podsekcji, ile jest etapów w jej treści — także scena z prologu,
której treść stoi w całości w bloku `:::skrypt`. Dzięki temu czytelnik przechodzi z analizy wprost
do opisywanego miejsca skryptu. Dodatkowe sekcje `##` są dozwolone zgodnie z ADR 0006: renderer
zachowuje wszystkie wystąpienia, a sekcje inne niż boczne nawiązania i wątki pokazuje w kolumnie
głównej.

### Boksy strony epizodu

Strona epizodu dzieli się na osobne boksy: streszczenie, wątki fabularne i komentarz mają własne tło,
podobnie jak „Postacie i maszyny” (wraz z podsekcją „Nawiązania”) i „Inne źródła i rozbieżności”.
Nowy nagłówek `##` w treści epizodu otwiera nowy boks, a zmiana bloku poziomu bez nagłówka zamyka
poprzedni. Lista scen stoi na dole prawej kolumny, pod obsadą epizodu.

## 2. Wpis epizodu (agregacja scen)

`content/epizody/<gra>-ep<NNN>.md` — frontmatter: `gra`, `numer`, `rozegrano` (data rozegrania,
nie data commita), `skrypt`, listy `postacie` / `mechy` / `serie`, `pochodzenie: skrypt`,
tagi. Treść:

- `## Streszczenie` — co się stało, bez streszczania każdej kwestii,
- sekcji „Sceny” nie piszesz ręcznie — lista powstaje z wpisów `scena` (ADR 0008),
- `## Wątki fabularne` — tabela proweniencji (motyw, źródło, odcinek w źródle, różnice), w kolejności
  scen epizodu; szczegóły kolumn w `docs/guides/SCHEMAT_DANYCH.md` i ADR 0031,
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
