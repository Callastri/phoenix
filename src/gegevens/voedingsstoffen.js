// De voedingsstoffen die de app bijhoudt, in de volgorde waarin ze getoond worden.
// Alle waarden in de app zijn per 100 g of per 100 ml.
// "sleutel" is de naam in de opslag; verander die niet zonder migratie.
// "naam" en "eenheid" mag je vrij aanpassen: dat is alleen wat je op het scherm ziet.

export const VOEDINGSSTOFFEN = [
  { sleutel: 'kcal', naam: 'Energie', eenheid: 'kcal', decimalen: 0 },
  { sleutel: 'eiwit', naam: 'Eiwit', eenheid: 'g', decimalen: 1 },
  { sleutel: 'koolhydraten', naam: 'Koolhydraten', eenheid: 'g', decimalen: 1 },
  { sleutel: 'vet', naam: 'Vet', eenheid: 'g', decimalen: 1 },
  { sleutel: 'vezels', naam: 'Vezels', eenheid: 'g', decimalen: 1 },
  { sleutel: 'suiker', naam: 'waarvan suikers', eenheid: 'g', decimalen: 1 },
  { sleutel: 'zout', naam: 'Zout', eenheid: 'g', decimalen: 2 }
]

// Alleen de sleutels, bijvoorbeeld ['kcal', 'eiwit', ...].
export const SLEUTELS = VOEDINGSSTOFFEN.map((stof) => stof.sleutel)
