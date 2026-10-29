# Voedingsdagboek

Een gratis voedingsdagboek voor je telefoon. Geen advertenties, geen account,
geen tracking. Je gegevens blijven op je eigen toestel.

**De app:** https://callastri.github.io/phoenix/

**Status:** fase 2 — dagboek, zoeken, recent, favorieten, eigen producten en
porties, maaltijd kopiëren, back-up. Barcodes, doelen, gewicht en beweging komen
later (zie [docs/EISEN.md](docs/EISEN.md)).

---

## Installeren op je telefoon

**iPhone (Safari)**
1. Open https://callastri.github.io/phoenix/ in Safari.
2. Tik op de Deel-knop (vierkantje met pijl omhoog; staat die er niet, tik dan eerst op •••).
3. Kies **Zet op beginscherm** en tik op **Voeg toe**.
4. Open de app voortaan via het icoon **Dagboek** op je beginscherm.

Belangrijk: de app in Safari en de app op je beginscherm hebben elk hun
**eigen** gegevens. Zet de app dus eerst op je beginscherm en begin daarna pas.

**Android (Chrome)**
1. Open de link in Chrome.
2. Tik op het menu ⋮ en kies **App installeren** of **Toevoegen aan startscherm**.

## Back-up maken

1. Open de app en tik onderaan op **Meer**.
2. Tik op **Back-up maken**.
3. iPhone: kies **Bewaar in Bestanden** → **iCloud Drive** → **Bewaar**.
   Android: het bestand komt in je map Downloads.

De app herinnert je eraan als je langer dan 7 dagen geen back-up hebt gemaakt.
Het back-upbestand is niet versleuteld: bewaar het op een plek die je vertrouwt.

## Back-up terugzetten (bijvoorbeeld op een nieuwe telefoon)

1. Installeer de app op de nieuwe telefoon (zie hierboven).
2. Ga naar **Meer** → **Kies back-upbestand** en kies het bestand.
3. De app controleert het bestand eerst. Klopt alles, dan vraagt ze of je de
   huidige gegevens wilt **vervangen**. Klopt er iets niet, dan verandert er niets.

## De app bijwerken

Je hoeft niets te doen op je telefoon. Elke keer dat een pull request op GitHub
wordt goedgekeurd (gemerged), zet GitHub de nieuwe versie automatisch online.
Dat duurt een paar minuten. Sluit de app daarna helemaal af en open hem opnieuw.

Zo zie je of het gelukt is: op GitHub → tabblad **Actions** → de bovenste
regel "Publiceren" heeft een groen vinkje. Een rood kruisje betekent dat een
test faalde; dan blijft de oude versie online staan.

---

## NEVO-tabel bijwerken (nieuwe versie van het RIVM)

De voorwaarden van het RIVM vragen om een oude versie te vervangen zodra er een
nieuwe is. Zo doe je dat (of vraag het Claude):

1. Download het nieuwe databestand op
   https://www.rivm.nl/nederlands-voedingsstoffenbestand/gebruik-nevo-online/download-bestand
2. Zet het om in de projectmap:
   `node scripts/nevo-naar-json.js pad/naar/bestand.csv 2025/9.0` (met het nieuwe versienummer)
3. Alleen `public/nevo.json` gaat naar GitHub, nooit het originele RIVM-bestand.

## Zelf dingen aanpassen

Je kunt kleine dingen direct op GitHub aanpassen: open het bestand, klik op het
potloodje, wijzig, en kies onderaan **Create a new branch** en daarna
**Propose changes** en **Create pull request**. Na het mergen staat de wijziging
binnen een paar minuten online.

| Wat wil je veranderen? | Bestand |
|---|---|
| Kleuren (licht en donker thema) | `src/stijl/thema.css` |
| Namen van de maaltijden op het scherm | `src/gegevens/maaltijden.js` (alleen `naam`, niet `sleutel`) |
| Namen van voedingsstoffen op het scherm | `src/gegevens/voedingsstoffen.js` (alleen `naam`) |
| Na hoeveel dagen de back-upherinnering komt | `src/gegevens/drempels.js` |
| Grenzen bij het controleren van invoer | `src/gegevens/drempels.js` |
| Teksten van het dagboek | `src/schermen/dagboek.js` |
| Teksten van het scherm Meer | `src/schermen/meer.js` |
| Teksten van het toevoegscherm (zoeken, recent, favorieten) | `src/schermen/toevoegen.js` |

Pas `sleutel`-waarden en bestanden in `src/opslag/` niet zelf aan: dat zijn de
namen waaronder gegevens bewaard worden. Een wijziging daar heeft een migratie nodig.

## Voor ontwikkelaars

Benodigd: Node.js 22.

```bash
npm install      # afhankelijkheden installeren
npm run dev      # lokaal draaien op http://localhost:5173/phoenix/
npm test         # alle tests
npm run build    # bouwen naar dist/
```

Mappen:
- `src/berekeningen/` — pure rekenfuncties (getest in `tests/`)
- `src/opslag/` — database (IndexedDB via Dexie), schema, migraties, back-up
- `src/schermen/` — de schermen
- `src/onderdelen/` — herbruikbare stukjes (dialogen, meldingen)
- `src/diensten/` — browserfuncties (delen, toestel)
- `src/gegevens/` — aanpasbare lijsten en grenzen

Werkafspraken: [CLAUDE.md](CLAUDE.md). Plannen en keuzes: [docs/](docs/).
