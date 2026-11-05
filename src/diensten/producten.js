// Eén plek om producten te vinden, ongeacht waar ze vandaan komen:
// de NEVO-tabel, je eigen producten, of gescande producten (Open Food Facts).

import { laadNevo } from './nevo.js'
import { haalBarcodeOp } from './openfoodfacts.js'
import {
  alleMijnProducten, productMetId, portiesVoorNevo, productMetBarcode, bewaarGescandProduct
} from '../opslag/producten.js'
import { zoekProducten } from '../berekeningen/zoeken.js'

// Zet een product uit de database (eigen of gescand) om naar dezelfde vorm als een NEVO-product.
export function dbNaarProduct(rij) {
  return {
    ref: { soort: rij.bron === 'off' ? 'off' : 'eigen', id: rij.id },
    bron: rij.bron,
    naam: rij.naam,
    merk: rij.merk ?? '',
    synoniem: rij.merk ?? '',
    barcode: rij.barcode ?? null,
    eenheid: rij.eenheid,
    waarden: rij.waarden,
    zoutBerekend: false,
    porties: rij.porties ?? [],
    gebaseerdOpNevo: rij.gebaseerdOpNevo ?? null,
    aangepast: rij.aangepast === true
  }
}

// Korte tekst over de herkomst, voor op het scherm.
export function bronTekst(product) {
  if (product.bron === 'nevo') return 'NEVO'
  if (product.bron === 'off') {
    const merk = product.merk ? `${product.merk} · ` : ''
    return `${merk}Open Food Facts${product.aangepast ? ' (door jou aangepast)' : ''}`
  }
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
  if (ref.soort === 'eigen' || ref.soort === 'off') {
    const rij = await productMetId(ref.id)
    const verwachteBron = ref.soort === 'off' ? 'off' : 'eigen'
    return rij && rij.bron === verwachteBron ? dbNaarProduct(rij) : null
  }
  return null
}

// Zoekt in je eigen en gescande producten én de NEVO-tabel.
// Bij gelijke score staan je eigen producten eerst.
export async function zoekAlles(zoekterm, max = 50) {
  const [nevo, mijn] = await Promise.all([laadNevo(), alleMijnProducten()])
  const alles = [...mijn.map(dbNaarProduct), ...(nevo ? nevo.producten : [])]
  return zoekProducten(alles, zoekterm, max)
}

// Al je eigen en gescande producten, op naam gesorteerd.
export async function mijnProductenGesorteerd() {
  const mijn = await alleMijnProducten()
  return mijn.map(dbNaarProduct).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
}

// Zoekt een product bij een barcode.
// 1. Eerst op het toestel (eerder gescand of eigen product met die barcode): werkt offline.
// 2. Anders bij Open Food Facts; een gevonden product wordt op het toestel bewaard.
// Uit: { status: 'gevonden', product, opmerkingen }
//      of { status: 'niet-gevonden' | 'geen-verbinding' | 'fout' }
export async function zoekOpBarcode(barcode) {
  const lokaal = await productMetBarcode(barcode)
  if (lokaal) return { status: 'gevonden', product: dbNaarProduct(lokaal), opmerkingen: [] }

  const online = await haalBarcodeOp(barcode)
  if (online.status !== 'gevonden') return online
  const id = await bewaarGescandProduct(online.product)
  return { status: 'gevonden', product: await haalProduct({ soort: 'off', id }), opmerkingen: online.opmerkingen }
}

// Maakt een product om een bestaande dagboekregel mee aan te passen.
// Naam en waarden komen uit de regel (momentopname); porties en herkomst uit het
// huidige product, als dat nog bestaat.
export async function productVoorRegel(regel) {
  const huidig = await haalProduct(regel.productRef)
  const standaardBron = { nevo: 'nevo', off: 'off' }[regel.productRef.soort] ?? 'eigen'
  return {
    ref: regel.productRef,
    bron: huidig?.bron ?? standaardBron,
    naam: regel.naam,
    merk: huidig?.merk ?? '',
    synoniem: '',
    eenheid: regel.eenheid === 'portie' ? regel.basisEenheid : regel.eenheid,
    waarden: regel.waarden,
    zoutBerekend: huidig?.zoutBerekend ?? false,
    porties: huidig?.porties ?? [],
    gebaseerdOpNevo: huidig?.gebaseerdOpNevo ?? null,
    aangepast: huidig?.aangepast ?? false
  }
}
