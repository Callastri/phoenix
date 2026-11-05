import { describe, it, expect } from 'vitest'
import { isGeldigeBarcode, schoneBarcode } from '../src/berekeningen/barcode.js'
import { offNaarProduct } from '../src/berekeningen/openfoodfacts.js'

describe('barcodes', () => {
  it('geldige codes', () => {
    expect(isGeldigeBarcode('4006381333931')).toBe(true)  // EAN-13
    expect(isGeldigeBarcode('96385074')).toBe(true)       // EAN-8
    expect(isGeldigeBarcode('036000291452')).toBe(true)   // UPC-A
  })
  it('fout controlecijfer of lengte', () => {
    expect(isGeldigeBarcode('4006381333932')).toBe(false)
    expect(isGeldigeBarcode('12345')).toBe(false)
    expect(isGeldigeBarcode('abcdefghijklm')).toBe(false)
    expect(isGeldigeBarcode('')).toBe(false)
  })
  it('spaties en streepjes weg', () => {
    expect(schoneBarcode(' 4 006381-333931 ')).toBe('4006381333931')
  })
})

// Antwoord in de vorm van Open Food Facts (verzonnen product).
function antwoord(product) {
  return { status: 1, code: '4006381333931', product }
}

describe('Open Food Facts omzetten', () => {
  it('neemt waarden per 100 g over', () => {
    const { product, opmerkingen } = offNaarProduct(antwoord({
      product_name_nl: 'Testkoek', product_name: 'Test cookie', brands: 'Merk A, Merk B',
      quantity: '200 g', serving_size: '2 koeken (25 g)', serving_quantity: 25,
      nutriments: {
        'energy-kcal_100g': 480, proteins_100g: 6.5, carbohydrates_100g: 65, fat_100g: 21,
        fiber_100g: 2.1, sugars_100g: 30, salt_100g: 0.6, 'energy-kcal_serving': 120
      }
    }), '4006381333931')
    expect(opmerkingen).toEqual([])
    expect(product).toEqual({
      bron: 'off', barcode: '4006381333931', naam: 'Testkoek', merk: 'Merk A', eenheid: 'g',
      waarden: { kcal: 480, eiwit: 6.5, koolhydraten: 65, vet: 21, vezels: 2.1, suiker: 30, zout: 0.6 },
      porties: [{ naam: '2 koeken (25 g)', gram: 25 }]
    })
  })
  it('ontbrekend blijft leeg, er wordt niets bijgerekend', () => {
    const { product } = offNaarProduct(antwoord({
      product_name: 'Testdrank', quantity: '1,5 L',
      // alleen kJ en natrium: geen kcal en geen zout invullen
      nutriments: { 'energy-kj_100g': 180, sodium_100g: 0.01, sugars_100g: '10.5' }
    }), '4006381333931')
    expect(product.eenheid).toBe('ml')
    expect(product.waarden).toEqual({ kcal: null, eiwit: null, koolhydraten: null, vet: null, vezels: null, suiker: 10.5, zout: null })
    expect(product.porties).toEqual([])
    expect(product.merk).toBeUndefined()
  })
  it('onmogelijke waarden worden weggelaten met een opmerking', () => {
    const { product, opmerkingen } = offNaarProduct(antwoord({
      product_name: 'Fout', nutriments: { 'energy-kcal_100g': 4800, fat_100g: -2, proteins_100g: 'veel' }
    }), '4006381333931')
    expect(product.waarden.kcal).toBeNull()
    expect(product.waarden.vet).toBeNull()
    expect(product.waarden.eiwit).toBeNull()
    expect(opmerkingen).toHaveLength(2)
  })
  it('zonder naam: "Product <code>"', () => {
    expect(offNaarProduct(antwoord({ nutriments: {} }), '4006381333931').product.naam).toBe('Product 4006381333931')
  })
  it('niet gevonden', () => {
    expect(offNaarProduct({ status: 0, status_verbose: 'product not found' }, '1').product).toBeNull()
    expect(offNaarProduct(null, '1').product).toBeNull()
  })
})
