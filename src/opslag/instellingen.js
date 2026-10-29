// Instellingen lezen en bewaren (eenvoudige sleutel + waarde).
// Bekende sleutels: laatsteBackup, installUitlegGezien
// (later: profiel, doelen, bewegingOptellen).

import { db } from './db.js'

// Leest een instelling. Bestaat die nog niet, dan krijg je "standaard" terug.
export async function leesInstelling(sleutel, standaard = null) {
  const rij = await db.instellingen.get(sleutel)
  return rij ? rij.waarde : standaard
}

// Bewaart een instelling (overschrijft de oude waarde).
export async function bewaarInstelling(sleutel, waarde) {
  await db.instellingen.put({ sleutel, waarde })
}
