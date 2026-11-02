// De ENIGE plek in de app die iets naar een andere server stuurt.
// Wat er verstuurd wordt: alleen het barcodenummer, in het webadres.
// Geen cookies, geen herkomst (referrer), geen andere gegevens.
// Zie docs/PRIVACY.md.

import { offNaarProduct, OFF_OPGEVRAAGDE_VELDEN } from '../berekeningen/openfoodfacts.js'

const OFF_ADRES = 'https://world.openfoodfacts.org/api/v2/product/'

// Zoekt een barcode op bij Open Food Facts.
// Uit: { status: 'gevonden', product, opmerkingen }
//      of { status: 'niet-gevonden' | 'geen-verbinding' | 'fout' }
export async function haalBarcodeOp(barcode) {
  if (!/^\d{6,14}$/.test(barcode)) return { status: 'fout' }
  if (navigator.onLine === false) return { status: 'geen-verbinding' }
  let antwoord
  try {
    antwoord = await fetch(`${OFF_ADRES}${barcode}.json?fields=${OFF_OPGEVRAAGDE_VELDEN}`, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store'
    })
  } catch {
    return { status: 'geen-verbinding' }
  }
  // Open Food Facts geeft 404 als een product niet bestaat.
  if (antwoord.status === 404) return { status: 'niet-gevonden' }
  if (!antwoord.ok) return { status: 'fout' }
  try {
    const { product, opmerkingen } = offNaarProduct(await antwoord.json(), barcode)
    return product ? { status: 'gevonden', product, opmerkingen } : { status: 'niet-gevonden' }
  } catch {
    return { status: 'fout' }
  }
}
