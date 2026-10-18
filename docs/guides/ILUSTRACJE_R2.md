# Ilustracje w R2 — lista plików przez GitHub Actions

Oryginały ilustracji są w Cloudflare R2, nie w git ani w wynikowym HTML-u.
Workflow `.github/workflows/r2-inventory.yml` tworzy listę obiektów, nie zmienia bucketa,
nie pobiera obrazów i nie przypisuje ich automatycznie do wpisów bazy.

## Konfiguracja

- Bucket: `srw-images`.
- Publiczny adres testowy: `https://pub-f065608b5a964f3fb44480d8c9df01de.r2.dev`.
- Sekrety repozytorium Actions: `R2_ACCESS_KEY_ID` i `R2_SECRET_ACCESS_KEY`.
- Zmienna repozytorium Actions: `R2_ENDPOINT`, adres HTTPS endpointu S3 R2, bez ścieżki bucketa.
- Token R2: **Object Read only**, ograniczony do `srw-images`. Workflow nie może sam
  potwierdzić zakresu tokena; zakres ustawia właściciel w Cloudflare.

Nie kopiuj sekretów do czatu, kodu, manifestu ani logów. Agent nie potrzebuje ich wartości.
Brak prawa sesji do wyświetlenia listy sekretów na GitHubie nie oznacza ich braku.

## Użycie przez agenta

Workflow musi najpierw znaleźć się na domyślnej gałęzi po scaleniu przez właściciela.
Nie dodawaj zdarzeń `pull_request_target` ani obejść uruchamiających kod PR z sekretami.

```bash
gh workflow run r2-inventory.yml --ref main
gh run list --workflow r2-inventory.yml --event workflow_dispatch --limit 5
# Odczytaj ID właściwego uruchomienia z listy, następnie:
gh run watch <ID> --exit-status
gh run download <ID> --name r2-inventory --dir /tmp/srw-r2-inventory
```

Przy równoległych uruchomieniach sprawdź gałąź, czas i autora, zamiast zakładać, że najnowszy
run należy do tej sesji. Plik wynikowy to `r2-inventory.json`: czas wykonania, bucket,
publiczny adres bazowy, liczba i łączny rozmiar plików oraz `objects` z polami:
`key`, `size` (bajty), `lastModified`, `etag`, `url`. Lista jest sortowana po kluczu.
Foldery bez plików (klucze kończące się `/`) są pomijane. Paginacja obejmuje cały bucket,
nie tylko pierwsze 1000 obiektów; niekompletny odczyt kończy zadanie błędem.

Po kolejnej dostawie ilustracji uruchom workflow ponownie. Porównanie `key`, `etag` i czasu
modyfikacji z poprzednią listą umożliwia rozpoznanie nowych lub zastąpionych plików.
Artefakt jest przechowywany przez **7 dni**; to migawka, nie trwały rejestr ani stały monitoring.
Nazwy i metadane plików w artefakcie publicznego repozytorium traktuj jako publiczne.

## Ograniczenia i kontrola

- AWS CLI v2 jest dostępne na używanym runnerze GitHub `ubuntu-latest`; workflow sprawdza
  jego obecność. Skrypt korzysta tylko z `s3api list-objects-v2`. Nie ma nowych zależności npm
  ani zmian silnika strony. Testy lokalne używają atrap odpowiedzi, bez kluczy i połączeń z R2.
- Sekrety są przekazywane wyłącznie do kroku odczytu listy. Endpoint jest sprawdzany jako
  host Cloudflare R2 przed uruchomieniem AWS CLI. Surowe błędy klienta nie trafiają do logów.
- Lista **nie potwierdza dostępności publicznych URL**, zawartości obrazu, praw do ilustracji
  ani jej związku z postacią/mechem. Przed przypisaniem ilustracji trzeba ją obejrzeć.
- Dostęp do API GitHuba i Actions nie oznacza dostępu sieciowego sandboxa do domen R2.
  Jeśli sandbox nie może pobrać ilustracji, nie deklaruj jej obejrzenia. Sam manifest nadal
  pozwala poznać nazwy i adresy; inspekcja obrazów może wymagać osobnego rozwiązania.
- `r2.dev` jest adresem testowym; docelowo można przejść na własną subdomenę, zmieniając
  `R2_PUBLIC_BASE_URL` w workflow. Nie należy wtedy zmieniać kluczy istniejących plików.
- Nie uruchamiaj workflow z niezaufanej gałęzi. Nie udostępniaj go jako publicznego endpointu.
