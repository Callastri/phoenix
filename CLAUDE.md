# CLAUDE.md — werkafspraken

Dit bestand is voor Claude (en andere ontwikkelaars). Lees het vóór elke wijziging.

## Wat dit project is
Een gratis voedingsdagboek als web-app (PWA), zonder advertenties, account of
tracking. Alle gegevens blijven op het toestel van de gebruiker.
Zie `docs/VISIE.md`, `docs/EISEN.md`, `docs/ARCHITECTUUR.md`, `docs/PRIVACY.md`.

## Vaste afspraken (niet veranderen zonder akkoord van de eigenaar)
1. **Documenten zijn leidend.** Wijk niet af van de documenten in `docs/`
   zonder het eerst te vragen. Past een document niet meer, stel dan eerst
   een wijziging van het document voor.
2. **Stack:** Vite + vanilla JavaScript (ES-modules, geen framework),
   Dexie voor IndexedDB, Vitest voor tests, vite-plugin-pwa voor offline.
   Geen TypeScript, geen React/Vue/Svelte, geen CSS-framework.
3. **Geen backend.** Geen server, geen account, geen synchronisatie.
4. **Geen externe scripts of verzoeken**, behalve het opzoeken van een
   barcode bij Open Food Facts. Geen analytics, advertenties,
   crashrapportage, CDN's of externe lettertypes. Alles wordt meegebundeld.
5. **Nooit voedingswaarden verzinnen of schatten.** Ontbrekend = `null`
   en wordt in de interface getoond als "–". Een `null` telt niet mee als 0
   in totalen; een totaal met ontbrekende waarden krijgt een markering.
6. **Gegevensmodel wijzigen = migratie + test.** Bestaande gegevens moeten
   behouden blijven. Verhoog de schemaversie in `src/opslag/db.js`.
7. **Elke berekening heeft tests** in `tests/`. Berekeningen staan in
   `src/berekeningen/` en zijn pure functies (geen DOM, geen database).
8. **Interface in het Nederlands**, mobiel eerst, bruikbaar met één hand
   (belangrijke knoppen onderaan), licht en donker thema via
   `prefers-color-scheme`.
9. **Moet werken op iPhone (Safari) en Android (Chrome).** Test bij twijfel
   eerst of een browserfunctie op iOS Safari bestaat.

## Codestijl
- Eenvoudig boven slim. De eigenaar heeft basiskennis HTML/CSS/JS en wil
  zelf kleine aanpassingen doen.
- Kleine bestanden, één onderwerp per bestand.
- Commentaar in het Nederlands: bovenaan elk bestand wat het doet, en bij
  elke functie kort wat erin gaat en wat eruit komt.
- Namen van bestanden, functies en variabelen in het Nederlands waar dat
  leesbaar blijft (`berekenDagtotaal`, `voegMaaltijdToe`).
- Instelbare dingen (soorten beweging, MET-waarden, drempels) staan in
  `src/gegevens/` als eenvoudige lijsten, niet verstopt in code.

## Werkwijze
- Werk in fases (zie `docs/EISEN.md`). Na elke fase: stoppen, samenvatten,
  en uitleggen hoe de eigenaar het test op de iPhone.
- Vóór elke push: `npm test` en `npm run build` moeten slagen.
- Werk op een aparte branch; de eigenaar keurt via een pull request goed.
- Bij twijfel over een belangrijke keuze: vragen, niet gokken.
- README.md bijhouden in eenvoudig Nederlands.

## Commando's
- `npm install` — afhankelijkheden installeren
- `npm run dev` — lokaal draaien
- `npm test` — alle tests
- `npm run build` — bouwen naar `dist/`
