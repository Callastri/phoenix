// Test van het migratiemechanisme met een voorbeeld-versie 2.
// Zo weten we dat een toekomstige wijziging van het gegevensmodel bestaande gegevens behoudt.

import { describe, it, expect } from 'vitest'
import { maakDatabase } from '../src/opslag/db.js'
import { migreerGegevens } from '../src/opslag/migraties.js'
import { VERSIES } from '../src/opslag/schema.js'
import { regel } from './voorbeelden.js'

// Een denkbeeldige versie 2: elke dagboekregel krijgt een leeg veld "notitie".
const VERSIE_2 = {
  versie: 2,
  tabellen: VERSIES[VERSIES.length - 1].tabellen,
  migratie: {
    dagboek: (r) => ({ ...r, notitie: '' })
  }
}
const MET_VERSIE_2 = [...VERSIES, VERSIE_2]

describe('migratie van de database op het toestel', () => {
  it('bestaande gegevens blijven behouden en krijgen het nieuwe veld', async () => {
    const naam = 'test-migratie-' + Math.random()

    // 1. Database in de huidige versie met gegevens.
    const oud = maakDatabase(naam, VERSIES)
    await oud.dagboek.add(regel({ naam: 'Brood' }))
    await oud.dagboek.add(regel({ naam: 'Kaas' }))
    await oud.gewicht.add({ datum: '2026-10-29', kg: 70 })
    oud.close()

    // 2. Dezelfde database openen met versie 2.
    const nieuw = maakDatabase(naam, MET_VERSIE_2)
    const regels = await nieuw.dagboek.toArray()
    expect(regels.map((r) => r.naam)).toEqual(['Brood', 'Kaas'])
    expect(regels.every((r) => r.notitie === '')).toBe(true)
    expect(regels[0].waarden).toEqual(regel().waarden)
    expect(regels[0].id).toBe(1)
    expect(await nieuw.gewicht.count()).toBe(1)
    nieuw.close()
  })
})

describe('migratie van een oude back-up', () => {
  it('zet versie-1-gegevens om naar versie 2', () => {
    const gegevens = { dagboek: [{ ...regel(), id: 1 }] }
    const uit = migreerGegevens(gegevens, 1, MET_VERSIE_2)
    expect(uit.dagboek[0].notitie).toBe('')
    expect(uit.dagboek[0].id).toBe(1)
    // Ontbrekende tabellen worden lege lijsten.
    expect(uit.gewicht).toEqual([])
    // Het origineel blijft onveranderd.
    expect(gegevens.dagboek[0].notitie).toBeUndefined()
  })
  it('een back-up die al in de nieuwste versie is, blijft gelijk', () => {
    const gegevens = { dagboek: [{ ...regel(), id: 1, notitie: 'hoi' }] }
    const uit = migreerGegevens(gegevens, 2, MET_VERSIE_2)
    expect(uit.dagboek[0].notitie).toBe('hoi')
  })
})
