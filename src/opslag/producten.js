// Eigen producten, eigen porties bij NEVO-producten, en favorieten.
//
// NEVO-producten zelf staan NIET in de database (ze komen uit public/nevo.json
// en mogen volgens de voorwaarden niet gewijzigd worden). Wat je zelf toevoegt
// staat hier, en wordt in de app altijd als "eigen" getoond.

import { db } from './db.js'
import { controleerProduct, controleerPortie } from '../berekeningen/controle.js'
import { OngeldigeInvoer } from './fouten.js'

// --- Eigen producten -----------------------------------------------------------

// Alle eigen producten.
export async function alleEigenProducten() {
  return db.producten.filter((p) => p.bron === 'eigen').toArray()
}

// Eén product (eigen of van Open Food Facts) op volgnummer.
export async function productMetId(id) {
  return db.producten.get(id)
}

// Bewaart een eigen product (nieuw of aangepast). Uit: het volgnummer.
// Gooit OngeldigeInvoer als er iets niet klopt.
export async function bewaarEigenProduct(invoer) {
  const product = {
    bron: 'eigen',
    naam: typeof invoer.naam === 'string' ? invoer.naam.trim() : invoer.naam,
    eenheid: invoer.eenheid,
    waarden: invoer.waarden,
    porties: invoer.porties ?? [],
    bijgewerkt: new Date().toISOString()
  }
  if (invoer.gebaseerdOpNevo) product.gebaseerdOpNevo = invoer.gebaseerdOpNevo
  if (invoer.id) product.id = invoer.id
  const fouten = controleerProduct(product)
  if (fouten.length > 0) throw new OngeldigeInvoer(fouten)
  return db.producten.put(product)
}

// Verwijdert een eigen product. Regels in het dagboek blijven bestaan
// (die hebben hun eigen kopie van de voedingswaarden).
export async function verwijderEigenProduct(id) {
  await db.transaction('rw', db.producten, db.favorieten, async () => {
    await db.producten.delete(id)
    await db.favorieten.delete(`eigen:${id}`)
  })
}

// --- Eigen porties bij NEVO-producten -----------------------------------------

// Alle eigen porties bij één NEVO-product.
export async function portiesVoorNevo(nevoCode) {
  return db.porties.where('nevoCode').equals(nevoCode).toArray()
}

// Voegt een eigen portie toe aan een NEVO-product (bijvoorbeeld "1 snee" = 35 g).
export async function voegNevoPortieToe(nevoCode, naam, gram) {
  const portie = { nevoCode, naam: typeof naam === 'string' ? naam.trim() : naam, gram }
  const fouten = controleerPortie(portie, true)
  if (fouten.length > 0) throw new OngeldigeInvoer(fouten)
  return db.porties.add(portie)
}

// Verwijdert een eigen portie.
export async function verwijderNevoPortie(id) {
  await db.porties.delete(id)
}

// --- Favorieten ------------------------------------------------------------------

// Sleutel voor de favorietentabel, bijvoorbeeld 'nevo:123'.
function sleutel(ref) {
  return `${ref.soort}:${ref.id}`
}

// Is dit product een favoriet?
export async function isFavoriet(ref) {
  return (await db.favorieten.get(sleutel(ref))) !== undefined
}

// Zet een product als favoriet aan of uit.
export async function zetFavoriet(ref, aan) {
  if (aan) await db.favorieten.put({ sleutel: sleutel(ref) })
  else await db.favorieten.delete(sleutel(ref))
}

// Alle favorieten als verwijzingen: [{ soort: 'nevo', id: 123 }, ...]
export async function alleFavorieten() {
  const rijen = await db.favorieten.toArray()
  return rijen.map((rij) => {
    const [soort, id] = rij.sleutel.split(':')
    return { soort, id: Number(id) }
  })
}
