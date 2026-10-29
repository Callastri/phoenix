// Het gegevensmodel: welke tabellen er zijn, per versie.
//
// ZO VOEG JE EEN NIEUWE VERSIE TOE (alleen samen met een test!):
// 1. Voeg onderaan een nieuw blok toe met "versie" één hoger.
// 2. Zet onder "tabellen" ALLE tabellen (ook de ongewijzigde).
// 3. Zet onder "migratie" per tabel een functie die één oude regel omzet
//    naar een nieuwe regel. De functie krijgt een kopie en geeft de nieuwe regel terug.
//    Laat het "id" altijd ongemoeid.
// Deze migratie wordt gebruikt voor de database op het toestel ÉN voor oude back-ups.
//
// Tekst bij "tabellen": eerst de sleutel, daarna de velden waarop gezocht wordt.
//   '++id'   = automatisch volgnummer
//   '&datum' = mag maar één keer voorkomen
//   '[a+b]'  = zoeken op twee velden tegelijk

export const VERSIES = [
  {
    versie: 1,
    tabellen: {
      producten: '++id, barcode, naam',
      porties: '++id, nevoCode',
      recepten: '++id, naam',
      dagboek: '++id, datum, [datum+maaltijd]',
      gewicht: '++id, &datum',
      bewegingssoorten: '++id',
      beweging: '++id, datum',
      instellingen: '&sleutel'
    },
    migratie: null
  },
  {
    // Versie 2 (fase 2): nieuwe tabel "favorieten".
    // Bestaande gegevens hoeven niet omgezet te worden.
    versie: 2,
    tabellen: {
      producten: '++id, barcode, naam',
      porties: '++id, nevoCode',
      recepten: '++id, naam',
      dagboek: '++id, datum, [datum+maaltijd]',
      gewicht: '++id, &datum',
      bewegingssoorten: '++id',
      beweging: '++id, datum',
      instellingen: '&sleutel',
      favorieten: '&sleutel'
    },
    migratie: null
  }
  // Voorbeeld voor later:
  // {
  //   versie: 3,
  //   tabellen: { ...alle tabellen... },
  //   migratie: {
  //     dagboek: (regel) => ({ ...regel, notitie: '' })
  //   }
  // }
]

// De nieuwste versie van het gegevensmodel.
export const HUIDIGE_VERSIE = VERSIES[VERSIES.length - 1].versie

// De namen van alle tabellen in de nieuwste versie.
export const TABELNAMEN = Object.keys(VERSIES[VERSIES.length - 1].tabellen)
