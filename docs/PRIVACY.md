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

## Bronnen en voorwaarden (nog te controleren)
- **NEVO (RIVM):** de app vermeldt "NEVO-online versie [jaar/versie],
  RIVM, Bilthoven". Of het omgezette bestand openbaar in de app (en in deze
  publieke repository) mag staan, moet nog gecontroleerd worden in de
  gebruiksvoorwaarden van RIVM. **Status: niet geverifieerd** — de website
  van RIVM was vanuit de ontwikkelomgeving niet bereikbaar. Dit wordt
  afgerond vóór fase 2.
- **Open Food Facts:** gegevens vallen onder de Open Database License
  (ODbL). De app vermeldt de bron en de licentie.
