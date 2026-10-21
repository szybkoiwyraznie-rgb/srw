# 0016 — Polska dostawa właściciela i ilustracje jednostek

Data: 2026-10-19
Status: obowiązujący; uzupełnia ADR 0005, 0010 i 0015.

## Adnotacja 2026-10-21

**ADR 0025 zastępuje pkt 2 w zakresie wersji dostawy.** Obowiązuje nowa dostawa
`dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md` obejmująca mechy, pilotów i obsadę
misji; surowy materiał leży w `dostawy/srw-oe/dostawa_epizod_0.txt`. Pozostałe punkty,
w tym zasada polskiej treści i ilustracji, pozostają w mocy.

## Adnotacja 2026-10-19

**ADR 0017 zastępuje pkt 8 w zakresie ilustracji.** Obraz właściciela jest pełnoprawną
podstawą utworzenia encji; brak tekstu uzupełnia agent kwerendą lub pamięcią modelu.
Kuro i Shiro nie czekają już na dodatkową dostawę. Ilustracja nadal nie dowodzi konkretnego
zdarzenia fabularnego ani przypisania domyślnego pilota.

## Korekta 2026-10-19 — granica fabuły obowiązuje również menu

Właściciel wskazał, że stwierdzenie z pkt 4 dotyczące przyszłej roli Himari było błędne.
**Poziom `menu` nie uchyla zakazu spoilerów z ADR 0012.** Archiwalna dostawa zachowuje
pełny tekst, ale jej dane wyprzedzające fabułę nie trafiają do stron, relacji ani `w_gre`.
Usunięcie obejmuje też komentarze i dziennik widoczny w witrynie; informacji nie przenosi
się do osobnej sekcji. W tym zakresie pkt 4 nie obowiązuje. Nie zmienia to zasady,
że dostawa jednostki lub ilustracja może ustanawiać encję bez przypisywania jej
konkretnego przyszłego wydarzenia.

## Kontekst

Właściciel polecił przejść w całości na język polski, zastąpić wcześniejsze dostawy
polskim skryptem epizodu 0 i nowymi danymi pięciu jednostek oraz dodać ilustracje z R2.
Polecenie jest jawnym wyjątkiem od zakazu samodzielnego poprawiania archiwalnych dostaw.

## Decyzja

1. Treść bazy, opisy mechanik i nowe dostawy są po polsku. Nazwy własne, oznaczenia,
   tytuły serii, nazwy broni i skróty pozostają zgodne z dostawą, także gdy nie zostały
   przetłumaczone (np. Multi Launcher, Universal Century, Control AI). Nie wymyślamy
   polskich odpowiedników nazw ani nie zmieniamy istniejących slugów.
2. Na wyraźne polecenie właściciela polski skrypt zastępuje `episodes/srw-oe/ep000.md`.
   Stara dostawa parametrów `dostawy/srw-oe/exart-piloci-i-uzbrojenie.md` zostaje zastąpiona
   plikiem `dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md`. Wcześniejsze wersje pozostają
   w historii gita, nie w aktualnych dostawach. To nie jest zgoda na przyszłe samodzielne
   redagowanie skryptów; nowa wersja staje się nietykalnym wzorem.
3. W skrypcie zapisujemy znak cytatu Markdown `>` zamiast transportowego `&gt;` z czatu.
   W dostawie parametrów zachowujemy dosłowne znaczniki `&lt;br&gt;` i odstępy tabel.
   Na stronach pochodnych znaczniki końca wiersza zastępujemy separatorami tekstowymi,
   a tabele składamy bez pustych linii między wierszami. Nie poprawiamy wartości, skrótów
   ani nietypowych zapisów (np. „Obrona:Obraz.-24%” w wersji z 2026-10-19).
4. Dane jednostek z menu nie dowodzą ich wystąpienia w epizodzie 0. Domyślny profil
   Himari na miejscu 2 Exarta jest informacją z menu, nie przyszłym wydarzeniem fabuły.
   Cybuster, Cybird, Brocken i Real PG Gundam nie trafiają do obsady tej sceny.
5. Parametry pięciu jednostek są związane z `srw-oe`: we froncie `w_gre.srw-oe` jako
   tekst JSON z profilem, ścieżką dostawy i pełnymi danymi, a na stronie w osobnej sekcji
   „Parametry w Super Robot Wars OE” poziomu `menu`. Nie są parametrami ogólnymi mecha.
6. Istniejące bezpieczne uzupełnienia z kwerendy nie są dostawą właściciela i nie są
   automatycznie usuwane. Sprzeczne opisy i ujawnienia przyszłej fabuły nie są przenoszone
   do nowych wpisów. Każdy fragment zachowuje odpowiedni poziom wiarygodności.
7. Jedna encja może mieć wiele ilustracji. Wykorzystujemy zewnętrzne obrazy przez HTTPS,
   bez zapisywania oryginałów w git i bez osadzania ich jako base64 w HTML-u.
   Dostarczona przez właściciela lista nazw plików pozwala przypisać je do wskazanych encji;
   nie oznacza to niezależnego obejrzenia obrazów przez agenta. Status sprawdzenia jest jawny.
8. Obrazy nie tworzą encji. Kuro i Shiro, obecni tylko w nazwach plików, czekają na dostawę
   danych. Określenie wariantu Gundam (Keroro) nie ustanawia domyślnego pilota.

## Konsekwencje

Scena jest przebudowana z polskiego skryptu z zachowaniem wierności. Nowe mechy, profile
pilota, serie i hasła pochodzą bezpośrednio z dostawy. Historyczne adresy wpisów pozostają
stabilne mimo polskich tytułów. Ilustracje wymagają połączenia z R2; tekst, wyszukiwanie
i nawigacja pozostają dostępne także bez sieci.
