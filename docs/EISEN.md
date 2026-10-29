# Eisen per fase

Elke fase eindigt met: samenvatting, testinstructies voor iPhone, akkoord
van de eigenaar. Pas daarna start de volgende fase.

## Fase 0 — Documenten
- [x] CLAUDE.md, VISIE.md, EISEN.md, ARCHITECTUUR.md, PRIVACY.md
- [x] Akkoord van de eigenaar, inclusief de open vragen onderaan

## Fase 1 — Basis
- [x] Projectopzet: Vite, Dexie, Vitest, mappenstructuur (zie ARCHITECTUUR.md)
- [x] Automatisch publiceren naar GitHub Pages via GitHub Actions *(werkt zodra Pages aanstaat)*
- [x] Opslag met schemaversie en migratiemechanisme (+ test)
- [x] Navigatie onderaan: Dagboek · Gewicht · Beweging · Overzicht · Meer
      (in fase 1 alleen Dagboek en Meer actief)
- [x] Dagboek: dag kiezen (vorige/volgende/vandaag), vier maaltijden
- [x] Handmatig eten invoeren: naam + waarden per 100 g/ml + hoeveelheid
- [x] Item aanpassen en verwijderen
- [x] Dagtotalen (kcal, eiwit, koolhydraten, vet, vezels, suiker, zout)
- [x] Invoercontrole (geen negatieve waarden, geldige datum, enz.)
- [x] Back-up exporteren als JSON via deelmenu (iPhone: Bewaar in Bestanden) *(nog te testen op iPhone)*
- [x] Back-up importeren met controle, met test voor export → import
- [x] CSV-export
- [x] Datum laatste back-up tonen + herinnering na 7 dagen
- [x] Alle gegevens wissen (met bevestiging: typ "WISSEN")
- [x] iPhone-uitleg "Zet op beginscherm" bij eerste gebruik in Safari *(nog te testen op iPhone)*
- [x] `navigator.storage.persist()` aanvragen en de uitkomst tonen in Meer *(nog te testen op iPhone)*
- [x] Licht/donker thema
- [x] Tests: dagtotalen, hoeveelheid → gram, invoercontrole, back-up

## Fase 2 — NEVO, zoeken, recent, favorieten
- [x] Script om NEVO om te zetten naar compact JSON (`scripts/nevo-naar-json.js`)
- [ ] Het echte NEVO-bestand omzetten en meeleveren *(wacht op bestand + besluit eigenaar)*
- [x] Bronvermelding: "Gebaseerd op gegevens van NEVO-online versie 2025/9.0,
      RIVM, Bilthoven en andere gegevens" + link naar nevo-online.rivm.nl
- [x] Zoeken op naam (zonder accenten/hoofdletters te onderscheiden)
- [x] Hoeveelheid in gram, ml of portie (porties per product)
- [x] Recent gebruikt en favorieten
- [x] Maaltijd van gisteren kopiëren naar vandaag
- [x] Eigen product toevoegen; NEVO-product "aanpassen" = eigen product
      maken op basis daarvan (NEVO zelf blijft ongewijzigd, zie voorwaarden)
- [x] Eigen porties toevoegen bij NEVO-producten
- [x] Tests: portieberekening, zoeken/normaliseren, kopiëren

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
   **Besluit: zout tonen.** NEVO heeft geen zoutkolom (gecontroleerd); de app
   berekent zout = natrium × 2,5 en markeert dat als berekend.
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
   **Status: voorwaarden gecontroleerd** (zie PRIVACY.md). Nog nodig vóór
   fase 2: het databestand downloaden (formulier op rivm.nl, akkoord met
   de voorwaarden door de eigenaar).
