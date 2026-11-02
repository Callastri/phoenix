// Opzoeken van een barcode: eerst op het toestel, anders bij Open Food Facts (nagebootst).

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { zoekOpBarcode, haalProduct, mijnProductenGesorteerd, bronTekst } from '../src/diensten/producten.js'
import { haalBarcodeOp } from '../src/diensten/openfoodfacts.js'
import { bewaarEigenProduct, productMetBarcode, alleMijnProducten } from '../src/opslag/producten.js'
import { wisAlles, maakBackup, leesBackup, herstelBackup } from '../src/opslag/backup.js'
import { waarden } from './voorbeelden.js'

const CODE = '4006381333931'
const OFF_ANTWOORD = {
  status: 1, code: CODE,
  product: { product_name: 'Testkoek', brands: 'Merk A', nutriments: { 'energy-kcal_100g': 480, sugars_100g: 30 } }
}

function nepFetch(antwoord, status = 200) {
  return vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => antwoord }))
}

beforeEach(async () => {
  await wisAlles()
  vi.stubGlobal('navigator', { onLine: true })
})
afterEach(() => vi.unstubAllGlobals())

describe('haalBarcodeOp (Open Food Facts)', () => {
  it('stuurt alleen het barcodenummer, zonder cookies of herkomst', async () => {
    const fetch = nepFetch(OFF_ANTWOORD)
    vi.stubGlobal('fetch', fetch)
    const uit = await haalBarcodeOp(CODE)
    expect(uit.status).toBe('gevonden')
    const [adres, opties] = fetch.mock.calls[0]
    expect(adres).toMatch(new RegExp(`^https://world\\.openfoodfacts\\.org/api/v2/product/${CODE}\\.json\\?fields=`))
    expect(opties).toEqual({ credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' })
    expect(opties.body).toBeUndefined()
    expect(opties.headers).toBeUndefined()
  })
  it('niet gevonden (404 of status 0)', async () => {
    vi.stubGlobal('fetch', nepFetch({ status: 0 }, 404))
    expect((await haalBarcodeOp(CODE)).status).toBe('niet-gevonden')
    vi.stubGlobal('fetch', nepFetch({ status: 0 }))
    expect((await haalBarcodeOp(CODE)).status).toBe('niet-gevonden')
  })
  it('geen verbinding', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect((await haalBarcodeOp(CODE)).status).toBe('geen-verbinding')
    vi.stubGlobal('navigator', { onLine: false })
    expect((await haalBarcodeOp(CODE)).status).toBe('geen-verbinding')
  })
  it('serverfout', async () => {
    vi.stubGlobal('fetch', nepFetch({}, 500))
    expect((await haalBarcodeOp(CODE)).status).toBe('fout')
  })
  it('weigert iets dat geen barcode is, zonder iets te versturen', async () => {
    const fetch = nepFetch(OFF_ANTWOORD)
    vi.stubGlobal('fetch', fetch)
    expect((await haalBarcodeOp('../../x')).status).toBe('fout')
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('zoekOpBarcode', () => {
  it('gevonden product wordt bewaard en werkt daarna offline', async () => {
    const fetch = nepFetch(OFF_ANTWOORD)
    vi.stubGlobal('fetch', fetch)
    const eerste = await zoekOpBarcode(CODE)
    expect(eerste.status).toBe('gevonden')
    expect(eerste.product.naam).toBe('Testkoek')
    expect(eerste.product.ref.soort).toBe('off')
    expect(eerste.product.waarden.eiwit).toBeNull()
    expect(bronTekst(eerste.product)).toBe('Merk A · Open Food Facts')

    // Tweede keer: geen internet nodig.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('mag niet') }))
    const tweede = await zoekOpBarcode(CODE)
    expect(tweede.product.ref).toEqual(eerste.product.ref)
    expect(await alleMijnProducten()).toHaveLength(1)
  })
  it('een eigen product met dezelfde barcode gaat voor', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('mag niet') }))
    await bewaarEigenProduct({ naam: 'Mijn koek', eenheid: 'g', waarden: waarden(), barcode: CODE })
    const uit = await zoekOpBarcode(CODE)
    expect(uit.product.naam).toBe('Mijn koek')
    expect(uit.product.ref.soort).toBe('eigen')
  })
  it('aangepast gescand product blijft Open Food Facts, met markering', async () => {
    vi.stubGlobal('fetch', nepFetch(OFF_ANTWOORD))
    const { product } = await zoekOpBarcode(CODE)
    await bewaarEigenProduct({ id: product.ref.id, bron: 'off', merk: 'Merk A', aangepast: true, barcode: CODE, naam: 'Testkoek', eenheid: 'g', waarden: waarden({ kcal: 470 }) })
    const na = await haalProduct(product.ref)
    expect(na.waarden.kcal).toBe(470)
    expect(bronTekst(na)).toBe('Merk A · Open Food Facts (door jou aangepast)')
    expect((await productMetBarcode(CODE)).id).toBe(product.ref.id)
  })
  it('gescande producten staan in "Mijn producten" en gaan mee in de back-up', async () => {
    vi.stubGlobal('fetch', nepFetch(OFF_ANTWOORD))
    await zoekOpBarcode(CODE)
    expect((await mijnProductenGesorteerd()).map((p) => p.naam)).toEqual(['Testkoek'])
    const tekst = JSON.stringify(await maakBackup())
    await wisAlles()
    const gelezen = leesBackup(tekst)
    expect(gelezen.ok).toBe(true)
    await herstelBackup(gelezen)
    expect((await productMetBarcode(CODE)).bron).toBe('off')
  })
})
