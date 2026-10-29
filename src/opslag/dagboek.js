// Dagboekregels lezen, toevoegen, aanpassen en verwijderen.
// Elke regel bewaart een momentopname van de voedingswaarden (per 100 g/ml),
// zodat oude dagen niet veranderen als je later een product aanpast.

import { db } from './db.js'
import { controleerDagboekregel } from '../berekeningen/controle.js'
import { basisHoeveelheid } from '../berekeningen/voeding.js'
import { OngeldigeInvoer } from './fouten.js'

// Maakt een volledige regel klaar om op te slaan, en controleert die.
// Gooit OngeldigeInvoer als er iets niet klopt.
function maakRegel(invoer) {
  const regel = {
    datum: invoer.datum,
    maaltijd: invoer.maaltijd,
    productRef: invoer.productRef ?? null,
    naam: typeof invoer.naam === 'string' ? invoer.naam.trim() : invoer.naam,
    waarden: invoer.waarden,
    hoeveelheid: invoer.hoeveelheid,
    eenheid: invoer.eenheid,
    aangemaakt: invoer.aangemaakt ?? new Date().toISOString()
  }
  try {
    regel.gram = basisHoeveelheid(regel.hoeveelheid, regel.eenheid)
  } catch {
    regel.gram = null
  }
  const fouten = controleerDagboekregel(regel)
  if (fouten.length > 0) throw new OngeldigeInvoer(fouten)
  return regel
}

// Alle regels van één dag, in de volgorde waarin ze zijn toegevoegd.
export async function regelsVanDag(datum) {
  const regels = await db.dagboek.where('datum').equals(datum).toArray()
  return regels.sort((a, b) => a.id - b.id)
}

// Voegt een regel toe. Geeft het nieuwe volgnummer (id) terug.
export async function voegRegelToe(invoer) {
  return db.dagboek.add(maakRegel(invoer))
}

// Past een bestaande regel aan.
export async function werkRegelBij(id, invoer) {
  const oud = await db.dagboek.get(id)
  if (!oud) throw new Error('Deze regel bestaat niet meer.')
  const regel = maakRegel({ ...oud, ...invoer, aangemaakt: oud.aangemaakt })
  await db.dagboek.put({ ...regel, id })
}

// Verwijdert een regel.
export async function verwijderRegel(id) {
  await db.dagboek.delete(id)
}

// Aantal regels in het hele dagboek.
export async function aantalRegels() {
  return db.dagboek.count()
}

// Alle regels (voor CSV-export).
export async function alleRegels() {
  return db.dagboek.toArray()
}
