# Privacy

## Kernregel
Geen persoonlijke gegevens verlaten het toestel. Alles staat in IndexedDB
in de browser van de gebruiker.

## De enige uitzondering: Open Food Facts
- Bij het opzoeken van een barcode stuurt de app **alleen het
  barcodenummer** naar `world.openfoodfacts.org`.
- Wat Open Food Facts daarbij onvermijdelijk ziet (zoals bij elke website):
  je IP-adres en het type browser. Er gaat geen naam, gewicht, dagboek of
  andere persoonsgegevens mee.
- Eenmaal gevonden producten worden lokaal bewaard; dezelfde barcode
  opnieuw scannen gebeurt zonder netwerk.
- Het netwerkverzoek staat op één plek in de code:
  `src/diensten/openfoodfacts.js`.
- De app vermeldt dit in het scherm "Over" en vlak bij de scanknop.

## Wat er dus NIET is
- Geen analytics, cookies voor tracking, advertentienetwerken,
  crashrapportage, externe lettertypes of CDN's.
- Geen account, geen server, geen synchronisatie.
- Een Content-Security-Policy in `index.html` die netwerkverzoeken alleen
  toestaat naar de eigen site en naar `world.openfoodfacts.org`. Zo kan
  ook een fout in de code of een library niet stiekem iets versturen.
- GitHub Pages (de hosting) ziet, zoals elke webserver, dat iemand de app
  laadt (IP-adres). Het ziet geen ingevoerde gegevens.

## Controle van gegevens
- **Bij invoer:** getallen moeten geldig en niet negatief zijn; redelijke
  bovengrenzen (bv. gewicht 20–400 kg, duur max. 24 uur, waarden per 100 g
  max. 100 g en max. 900 kcal); datums geldig. Fouten worden in gewone taal
  getoond.
- **Bij import:** dezelfde controles op elk record, plus controle van
  structuur en `schemaVersie`. Een ongeldig bestand verandert niets.
- **Antwoorden van Open Food Facts** worden ook gecontroleerd; onbruikbare
  of ontbrekende waarden worden `null`.

## Back-up en herstel
- Export en herstel worden **beide** getest: een automatische test maakt
  gegevens aan, exporteert, wist, importeert en vergelijkt.
- Het back-upbestand is niet versleuteld. Bewaar het op een plek die je
  vertrouwt (bv. iCloud Drive). De app zegt dit bij het exporteren.

## Gegevensmodel-updates
- Elke wijziging van het gegevensmodel heeft een migratie die bestaande
  gegevens behoudt, met een test (zie ARCHITECTUUR.md).

## Bronnen en voorwaarden
- **NEVO (RIVM)** — gecontroleerd op 29-10-2026 in "Voorwaarden voor gebruik
  NEVO-online versie 2025/9.0". Wat dat voor de app betekent:
  - Gebruik is gratis; er mag ook geen geld voor gevraagd worden. ✔ past.
  - Alleen gebruik **in ongewijzigde vorm**, met bron en versienummer.
    → we nemen kolommen ongewijzigd over; NEVO-producten zijn in de app niet
    te bewerken; zout is een aparte, gemarkeerde berekening.
  - **Aanvullingen** mogen, als direct duidelijk is dat het aanvullingen zijn.
    → eigen producten en eigen porties worden zichtbaar als "eigen" getoond.
  - Bronvermelding voor berekende uitkomsten: "Gebaseerd op gegevens van
    NEVO-online versie 2025/9.0, RIVM, Bilthoven en andere gegevens".
  - Bij een nieuwe NEVO-versie: oude versie vervangen (README legt uit hoe).
  - RIVM is niet aansprakelijk voor fouten; dit staat in het scherm "Over".
  - **Bevestigd door het RIVM** (antwoord van nevo@rivm.nl, ontvangen
    30-10-2026, bewaard door de eigenaar): "Dit mag allemaal." De vraag ging over:
    1. een selectie uit het databestand ongewijzigd meeleveren met de app,
       ook openbaar in de GitHub-repository (niet het originele bestand);
    2. zout tonen, berekend als natrium × 2,5 en zo gemarkeerd;
    3. eigen producten op basis van NEVO, duidelijk als "eigen" getoond;
    4. de bronvermelding "Gebaseerd op gegevens van NEVO-online versie
       2025/9.0, RIVM, Bilthoven en andere gegevens" met link naar NEVO-online.
- **Open Food Facts:** gegevens vallen onder de Open Database License
  (ODbL). De app vermeldt de bron en de licentie.
