// Opslag van eigen producten, porties, favorieten en het kopiëren van een maaltijd.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  bewaarEigenProduct, alleEigenProducten, verwijderEigenProduct,
  voegNevoPortieToe, portiesVoorNevo, verwijderNevoPortie,
  zetFavoriet, isFavoriet, alleFavorieten
} from '../src/opslag/producten.js'
import { voegRegelToe, regelsVanDag, kopieerMaaltijd, recenteRegels } from '../src/opslag/dagboek.js'
import { wisAlles, maakBackup, leesBackup, herstelBackup } from '../src/opslag/backup.js'
import { OngeldigeInvoer } from '../src/opslag/fouten.js'
import { regel, waarden } from './voorbeelden.js'

beforeEach(async () => { await wisAlles() })

describe('eigen producten', () => {
  it('bewaren, aanpassen en verwijderen', async () => {
    const id = await bewaarEigenProduct({ naam: ' Mijn muesli ', eenheid: 'g', waarden: waarden(), porties: [{ naam: 'kom', gram: 60 }] })
    let alle = await alleEigenProducten()
    expect(alle).toHaveLength(1)
    expect(alle[0].naam).toBe('Mijn muesli')
    expect(alle[0].bron).toBe('eigen')

    await bewaarEigenProduct({ id, naam: 'Mijn muesli', eenheid: 'g', waarden: waarden({ kcal: 380 }) })
    alle = await alleEigenProducten()
    expect(alle).toHaveLength(1)
    expect(alle[0].waarden.kcal).toBe(380)

    await zetFavoriet({ soort: 'eigen', id }, true)
    await verwijderEigenProduct(id)
    expect(await alleEigenProducten()).toHaveLength(0)
    expect(await isFavoriet({ soort: 'eigen', id })).toBe(false)
  })
  it('weigert ongeldige producten', async () => {
    await expect(bewaarEigenProduct({ naam: '', eenheid: 'g', waarden: waarden() })).rejects.toBeInstanceOf(OngeldigeInvoer)
    await expect(bewaarEigenProduct({ naam: 'X', eenheid: 'g', waarden: waarden(), porties: [{ naam: 'stuk', gram: 0 }] })).rejects.toBeInstanceOf(OngeldigeInvoer)
  })
  it('eigen versie van een NEVO-product onthoudt de NEVO-code', async () => {
    await bewaarEigenProduct({ naam: 'Brood (eigen)', eenheid: 'g', waarden: waarden(), gebaseerdOpNevo: 123 })
    expect((await alleEigenProducten())[0].gebaseerdOpNevo).toBe(123)
  })
})

describe('eigen porties bij NEVO', () => {
  it('toevoegen en verwijderen', async () => {
    const id = await voegNevoPortieToe(123, 'snee', 35)
    await voegNevoPortieToe(456, 'glas', 200)
    expect((await portiesVoorNevo(123)).map((p) => p.naam)).toEqual(['snee'])
    await verwijderNevoPortie(id)
    expect(await portiesVoorNevo(123)).toEqual([])
  })
  it('weigert een portie zonder gewicht', async () => {
    await expect(voegNevoPortieToe(123, 'snee', null)).rejects.toBeInstanceOf(OngeldigeInvoer)
  })
})

describe('favorieten', () => {
  it('aan en uit', async () => {
    await zetFavoriet({ soort: 'nevo', id: 12 }, true)
    await zetFavoriet({ soort: 'nevo', id: 12 }, true)
    await zetFavoriet({ soort: 'eigen', id: 3 }, true)
    expect(await alleFavorieten()).toEqual([{ soort: 'eigen', id: 3 }, { soort: 'nevo', id: 12 }])
    await zetFavoriet({ soort: 'nevo', id: 12 }, false)
    expect(await isFavoriet({ soort: 'nevo', id: 12 })).toBe(false)
  })
})

describe('maaltijd kopiëren en recent', () => {
  it('kopieert alleen die maaltijd naar de nieuwe dag', async () => {
    await voegRegelToe(regel({ datum: '2026-10-28', maaltijd: 'ontbijt', naam: 'Brood' }))
    await voegRegelToe(regel({ datum: '2026-10-28', maaltijd: 'ontbijt', naam: 'Kaas', eenheid: 'portie', hoeveelheid: 2, portieNaam: 'plak', portieGram: 20, basisEenheid: 'g' }))
    await voegRegelToe(regel({ datum: '2026-10-28', maaltijd: 'avond', naam: 'Pasta' }))
    const aantal = await kopieerMaaltijd('2026-10-28', '2026-10-29', 'ontbijt')
    expect(aantal).toBe(2)
    const vandaag = await regelsVanDag('2026-10-29')
    expect(vandaag.map((r) => r.naam)).toEqual(['Brood', 'Kaas'])
    expect(vandaag[1].gram).toBe(40)
    expect(await regelsVanDag('2026-10-28')).toHaveLength(3)
  })
  it('recent: laatste gebruik per product', async () => {
    await voegRegelToe(regel({ naam: 'Brood', productRef: { soort: 'nevo', id: 5 }, hoeveelheid: 35, aangemaakt: '2026-10-28T08:00:00Z' }))
    await voegRegelToe(regel({ naam: 'Brood', productRef: { soort: 'nevo', id: 5 }, hoeveelheid: 70, aangemaakt: '2026-10-29T08:00:00Z' }))
    const recent = await recenteRegels()
    expect(recent).toHaveLength(1)
    expect(recent[0].hoeveelheid).toBe(70)
  })
})

describe('back-up met producten, porties en favorieten', () => {
  it('alles komt terug', async () => {
    const id = await bewaarEigenProduct({ naam: 'Muesli', eenheid: 'g', waarden: waarden() })
    await voegNevoPortieToe(123, 'snee', 35)
    await zetFavoriet({ soort: 'eigen', id }, true)
    const tekst = JSON.stringify(await maakBackup())
    await wisAlles()
    const gelezen = leesBackup(tekst)
    expect(gelezen.ok).toBe(true)
    await herstelBackup(gelezen)
    expect(await alleEigenProducten()).toHaveLength(1)
    expect(await portiesVoorNevo(123)).toHaveLength(1)
    expect(await isFavoriet({ soort: 'eigen', id })).toBe(true)
  })
})
