# Eisen per fase

Elke fase eindigt met: samenvatting, testinstructies voor iPhone, akkoord
van de eigenaar. Pas daarna start de volgende fase.

## Fase 0 — Documenten
- [ ] CLAUDE.md, VISIE.md, EISEN.md, ARCHITECTUUR.md, PRIVACY.md
- [ ] Akkoord van de eigenaar, inclusief de open vragen onderaan

## Fase 1 — Basis
- [ ] Projectopzet: Vite, Dexie, Vitest, mappenstructuur (zie ARCHITECTUUR.md)
- [ ] Automatisch publiceren naar GitHub Pages via GitHub Actions
- [ ] Opslag met schemaversie en migratiemechanisme (+ test)
- [ ] Navigatie onderaan: Dagboek · Gewicht · Beweging · Overzicht · Meer
      (in fase 1 alleen Dagboek en Meer actief)
- [ ] Dagboek: dag kiezen (vorige/volgende/vandaag), vier maaltijden
- [ ] Handmatig eten invoeren: naam + waarden per 100 g/ml + hoeveelheid
- [ ] Item aanpassen en verwijderen
- [ ] Dagtotalen (kcal, eiwit, koolhydraten, vet, vezels, suiker, zout)
- [ ] Invoercontrole (geen negatieve waarden, geldige datum, enz.)
- [ ] Back-up exporteren als JSON via deelmenu (iPhone: Bewaar in Bestanden)
- [ ] Back-up importeren met controle, met test voor export → import
- [ ] CSV-export
- [ ] Datum laatste back-up tonen + herinnering na 7 dagen
- [ ] Alle gegevens wissen (met bevestiging: typ "WISSEN")
- [ ] iPhone-uitleg "Zet op beginscherm" bij eerste gebruik in Safari
- [ ] `navigator.storage.persist()` aanvragen en de uitkomst tonen in Meer
- [ ] Licht/donker thema
- [ ] Tests: dagtotalen, hoeveelheid → gram, invoercontrole, back-up

## Fase 2 — NEVO, zoeken, recent, favorieten
- [ ] NEVO omzetten naar compact JSON (script in `scripts/`), meegebundeld
- [ ] Bronvermelding NEVO in de app (scherm "Over")
- [ ] Zoeken op naam (zonder accenten/hoofdletters te onderscheiden)
- [ ] Hoeveelheid in gram, ml of portie (porties per product)
- [ ] Recent gebruikt en favorieten
- [ ] Maaltijd van gisteren kopiëren naar vandaag
- [ ] Eigen product toevoegen; NEVO-product aanpassen (lokale kopie)
- [ ] Tests: portieberekening, zoeken/normaliseren, kopiëren

## Fase 3 — Barcode + Open Food Facts
- [ ] Barcode scannen met camera (werkt op iPhone én Android)
- [ ] Ook handmatig barcodenummer kunnen intypen
- [ ] Opzoeken bij Open Food Facts; alleen het barcodenummer gaat mee
- [ ] Gevonden product lokaal bewaren (daarna offline beschikbaar)
- [ ] Niet gevonden → eigen product aanmaken met die barcode
- [ ] Bronvermelding Open Food Facts (ODbL)
- [ ] Tests: omzetten Open Food Facts-antwoord naar ons formaat
      (ontbrekend blijft leeg)

## Fase 4 — Doelen, gewicht, beweging
- [ ] Dagdoel kcal en macro's zelf instellen (gram of % van kcal)
- [ ] Optionele hulp: Mifflin-St Jeor × activiteitsniveau, met tempo
- [ ] Duidelijke waarschuwing bij onrealistisch laag doel (zie open vraag 4)
- [ ] Gewicht: invoeren (datum + kg), lijst, grafiek, 7-daags gemiddelde
- [ ] Beweging: soort (uit lijst), duur, optioneel afstand en notitie
- [ ] Soorten beweging + MET-waarden als gegevenslijst, uitbreidbaar
- [ ] Geschatte kcal = MET × gewicht (kg) × uren
- [ ] Instelling "beweging optellen bij dagbudget" (standaard UIT, met uitleg)
- [ ] Tests: BMR, TDEE, doelwaarschuwing, MET, 7-daags gemiddelde

## Fase 5 — Overzicht, recepten, offline, afwerking
- [ ] Weekoverzicht: gemiddelde inname, gewichtstrend, beweging
- [ ] Grafieken (eenvoudige SVG, geen externe bibliotheek)
- [ ] Recepten: ingrediënten + aantal porties → waarden per portie
- [ ] PWA: manifest, icoon, service worker, volledig offline
- [ ] Toegankelijkheid: voldoende contrast, grote tikvlakken (≥ 44 px)
- [ ] README afgewerkt
- [ ] Tests: recepten, weekgemiddelden

## MVP-checklist (klaar als alles klopt)
- [ ] Ik kan eten toevoegen, aanpassen en verwijderen.
- [ ] Ik vind gewone voeding via zoeken en verpakte producten via barcode.
- [ ] Ik zie mijn dagtotalen tegenover mijn doel.
- [ ] Ik kan gewicht en beweging registreren en de trend bekijken.
- [ ] Ik kan een back-up maken en die op een ander toestel terugzetten.
- [ ] De app werkt offline na installatie, op iPhone en Android.
- [ ] Er gaan geen persoonlijke gegevens naar externe diensten.
- [ ] De berekeningen en gegevensmigraties zijn getest.

## Open vragen voor de eigenaar (graag beantwoorden bij akkoord)
1. **Zout uit NEVO.** NEVO geeft natrium (mg), geen zout. De wettelijke
   omrekening (EU-verordening 1169/2011) is zout = natrium × 2,5.
   Voorstel: zo omrekenen en dat vermelden. Dit is een vaste formule,
   geen schatting. Akkoord?
   **Status: open** — eigenaar vroeg of NEVO natrium vermeldt (ja).
2. **Dagboek bewaart een momentopname.** Voorstel: bij toevoegen bewaart
   het dagboek de voedingswaarden van dat moment. Pas je later een product
   aan, dan veranderen oude dagen niet. Akkoord?
   **Besluit: akkoord.**
3. **Mifflin-St Jeor** heeft een formule voor "man" en "vrouw". Voorstel:
   de keuze heet "formule: man / vrouw" en is alleen nodig voor de
   doelhulp. Akkoord?
   **Besluit: akkoord.**
4. **"Onrealistisch laag" doel.** Voorstel: waarschuwing als het doel onder
   het berekende rustmetabolisme (BMR) ligt, of onder 1200 kcal. Geen
   blokkade, alleen een duidelijke melding. Akkoord?
   **Besluit: akkoord.**
5. **NEVO-bestand.** Zie PRIVACY.md/ARCHITECTUUR.md: de voorwaarden moeten
   nog gecontroleerd worden en mogelijk moet je het bestand zelf
   downloaden bij RIVM. Dit is pas nodig in fase 2.
   **Status: open** — bronnen gekregen (nevo-online.rivm.nl, rivm.nl),
   maar die sites zijn nog niet bereikbaar vanuit de ontwikkelomgeving.
