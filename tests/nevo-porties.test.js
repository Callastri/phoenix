import { describe, it, expect } from 'vitest'
import { nevoNaarProducten, NEVO_KOLOMMEN } from '../src/berekeningen/nevo.js'
import { basisHoeveelheid, zoutUitNatrium, waardenVoorHoeveelheid } from '../src/berekeningen/voeding.js'
import { controleerDagboekregel, controleerFavoriet, controleerProductRef } from '../src/berekeningen/controle.js'
import { regel } from './voorbeelden.js'

// Verzonnen testgegevens in het formaat van public/nevo.json (geen echte NEVO-waarden).
const BESTAND = {
  versie: 'test',
  kolommen: NEVO_KOLOMMEN,
  rijen: [
    [1, 'Testappel', 'testfruit', 'g', 50, 0.3, 12, 0.1, 2, 10, 1],
    [2, 'Testmelk', '', 'ml', 46, 3.4, 4.6, 1.5, null, 4.6, 40]
  ]
}

describe('zout uit natrium', () => {
  it('zout = natrium × 2,5 (mg → g)', () => {
    expect(zoutUitNatrium(400)).toBe(1)
    expect(zoutUitNatrium(40)).toBe(0.1)
    expect(zoutUitNatrium(0)).toBe(0)
  })
  it('onbekend natrium = onbekend zout', () => {
    expect(zoutUitNatrium(null)).toBeNull()
  })
})

describe('NEVO-bestand omzetten', () => {
  const [appel, melk] = nevoNaarProducten(BESTAND)
  it('neemt waarden ongewijzigd over', () => {
    expect(appel.ref).toEqual({ soort: 'nevo', id: 1 })
    expect(appel.waarden).toEqual({ kcal: 50, eiwit: 0.3, koolhydraten: 12, vet: 0.1, vezels: 2, suiker: 10, zout: 0.0025 })
    expect(appel.zoutBerekend).toBe(true)
    expect(melk.eenheid).toBe('ml')
  })
  it('lege waarde blijft null', () => {
    expect(melk.waarden.vezels).toBeNull()
  })
  it('weigert een bestand met andere kolommen', () => {
    expect(() => nevoNaarProducten({ ...BESTAND, kolommen: ['code', 'naam'] })).toThrow()
    expect(() => nevoNaarProducten(null)).toThrow()
  })
})

describe('porties', () => {
  it('aantal porties × gewicht', () => {
    expect(basisHoeveelheid(2, 'portie', 35)).toBe(70)
    expect(basisHoeveelheid(0.5, 'portie', 200)).toBe(100)
    expect(() => basisHoeveelheid(1, 'portie', null)).toThrow()
  })
  it('waarden voor 2 sneetjes van 35 g', () => {
    const w = waardenVoorHoeveelheid({ kcal: 250, eiwit: null }, basisHoeveelheid(2, 'portie', 35))
    expect(w.kcal).toBe(175)
    expect(w.eiwit).toBeNull()
  })
  it('controle van een portieregel', () => {
    const goed = regel({ eenheid: 'portie', hoeveelheid: 2, portieNaam: 'snee', portieGram: 35, basisEenheid: 'g', gram: 70 })
    expect(controleerDagboekregel(goed)).toEqual([])
    expect(controleerDagboekregel({ ...goed, portieGram: 0 })).not.toEqual([])
    expect(controleerDagboekregel({ ...goed, basisEenheid: undefined })).not.toEqual([])
  })
})

describe('verwijzingen en favorieten', () => {
  it('productverwijzing', () => {
    expect(controleerProductRef({ soort: 'nevo', id: 12 })).toEqual([])
    expect(controleerProductRef({ soort: 'iets', id: 12 })).not.toEqual([])
    expect(controleerProductRef({ soort: 'nevo', id: '12' })).not.toEqual([])
  })
  it('favoriet', () => {
    expect(controleerFavoriet({ sleutel: 'nevo:12' })).toEqual([])
    expect(controleerFavoriet({ sleutel: 'eigen:0' })).not.toEqual([])
    expect(controleerFavoriet({ sleutel: 'x' })).not.toEqual([])
  })
})
