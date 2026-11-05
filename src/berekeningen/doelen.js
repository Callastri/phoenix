// Doelen: rustverbruik (Mifflin-St Jeor), dagverbruik, voorgesteld doel,
// waarschuwingen, en het dagbudget met of zonder beweging.

import { MIN_DOEL_KCAL, KCAL_PER_KG } from '../gegevens/drempels.js'

// Kcal per gram, voor het omrekenen van procenten naar grammen.
export const KCAL_PER_GRAM = { eiwit: 4, koolhydraten: 4, vet: 9 }

// Leeftijd in jaren uit het geboortejaar (kan 1 jaar afwijken; voor de formule genoeg).
export function leeftijd(geboortejaar, nu = new Date()) {
  return nu.getFullYear() - geboortejaar
}

// Rustverbruik (BMR) volgens Mifflin-St Jeor, in kcal per dag.
// In:  { kg, lengteCm, leeftijd, formule: 'man' | 'vrouw' }
// man:   10 × kg + 6,25 × cm − 5 × leeftijd + 5
// vrouw: 10 × kg + 6,25 × cm − 5 × leeftijd − 161
export function rustverbruik({ kg, lengteCm, leeftijd: jaren, formule }) {
  const basis = 10 * kg + 6.25 * lengteCm - 5 * jaren
  if (formule === 'man') return basis + 5
  if (formule === 'vrouw') return basis - 161
  throw new Error('Formule moet man of vrouw zijn')
}

// Dagverbruik = rustverbruik × activiteitsfactor.
export function dagverbruik(bmr, factor) {
  return bmr * factor
}

// Voorgesteld doel voor een tempo in kg per week (negatief = afvallen).
// 1 kg ≈ 7700 kcal, dus 0,5 kg per week ≈ 550 kcal per dag minder.
export function voorgesteldDoel(tdee, kgPerWeek) {
  return Math.round(tdee + (kgPerWeek * KCAL_PER_KG) / 7)
}

// Waarschuwingen bij een te laag doel. Blokkeert niets; geeft alleen meldingen.
// In:  doel (kcal), en het rustverbruik als dat bekend is (anders null)
// Uit: lijst meldingen in gewone taal
export function doelWaarschuwingen(doelKcal, bmr = null) {
  const meldingen = []
  if (doelKcal === null || doelKcal === undefined) return meldingen
  if (bmr !== null && doelKcal < bmr) {
    meldingen.push(`Dit doel ligt onder je rustverbruik (± ${Math.round(bmr)} kcal): wat je lichaam in rust al nodig heeft. Dat is onrealistisch laag om lang vol te houden.`)
  }
  if (doelKcal < MIN_DOEL_KCAL) {
    meldingen.push(`Een doel onder ${MIN_DOEL_KCAL} kcal per dag is voor de meeste volwassenen te laag. Overleg met een arts of diëtist.`)
  }
  return meldingen
}

// Rekent een percentage van het kcal-doel om naar grammen.
// Voorbeeld: 30% vet bij 2000 kcal → 600 kcal / 9 = 66,7 g
export function gramUitProcent(kcal, procent, stof) {
  return (kcal * procent) / 100 / KCAL_PER_GRAM[stof]
}

// Rekent grammen om naar een percentage van het kcal-doel.
export function procentUitGram(kcal, gram, stof) {
  return (gram * KCAL_PER_GRAM[stof] * 100) / kcal
}

// Het budget voor een dag.
// In:  doel (kcal of null), verbrande kcal door beweging (of null), en of beweging meetelt
// Uit: { budget, bewegingErbij } — budget is null als er geen doel is
export function dagBudget(doelKcal, bewegingKcal, bewegingOptellen) {
  if (doelKcal === null || doelKcal === undefined) return { budget: null, bewegingErbij: 0 }
  const erbij = bewegingOptellen && bewegingKcal ? bewegingKcal : 0
  return { budget: doelKcal + erbij, bewegingErbij: erbij }
}
