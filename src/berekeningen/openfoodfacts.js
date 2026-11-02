// Zet een antwoord van Open Food Facts om naar een product voor de app.
//
// Regels:
// - We gebruiken alleen waarden per 100 g/ml (de velden "..._100g").
// - Ontbreekt een waarde, dan blijft die leeg (null). We rekenen niets bij.
// - Een onmogelijke waarde (bv. negatief of meer dan 900 kcal per 100 g) wordt
//   ook leeg gelaten, met een opmerking. Open Food Facts wordt door vrijwilligers gevuld.

import { MAX_PER_100, MAX_NAAM_LENGTE, MAX_HOEVEELHEID } from '../gegevens/drempels.js'

// Welk veld van Open Food Facts bij welke voedingsstof hoort.
export const OFF_VELDEN = {
  kcal: 'energy-kcal_100g',
  eiwit: 'proteins_100g',
  koolhydraten: 'carbohydrates_100g',
  vet: 'fat_100g',
  vezels: 'fiber_100g',
  suiker: 'sugars_100g',
  zout: 'salt_100g'
}

// De velden die we opvragen (zo min mogelijk).
export const OFF_OPGEVRAAGDE_VELDEN = [
  'code', 'product_name_nl', 'product_name', 'generic_name_nl', 'brands',
  'quantity', 'product_quantity_unit', 'serving_size', 'serving_quantity', 'nutriments'
].join(',')

function leesGetal(waarde) {
  if (typeof waarde === 'number') return Number.isFinite(waarde) ? waarde : null
  if (typeof waarde === 'string' && /^\d+(\.\d+)?$/.test(waarde.trim())) return Number(waarde)
  return null
}

function tekst(waarde) {
  return typeof waarde === 'string' ? waarde.trim() : ''
}

// Is het product vloeibaar (waarden per 100 ml)?
function isVloeibaar(p) {
  if (tekst(p.product_quantity_unit).toLowerCase() === 'ml') return true
  return /\d\s*(ml|cl|dl|l)\b/i.test(tekst(p.quantity))
}

// In:  het JSON-antwoord van /api/v2/product/<code>.json, en de gescande code
// Uit: { product, opmerkingen } — product is null als het niet gevonden is
export function offNaarProduct(antwoord, code) {
  if (!antwoord || antwoord.status !== 1 || !antwoord.product) return { product: null, opmerkingen: [] }
  const p = antwoord.product
  const opmerkingen = []
  const eenheid = isVloeibaar(p) ? 'ml' : 'g'

  const voedingswaarden = p.nutriments ?? {}
  const waarden = {}
  for (const [sleutel, veld] of Object.entries(OFF_VELDEN)) {
    const waarde = leesGetal(voedingswaarden[veld])
    if (waarde === null) waarden[sleutel] = null
    else if (waarde < 0 || waarde > MAX_PER_100[sleutel]) {
      waarden[sleutel] = null
      opmerkingen.push(`Onmogelijke waarde voor ${sleutel} (${waarde}) weggelaten.`)
    } else waarden[sleutel] = waarde
  }

  const naam = (tekst(p.product_name_nl) || tekst(p.product_name) || tekst(p.generic_name_nl) || `Product ${code}`)
    .slice(0, MAX_NAAM_LENGTE)
  const merk = tekst(p.brands).split(',')[0].trim().slice(0, MAX_NAAM_LENGTE)

  // Portie zoals op de verpakking (bv. "30 g"), alleen als het gewicht bekend is.
  const porties = []
  const portieGram = leesGetal(p.serving_quantity)
  if (portieGram !== null && portieGram > 0 && portieGram <= MAX_HOEVEELHEID) {
    const omschrijving = tekst(p.serving_size)
    porties.push({ naam: (omschrijving || 'portie').slice(0, MAX_NAAM_LENGTE), gram: portieGram })
  }

  const product = { bron: 'off', barcode: code, naam, eenheid, waarden, porties }
  if (merk) product.merk = merk
  return { product, opmerkingen }
}
