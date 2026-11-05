// Beweging: geschatte verbrande kcal met MET-waarden.
// Dit is een RUWE SCHATTING: het echte verbruik hangt af van tempo, conditie,
// lichaamsbouw en meer. De app zegt dat er ook bij.

import { gewichtOpDatum } from './gewicht.js'

// Geschatte kcal = MET × gewicht (kg) × duur (uren).
// Uit: kcal, of null als het gewicht onbekend is.
export function kcalVoorActiviteit(met, kg, minuten) {
  if (kg === null || kg === undefined) return null
  return met * kg * (minuten / 60)
}

// Totaal geschatte kcal van een lijst activiteiten, met het gewicht dat het
// dichtst bij de datum van elke activiteit ligt.
// Uit: { totaal, onvolledig } — onvolledig als er geen gewicht bekend is.
export function totaalBewegingKcal(activiteiten, metingen) {
  let totaal = 0
  let onvolledig = false
  for (const a of activiteiten) {
    const kcal = kcalVoorActiviteit(a.met, gewichtOpDatum(metingen, a.datum), a.minuten)
    if (kcal === null) onvolledig = true
    else totaal += kcal
  }
  return { totaal, onvolledig }
}
