// Berekeningen voor voeding: hoeveelheden, waarden per regel en totalen.
//
// Belangrijke regel: een ontbrekende waarde (null) is ONBEKEND, niet 0.
// - Een regel met een onbekende waarde geeft voor die stof ook null.
// - Een totaal telt alleen de bekende waarden op en krijgt "onvolledig: true"
//   als er minstens één onbekende waarde bij zat.

import { SLEUTELS } from '../gegevens/voedingsstoffen.js'

// Rekent een hoeveelheid om naar gram of ml (de "basis" waarmee we rekenen).
// In fase 1 kan dat alleen 'g' of 'ml'; porties komen in fase 2.
// In:  hoeveelheid (getal) en eenheid ('g' of 'ml')
// Uit: hoeveelheid in gram of ml
export function basisHoeveelheid(hoeveelheid, eenheid) {
  if (eenheid === 'g' || eenheid === 'ml') return hoeveelheid
  throw new Error(`Onbekende eenheid: ${eenheid}`)
}

// Berekent de voedingswaarden voor een bepaalde hoeveelheid.
// In:  waarden per 100 g/ml (zoals { kcal: 200, eiwit: null, ... }) en hoeveelheid in g/ml
// Uit: waarden voor die hoeveelheid; onbekend blijft null
export function waardenVoorHoeveelheid(waardenPer100, hoeveelheid) {
  const uitkomst = {}
  for (const sleutel of SLEUTELS) {
    const per100 = waardenPer100 ? waardenPer100[sleutel] : null
    uitkomst[sleutel] = per100 === null || per100 === undefined ? null : (per100 * hoeveelheid) / 100
  }
  return uitkomst
}

// Telt een lijst waarden op.
// In:  lijst zoals [{ kcal: 100, eiwit: 2 }, { kcal: 50, eiwit: null }]
// Uit: per stof { totaal, onvolledig }, bijvoorbeeld
//      { kcal: { totaal: 150, onvolledig: false }, eiwit: { totaal: 2, onvolledig: true } }
//      Als ALLE waarden voor een stof onbekend zijn, is het totaal null.
export function telOp(lijst) {
  const uitkomst = {}
  for (const sleutel of SLEUTELS) {
    let totaal = 0
    let aantalBekend = 0
    let onvolledig = false
    for (const waarden of lijst) {
      const waarde = waarden[sleutel]
      if (waarde === null || waarde === undefined) {
        onvolledig = true
      } else {
        totaal += waarde
        aantalBekend += 1
      }
    }
    uitkomst[sleutel] = {
      totaal: lijst.length > 0 && aantalBekend === 0 ? null : totaal,
      onvolledig
    }
  }
  return uitkomst
}

// De waarden van één dagboekregel (voor de hoeveelheid die je gegeten hebt).
// In:  dagboekregel met "waarden" (per 100) en "gram" (hoeveelheid in g/ml)
export function waardenVanRegel(regel) {
  return waardenVoorHoeveelheid(regel.waarden, regel.gram)
}

// Het totaal van een lijst dagboekregels (bijvoorbeeld een hele dag).
export function totaalVanRegels(regels) {
  return telOp(regels.map(waardenVanRegel))
}

// Totalen per maaltijd.
// In:  dagboekregels en de lijst maaltijdsleutels
// Uit: { ontbijt: <totaal>, middag: <totaal>, ... }
export function totaalPerMaaltijd(regels, maaltijdSleutels) {
  const uitkomst = {}
  for (const maaltijd of maaltijdSleutels) {
    uitkomst[maaltijd] = totaalVanRegels(regels.filter((r) => r.maaltijd === maaltijd))
  }
  return uitkomst
}
