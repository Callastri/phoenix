import { describe, it, expect } from 'vitest'
import { normaliseer, zoekProducten } from '../src/berekeningen/zoeken.js'
import { recentGebruikt, maakKopieen, productSleutel } from '../src/berekeningen/recent.js'
import { regel } from './voorbeelden.js'

describe('normaliseer', () => {
  it('zonder hoofdletters, accenten en rare tekens', () => {
    expect(normaliseer('  Crème Fraîche ')).toBe('creme fraiche')
    expect(normaliseer('Kaas 48+, jong')).toBe('kaas 48 jong')
    expect(normaliseer(null)).toBe('')
  })
})

describe('zoekProducten', () => {
  const producten = [
    { naam: 'Appelmoes' },
    { naam: 'Appel m schil gem' },
    { naam: 'Taart appel-' },
    { naam: 'Peer' },
    { naam: 'Crème fraîche' },
    { naam: 'Ui', synoniem: 'uien' }
  ]
  it('vindt op begin van de naam eerst', () => {
    const uit = zoekProducten(producten, 'appel').map((p) => p.naam)
    expect(uit[0]).toBe('Appel m schil gem')
    expect(uit).toContain('Taart appel-')
    expect(uit).not.toContain('Peer')
  })
  it('alle woorden moeten voorkomen', () => {
    expect(zoekProducten(producten, 'appel schil').map((p) => p.naam)).toEqual(['Appel m schil gem'])
  })
  it('accenten en hoofdletters maken niet uit', () => {
    expect(zoekProducten(producten, 'CREME').map((p) => p.naam)).toEqual(['Crème fraîche'])
  })
  it('zoekt ook in synoniemen', () => {
    expect(zoekProducten(producten, 'uien').map((p) => p.naam)).toEqual(['Ui'])
  })
  it('lege zoekterm geeft niets', () => {
    expect(zoekProducten(producten, '  ')).toEqual([])
  })
  it('houdt zich aan het maximum', () => {
    expect(zoekProducten(producten, 'e', 2)).toHaveLength(2)
  })
})

describe('recent gebruikt', () => {
  it('nieuwste eerst, één keer per product', () => {
    const regels = [
      regel({ id: 1, naam: 'Brood', productRef: { soort: 'nevo', id: 5 }, aangemaakt: '2026-10-27T08:00:00Z' }),
      regel({ id: 2, naam: 'Kaas', productRef: { soort: 'eigen', id: 1 }, aangemaakt: '2026-10-28T08:00:00Z' }),
      regel({ id: 3, naam: 'Brood', productRef: { soort: 'nevo', id: 5 }, hoeveelheid: 70, aangemaakt: '2026-10-29T08:00:00Z' }),
      regel({ id: 4, naam: 'Soep zelfgemaakt', aangemaakt: '2026-10-26T08:00:00Z' })
    ]
    const uit = recentGebruikt(regels)
    expect(uit.map((r) => r.id)).toEqual([3, 2, 4])
    expect(uit[0].hoeveelheid).toBe(70)
  })
  it('handmatige invoer met dezelfde naam telt als één', () => {
    expect(productSleutel(null, ' Soep ')).toBe(productSleutel(null, 'soep'))
  })
  it('maximum', () => {
    const regels = Array.from({ length: 10 }, (_, i) => regel({ id: i + 1, naam: `P${i}` }))
    expect(recentGebruikt(regels, 3)).toHaveLength(3)
  })
})

describe('maakKopieen', () => {
  it('nieuwe datum, geen id, origineel onveranderd', () => {
    const origineel = [regel({ id: 7, datum: '2026-10-28' })]
    const nu = new Date('2026-10-29T09:00:00Z')
    const [kopie] = maakKopieen(origineel, '2026-10-29', null, nu)
    expect(kopie.id).toBeUndefined()
    expect(kopie.datum).toBe('2026-10-29')
    expect(kopie.maaltijd).toBe('ontbijt')
    expect(kopie.aangemaakt).toBe('2026-10-29T09:00:00.000Z')
    kopie.waarden.kcal = 999
    expect(origineel[0].waarden.kcal).toBe(100)
    expect(origineel[0].datum).toBe('2026-10-28')
  })
})
