import { describe, it, expect } from 'vitest'
import {
  controleerWaarden, controleerDagboekregel, controleerGewicht, controleerBeweging,
  controleerProduct, controleerBackupVorm, controleerBackupInhoud
} from '../src/berekeningen/controle.js'
import { waarden, regel } from './voorbeelden.js'

describe('controleerWaarden', () => {
  it('geldige waarden en onbekende waarden zijn goed', () => {
    expect(controleerWaarden(waarden())).toEqual([])
    expect(controleerWaarden(waarden({ vezels: null, zout: null }))).toEqual([])
  })
  it('negatief, te hoog of geen getal is fout', () => {
    expect(controleerWaarden(waarden({ eiwit: -1 }))).toHaveLength(1)
    expect(controleerWaarden(waarden({ kcal: 901 }))).toHaveLength(1)
    expect(controleerWaarden(waarden({ vet: 101 }))).toHaveLength(1)
    expect(controleerWaarden(waarden({ vet: '5' }))).toHaveLength(1)
    expect(controleerWaarden(waarden({ vet: NaN }))).toHaveLength(1)
  })
  it('onbekende voedingsstof is fout', () => {
    expect(controleerWaarden({ ...waarden(), alcohol: 3 })).toHaveLength(1)
  })
})

describe('controleerDagboekregel', () => {
  it('goede regel', () => {
    expect(controleerDagboekregel(regel())).toEqual([])
  })
  it('vindt fouten', () => {
    expect(controleerDagboekregel(regel({ datum: '2026-02-30' }))).not.toEqual([])
    expect(controleerDagboekregel(regel({ maaltijd: 'brunch' }))).not.toEqual([])
    expect(controleerDagboekregel(regel({ naam: '  ' }))).not.toEqual([])
    expect(controleerDagboekregel(regel({ hoeveelheid: 0 }))).not.toEqual([])
    expect(controleerDagboekregel(regel({ hoeveelheid: 20000, gram: 20000 }))).not.toEqual([])
    expect(controleerDagboekregel(regel({ eenheid: 'kg' }))).not.toEqual([])
    expect(controleerDagboekregel(regel({ id: -3 }))).not.toEqual([])
    expect(controleerDagboekregel(null)).not.toEqual([])
  })
})

describe('overige tabellen', () => {
  it('gewicht', () => {
    expect(controleerGewicht({ datum: '2026-10-29', kg: 72.4 })).toEqual([])
    expect(controleerGewicht({ datum: '2026-10-29', kg: 5 })).toHaveLength(1)
  })
  it('beweging', () => {
    const goed = { datum: '2026-10-29', soortNaam: 'Wandelen', met: 3.5, minuten: 30 }
    expect(controleerBeweging(goed)).toEqual([])
    expect(controleerBeweging({ ...goed, minuten: 2000 })).toHaveLength(1)
  })
  it('product', () => {
    const goed = { bron: 'eigen', naam: 'Brood', eenheid: 'g', waarden: waarden() }
    expect(controleerProduct(goed)).toEqual([])
    expect(controleerProduct({ ...goed, barcode: 'abc' })).toHaveLength(1)
    expect(controleerProduct({ ...goed, bron: 'nevo' })).toHaveLength(1)
  })
})

describe('back-upcontrole', () => {
  const tabellen = ['dagboek', 'gewicht', 'instellingen']
  const goed = { app: 'voedingsdagboek', schemaVersie: 1, gemaakt: '2026-10-29T10:00:00Z', gegevens: { dagboek: [] } }

  it('herkent een geldig bestand', () => {
    expect(controleerBackupVorm(goed, 1, tabellen)).toEqual([])
  })
  it('weigert vreemde bestanden', () => {
    expect(controleerBackupVorm({ foo: 1 }, 1, tabellen)).not.toEqual([])
    expect(controleerBackupVorm([], 1, tabellen)).not.toEqual([])
    expect(controleerBackupVorm({ ...goed, gegevens: { hacker: [] } }, 1, tabellen)).not.toEqual([])
    expect(controleerBackupVorm({ ...goed, gegevens: { dagboek: 'x' } }, 1, tabellen)).not.toEqual([])
  })
  it('weigert een back-up uit een nieuwere versie', () => {
    const fouten = controleerBackupVorm({ ...goed, schemaVersie: 2 }, 1, tabellen)
    expect(fouten[0]).toMatch(/nieuwere versie/)
  })
  it('meldt fouten per regel met regelnummer', () => {
    const fouten = controleerBackupInhoud({ dagboek: [regel({ id: 1 }), regel({ id: 2, hoeveelheid: -1 })] })
    expect(fouten).toHaveLength(1)
    expect(fouten[0]).toMatch(/^dagboek, regel 2:/)
  })
  it('meldt dubbele id en dubbele datum bij gewicht', () => {
    expect(controleerBackupInhoud({ dagboek: [regel({ id: 1 }), regel({ id: 1 })] })).toHaveLength(1)
    expect(controleerBackupInhoud({ gewicht: [{ datum: '2026-10-29', kg: 70 }, { datum: '2026-10-29', kg: 71 }] })).toHaveLength(1)
  })
})
