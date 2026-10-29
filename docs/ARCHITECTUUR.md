# Architectuur

## Stackkeuze (en waarom)
| Onderdeel | Keuze | Waarom |
|---|---|---|
| Bouwen | **Vite** | Eén commando om te draaien en te bouwen; weinig configuratie. |
| Interface | **Vanilla JavaScript** (ES-modules) | Geen framework om te leren. Met basiskennis HTML/CSS/JS kun je elk bestand lezen. Nadeel: iets meer code voor schermen dan met Svelte. |
| Opslag | **Dexie** (bovenop IndexedDB) | IndexedDB is de enige ruime, blijvende opslag in de browser. Dexie maakt het leesbaar en heeft ingebouwde schemaversies voor migraties. |
| Tests | **Vitest** + `fake-indexeddb` | Werkt direct met Vite; database-tests draaien zonder browser. |
| Offline | **vite-plugin-pwa** | Maakt service worker en manifest; alles wordt gebundeld, niets van een CDN. |
| Barcode | **`barcode-detector`-polyfill (ZXing in WebAssembly)** | Safari heeft geen ingebouwde barcodelezer; deze polyfill gebruikt ZXing en werkt op iPhone. Op Android gebruikt hij de ingebouwde lezer. Het WebAssembly-bestand wordt **zelf meegebundeld** (standaard haalt de library het van een CDN — dat zetten we uit). Definitieve keuze getest in fase 3. |
| Grafieken | Zelfgeschreven SVG | Geen externe bibliotheek nodig voor een lijn- en staafgrafiek. |
| Hosting | **GitHub Pages** via GitHub Actions | Gratis, HTTPS (nodig voor camera), publiceert automatisch na elke goedgekeurde pull request. Adres: `https://callastri.github.io/phoenix/` |

## Mappenstructuur
```
phoenix/
├─ CLAUDE.md                 werkafspraken
├─ README.md                 handleiding in eenvoudig Nederlands
├─ docs/                     visie, eisen, architectuur, privacy
├─ index.html                startpagina
├─ public/                   iconen, NEVO-JSON (ongewijzigd meegeleverd)
├─ scripts/
│  └─ nevo-naar-json.js      zet het NEVO-bestand om naar public/nevo.json
├─ src/
│  ├─ main.js                start de app, kiest het scherm
│  ├─ opslag/                ALLES wat met IndexedDB te maken heeft
│  │  ├─ db.js               tabellen, schemaversies, migraties
│  │  ├─ dagboek.js          dagboekregels lezen/schrijven
│  │  ├─ producten.js        eigen + opgeslagen producten
│  │  ├─ recepten.js
│  │  ├─ gewicht.js
│  │  ├─ beweging.js
│  │  ├─ instellingen.js
│  │  └─ backup.js           export/import JSON, CSV, alles wissen
│  ├─ berekeningen/          PURE functies, geen DOM, geen database
│  │  ├─ voeding.js          hoeveelheid → gram, waarden per regel, dagtotaal
│  │  ├─ recepten.js         waarden per portie
│  │  ├─ doelen.js           Mifflin-St Jeor, activiteit, waarschuwing
│  │  ├─ beweging.js         MET → kcal
│  │  ├─ gewicht.js          7-daags gemiddelde, trend
│  │  ├─ overzicht.js        weekgemiddelden
│  │  └─ controle.js         invoercontrole (ook gebruikt bij import)
│  ├─ diensten/
│  │  ├─ openfoodfacts.js    ENIGE plek met een netwerkverzoek naar buiten
│  │  ├─ nevo.js             laadt en doorzoekt public/nevo.json
│  │  └─ scanner.js          camera + barcode
│  ├─ gegevens/              aanpasbare lijsten
│  │  ├─ bewegingssoorten.js soorten + MET-waarden
│  │  ├─ activiteitsniveaus.js
│  │  └─ drempels.js         bv. back-upherinnering na 7 dagen, min. kcal
│  ├─ schermen/              één bestand per scherm (maakt HTML, koppelt knoppen)
│  │  ├─ dagboek.js, toevoegen.js, gewicht.js, beweging.js,
│  │  ├─ overzicht.js, instellingen.js, over.js, installeren.js
│  ├─ onderdelen/            herbruikbare stukjes (knop, dialoog, grafiek)
│  └─ stijl/                 CSS: basis, thema's (licht/donker), schermen
└─ tests/                    één testbestand per berekening + opslag/back-up
```
Regel: `schermen/` mag `opslag/` en `berekeningen/` gebruiken.
`berekeningen/` gebruikt niets anders. `opslag/` gebruikt geen `schermen/`.

## Gegevensmodel (IndexedDB via Dexie)
Alle hoeveelheden voedingswaarden zijn **per 100 g of 100 ml**.
Een ontbrekende waarde is `null`, nooit 0.

**Voedingswaarden-object** (`waarden`), overal hetzelfde:
```js
{ kcal, eiwit, koolhydraten, vet, vezels, suiker, zout }  // getal of null
```

