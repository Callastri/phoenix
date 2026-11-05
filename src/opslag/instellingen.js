// Instellingen lezen en bewaren (eenvoudige sleutel + waarde).
// Bekende sleutels: laatsteBackup, installUitlegGezien, profiel, doelen, bewegingOptellen.

import { db } from './db.js'
import { controleerInstelling } from '../berekeningen/controle.js'
import { OngeldigeInvoer } from './fouten.js'

// Leest een instelling. Bestaat die nog niet, dan krijg je "standaard" terug.
export async function leesInstelling(sleutel, standaard = null) {
  const rij = await db.instellingen.get(sleutel)
  return rij ? rij.waarde : standaard
}

// Bewaart een instelling (overschrijft de oude waarde).
// Gooit OngeldigeInvoer als de waarde niet klopt (bv. een onmogelijke lengte).
export async function bewaarInstelling(sleutel, waarde) {
  const fouten = controleerInstelling({ sleutel, waarde })
  if (fouten.length > 0) throw new OngeldigeInvoer(fouten)
  await db.instellingen.put({ sleutel, waarde })
}
