// Activiteitsniveaus voor de doelhulp (vermenigvuldigd met het rustverbruik).
// Dit zijn de gebruikelijke factoren bij de Mifflin-St Jeor-formule.

export const ACTIVITEITSNIVEAUS = [
  { sleutel: 'zittend', naam: 'Zittend', uitleg: 'Weinig of geen sport, zittend werk', factor: 1.2 },
  { sleutel: 'licht', naam: 'Licht actief', uitleg: '1–3 keer per week sporten of veel lopen', factor: 1.375 },
  { sleutel: 'matig', naam: 'Matig actief', uitleg: '3–5 keer per week sporten', factor: 1.55 },
  { sleutel: 'zeer', naam: 'Zeer actief', uitleg: '6–7 keer per week sporten of zwaar werk', factor: 1.725 },
  { sleutel: 'extreem', naam: 'Extreem actief', uitleg: 'Dagelijks zwaar trainen én lichamelijk werk', factor: 1.9 }
]

// Tempo's voor de doelhulp: kg per week (negatief = afvallen).
export const TEMPOS = [
  { kgPerWeek: -0.5, naam: 'Afvallen, 0,5 kg per week' },
  { kgPerWeek: -0.25, naam: 'Afvallen, 0,25 kg per week' },
  { kgPerWeek: 0, naam: 'Gewicht behouden' },
  { kgPerWeek: 0.25, naam: 'Aankomen, 0,25 kg per week' }
]