### Tabellen
| Tabel | Velden | Opmerking |
|---|---|---|
| `producten` | `id`, `bron` ('eigen' \| 'off'), `naam`, `merk?`, `barcode?`, `gebaseerdOpNevo?`, `eenheid` ('g' \| 'ml'), `waarden`, `porties` [{`naam`, `gram`}], `favoriet`, `bijgewerkt` | NEVO zelf staat NIET in de database maar in `nevo.json` (alleen-lezen). Pas je een NEVO-product aan, dan komt er een eigen product in deze tabel (zie NEVO-gegevens). |
| `porties` | `id`, `nevoCode`, `naam`, `gram` | Eigen porties bij NEVO-producten (bv. "1 snee" = 35 g). |
| `recepten` | `id`, `naam`, `aantalPorties`, `ingredienten` [{`productRef`, `hoeveelheid`, `eenheid`}], `favoriet`, `bijgewerkt` | Waarden per portie worden berekend, niet opgeslagen. |
| `dagboek` | `id`, `datum` ('JJJJ-MM-DD'), `maaltijd` ('ontbijt' \| 'middag' \| 'avond' \| 'tussendoor'), `productRef` {`soort`, `id`}, `naam`, `waarden` (momentopname), `hoeveelheid`, `eenheid` ('g' \| 'ml' \| 'portie'), `portieNaam?`, `gram`, `aangemaakt` | Momentopname: zie open vraag 2 in EISEN.md. "Recent" wordt hieruit afgeleid. |
| `gewicht` | `id`, `datum`, `kg` | Eén meting per datum; nieuwe invoer op dezelfde datum vervangt. |
| `bewegingssoorten` | `id`, `naam`, `met`, `metAfstand` (ja/nee), `eigen` | Startlijst uit `gegevens/bewegingssoorten.js`; zelf uitbreidbaar. |
| `beweging` | `id`, `datum`, `soortId`, `soortNaam`, `met` (momentopname), `minuten`, `afstandKm?`, `notitie?` | kcal wordt berekend met het gewicht dat het dichtst bij die datum ligt. |
| `instellingen` | sleutel/waarde: `profiel` (lengte, geboortejaar, formule man/vrouw, activiteitsniveau), `doelen`, `bewegingOptellen` (standaard `false`), `laatsteBackup`, `installUitlegGezien` | |

Indexen: `dagboek` op `datum` en `[datum+maaltijd]`; `gewicht` en `beweging`
op `datum`; `producten` op `barcode`, `naam`, `favoriet`.

### Schemaversie en migraties
- `src/opslag/db.js` definieert elke versie met Dexie `.version(n).upgrade()`.
- Elke migratie krijgt een test: maak een database in de oude versie met
  voorbeeldgegevens, open in de nieuwe versie, controleer dat alles er nog is.
- Back-upbestanden bevatten `schemaVersie`. Een oude back-up wordt bij
  import eerst door dezelfde migratiestappen gehaald.

### Back-upformaat (JSON)
```json
{
  "app": "voedingsdagboek",
  "schemaVersie": 1,
  "gemaakt": "2026-10-29T12:00:00Z",
  "gegevens": { "producten": [], "recepten": [], "dagboek": [],
                "gewicht": [], "bewegingssoorten": [], "beweging": [],
                "instellingen": [] }
}
```
Import: eerst volledig controleren (`berekeningen/controle.js`); bij één
fout wordt niets gewijzigd en zie je welke regel fout is. Daarna kies je
"vervangen" (alles wissen en terugzetten). Samenvoegen doen we niet in de
MVP — dat is foutgevoelig.

## NEVO-gegevens (versie 2025/9.0)
- Script `scripts/nevo-naar-json.js` leest het officiële NEVO-bestand en
  schrijft `public/nevo.json` met alleen: NEVO-code, naam, NEVO-versie,
  eenheid, en deze kolommen **ongewijzigd**: kcal, Eiwit, Koolhydraten,
  Vet, Vezel, Mono-disachariden (= "waarvan suikers"), Natrium (mg).
- Lege NEVO-cellen blijven `null`.
- **Zout** wordt niet in `nevo.json` gezet, maar in de app berekend
  (`berekeningen/voeding.js`: natrium mg × 2,5 / 1000 = zout g) en in de
  interface gemarkeerd als "berekend uit natrium". Zo blijft de NEVO-data
  zelf ongewijzigd.
- NEVO-producten zijn **niet aanpasbaar**. "Aanpassen" maakt een eigen
  product (`bron: 'eigen'`, `gebaseerdOpNevo: <code>`) dat in de app
  duidelijk als eigen product wordt getoond, niet als NEVO.
- Porties bij NEVO-producten zijn eigen aanvullingen van de gebruiker en
  worden apart bewaard (tabel `porties`), niet in `nevo.json`.
- Het originele RIVM-bestand komt NIET in de repository; alleen het
  omgezette `nevo.json`.
- Verwachte grootte: enkele honderden kB [schatting].
- Nieuwe NEVO-versie: script opnieuw draaien met het nieuwe bestand en het
  versienummer in de bronvermelding aanpassen (staat in de README).

## Publiceren
- GitHub Action `.github/workflows/publiceren.yml`: bij elke wijziging op
  `main` → tests → bouwen → publiceren op GitHub Pages.
- Faalt een test, dan wordt er niet gepubliceerd.
- Vite `base` staat op `/phoenix/` (de naam van de repository).
