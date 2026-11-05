// Gewichtsmetingen bewaren. Eén meting per datum: een nieuwe meting op dezelfde
// datum vervangt de oude.

import { db } from './db.js'
import { controleerGewicht } from '../berekeningen/controle.js'
import { OngeldigeInvoer } from './fouten.js'

// Bewaart een meting. Uit: het volgnummer.
export async function bewaarGewicht(datum, kg) {
  const meting = { datum, kg }
  const fouten = controleerGewicht(meting)
  if (fouten.length > 0) throw new OngeldigeInvoer(fouten)
  return db.transaction('rw', db.gewicht, async () => {
    const bestaand = await db.gewicht.where('datum').equals(datum).first()
    if (bestaand) {
      await db.gewicht.put({ ...meting, id: bestaand.id })
      return bestaand.id
    }
    return db.gewicht.add(meting)
  })
}

// Verwijdert een meting.
export async function verwijderGewicht(id) {
  await db.gewicht.delete(id)
}

// Alle metingen, oudste eerst.
export async function alleGewichten() {
  return db.gewicht.orderBy('datum').toArray()
}
