// De maaltijden in het dagboek, in volgorde van de dag.
// "sleutel" is de naam in de opslag; verander die niet zonder migratie.
// "naam" is wat je op het scherm ziet en mag je vrij aanpassen.

export const MAALTIJDEN = [
  { sleutel: 'ontbijt', naam: 'Ontbijt' },
  { sleutel: 'middag', naam: 'Middag' },
  { sleutel: 'avond', naam: 'Avond' },
  { sleutel: 'tussendoor', naam: 'Tussendoor' }
]

export const MAALTIJD_SLEUTELS = MAALTIJDEN.map((m) => m.sleutel)

// Geeft de schermnaam van een maaltijd, bijvoorbeeld 'middag' → 'Middag'.
export function maaltijdNaam(sleutel) {
  const maaltijd = MAALTIJDEN.find((m) => m.sleutel === sleutel)
  return maaltijd ? maaltijd.naam : sleutel
}
