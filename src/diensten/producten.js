// Eén plek om producten te vinden, ongeacht waar ze vandaan komen:
// de NEVO-tabel of je eigen producten.

import { laadNevo } from './nevo.js'
import { alleEigenProducten, productMetId, portiesVoorNevo } from '../opslag/producten.js'
import { zoekProducten } from '../berekeningen/zoeken.js'

// Zet een eigen product uit de database om naar dezelfde vorm als een NEVO-product.
export function eigenNaarProduct(rij) {
  return {
    ref: { soort: 'eigen', id: rij.id },
    bron: 'eigen',
    naam: rij.naam,
    synoniem: '',
    eenheid: rij.eenheid,
    waarden: rij.waarden,
    zoutBerekend: false,
    porties: rij.porties ?? [],
    gebaseerdOpNevo: rij.gebaseerdOpNevo ?? null
  }
}

// Korte tekst over de herkomst, voor op het scherm.
export function bronTekst(product) {
  if (product.bron === 'nevo') return 'NEVO'
  if (product.gebaseerdOpNevo) return 'Eigen product (gebaseerd op NEVO)'
  return 'Eigen product'
}

// Haalt één product op met een verwijzing ({ soort, id }).
// Bij NEVO-producten komen je eigen porties erbij.
// Uit: het product, of null als het niet (meer) bestaat.
export async function haalProduct(ref) {
  if (!ref) return null
  if (ref.soort === 'nevo') {
    const nevo = await laadNevo()
    const product = nevo?.perCode.get(ref.id)
    if (!product) return null
    const eigenPorties = await portiesVoorNevo(ref.id)
    return { ...product, porties: eigenPorties.map((p) => ({ id: p.id, naam: p.naam, gram: p.gram, eigen: true })) }
  }
  if (ref.soort === 'eigen') {
    const rij = await productMetId(ref.id)
    return rij && rij.bron === 'eigen' ? eigenNaarProduct(rij) : null
  }
  return null
}

// Zoekt in eigen producten én de NEVO-tabel. Eigen producten staan bij gelijke score eerst.
export async function zoekAlles(zoekterm, max = 50) {
  const [nevo, eigen] = await Promise.all([laadNevo(), alleEigenProducten()])
  const alles = [...eigen.map(eigenNaarProduct), ...(nevo ? nevo.producten : [])]
  return zoekProducten(alles, zoekterm, max)
}

// Alle eigen producten, op naam gesorteerd.
export async function eigenProductenGesorteerd() {
  const eigen = await alleEigenProducten()
  return eigen.map(eigenNaarProduct).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
}

// Maakt een product om een bestaande dagboekregel mee aan te passen.
// Naam en waarden komen uit de regel (momentopname); porties en herkomst uit het
// huidige product, als dat nog bestaat.
export async function productVoorRegel(regel) {
  const huidig = await haalProduct(regel.productRef)
  return {
    ref: regel.productRef,
    bron: huidig?.bron ?? (regel.productRef.soort === 'nevo' ? 'nevo' : 'eigen'),
    naam: regel.naam,
    synoniem: '',
    eenheid: regel.eenheid === 'portie' ? regel.basisEenheid : regel.eenheid,
    waarden: regel.waarden,
    zoutBerekend: huidig?.zoutBerekend ?? false,
    porties: huidig?.porties ?? [],
    gebaseerdOpNevo: huidig?.gebaseerdOpNevo ?? null
  }
}
