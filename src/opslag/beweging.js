// Activiteiten en eigen soorten beweging bewaren.
// Een activiteit bewaart een kopie van de naam en MET-waarde van de soort, zodat
// oude activiteiten niet veranderen als je de lijst met soorten aanpast.

import { db } from './db.js'
import { controleerBeweging, controleerBewegingssoort } from '../berekeningen/controle.js'
import { OngeldigeInvoer } from './fouten.js'
import { verschuifDag } from '../berekeningen/datum.js'

// Maakt een activiteit klaar om op te slaan en controleert die.
function maakActiviteit(invoer) {
  const activiteit = {
    datum: invoer.datum,
    soortId: invoer.soortId,
    soortNaam: invoer.soortNaam,
    met: invoer.met,
    minuten: invoer.minuten
  }
  if (invoer.afstandKm !== null && invoer.afstandKm !== undefined) activiteit.afstandKm = invoer.afstandKm
  const notitie = typeof invoer.notitie === 'string' ? invoer.notitie.trim() : ''
  if (notitie) activiteit.notitie = notitie
  const fouten = controleerBeweging(activiteit)
  if (fouten.length > 0) throw new OngeldigeInvoer(fouten)
  return activiteit
}

export async function voegActiviteitToe(invoer) {
  return db.beweging.add(maakActiviteit(invoer))
}

export async function werkActiviteitBij(id, invoer) {
  await db.beweging.put({ ...maakActiviteit(invoer), id })
}

export async function verwijderActiviteit(id) {
  await db.beweging.delete(id)
}

// Activiteiten van één dag.
export async function activiteitenVanDag(datum) {
  return db.beweging.where('datum').equals(datum).toArray()
}

// Activiteiten van de laatste "dagen" dagen tot en met "totDatum", nieuwste eerst.
export async function recenteActiviteiten(totDatum, dagen = 30) {
  const vanaf = verschuifDag(totDatum, -(dagen - 1))
  const lijst = await db.beweging.where('datum').between(vanaf, totDatum, true, true).toArray()
  return lijst.sort((a, b) => b.datum.localeCompare(a.datum) || b.id - a.id)
}

// --- Eigen soorten beweging --------------------------------------------------

export async function eigenSoorten() {
  return db.bewegingssoorten.toArray()
}

export async function bewaarEigenSoort(naam, met) {
  const soort = { naam: typeof naam === 'string' ? naam.trim() : naam, met }
  const fouten = controleerBewegingssoort(soort)
  if (fouten.length > 0) throw new OngeldigeInvoer(fouten)
  return db.bewegingssoorten.add(soort)
}

export async function verwijderEigenSoort(id) {
  await db.bewegingssoorten.delete(id)
}
