// Tests van migraties: de echte overgang 1 → 2, en het mechanisme met een denkbeeldige volgende versie.
// Zo weten we dat een toekomstige wijziging van het gegevensmodel bestaande gegevens behoudt.

import { describe, it, expect } from 'vitest'
import { maakDatabase } from '../src/opslag/db.js'
import { migreerGegevens } from '../src/opslag/migraties.js'
import { VERSIES, HUIDIGE_VERSIE } from '../src/opslag/schema.js'
import { maakBackup, leesBackup, herstelBackup } from '../src/opslag/backup.js'
import { db } from '../src/opslag/db.js'
import { regel } from './voorbeelden.js'

// Een denkbeeldige volgende versie: elke dagboekregel krijgt een leeg veld "notitie".
const VOLGENDE = HUIDIGE_VERSIE + 1
const TEST_VERSIE = {
  versie: VOLGENDE,
  tabellen: VERSIES[VERSIES.length - 1].tabellen,
  migratie: {
    dagboek: (r) => ({ ...r, notitie: '' })
  }
}
const MET_TEST_VERSIE = [...VERSIES, TEST_VERSIE]

describe('echte migratie versie 1 → 2 (favorieten)', () => {
  it('gegevens uit versie 1 blijven behouden; favorieten is een nieuwe lege tabel', async () => {
    const naam = 'test-v1-v2-' + Math.random()
    const v1 = maakDatabase(naam, VERSIES.slice(0, 1))
    await v1.dagboek.add(regel({ naam: 'Brood' }))
    await v1.porties.add({ nevoCode: 12, naam: 'snee', gram: 35 })
    await v1.instellingen.put({ sleutel: 'laatsteBackup', waarde: '2026-10-29T10:00:00Z' })
    v1.close()

    const v2 = maakDatabase(naam, VERSIES.slice(0, 2))
    expect((await v2.dagboek.toArray()).map((r) => r.naam)).toEqual(['Brood'])
    expect(await v2.porties.count()).toBe(1)
    expect((await v2.instellingen.get('laatsteBackup')).waarde).toBe('2026-10-29T10:00:00Z')
    expect(await v2.favorieten.count()).toBe(0)
    await v2.favorieten.put({ sleutel: 'nevo:12' })
    expect(await v2.favorieten.count()).toBe(1)
    v2.close()
  })

  it('een back-up uit versie 1 (zonder favorieten) kan teruggezet worden', async () => {
    const backup = await maakBackup()
    backup.schemaVersie = 1
    delete backup.gegevens.favorieten
    backup.gegevens.dagboek = [{ ...regel(), id: 1 }]
    const gelezen = leesBackup(JSON.stringify(backup))
    expect(gelezen.ok).toBe(true)
    await herstelBackup(gelezen)
    expect(await db.dagboek.count()).toBe(1)
    expect(await db.favorieten.count()).toBe(0)
  })
})

describe('migratie van de database op het toestel', () => {
  it('bestaande gegevens blijven behouden en krijgen het nieuwe veld', async () => {
    const naam = 'test-migratie-' + Math.random()

    // 1. Database in de huidige versie met gegevens.
    const oud = maakDatabase(naam, VERSIES)
    await oud.dagboek.add(regel({ naam: 'Brood' }))
    await oud.dagboek.add(regel({ naam: 'Kaas' }))
    await oud.gewicht.add({ datum: '2026-10-29', kg: 70 })
    oud.close()

    // 2. Dezelfde database openen met de volgende versie.
    const nieuw = maakDatabase(naam, MET_TEST_VERSIE)
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
  it('zet oude gegevens om naar de volgende versie', () => {
    const gegevens = { dagboek: [{ ...regel(), id: 1 }] }
    const uit = migreerGegevens(gegevens, HUIDIGE_VERSIE, MET_TEST_VERSIE)
    expect(uit.dagboek[0].notitie).toBe('')
    expect(uit.dagboek[0].id).toBe(1)
    // Ontbrekende tabellen worden lege lijsten.
    expect(uit.gewicht).toEqual([])
    // Het origineel blijft onveranderd.
    expect(gegevens.dagboek[0].notitie).toBeUndefined()
  })
  it('een back-up die al in de nieuwste versie is, blijft gelijk', () => {
    const gegevens = { dagboek: [{ ...regel(), id: 1, notitie: 'hoi' }] }
    const uit = migreerGegevens(gegevens, VOLGENDE, MET_TEST_VERSIE)
    expect(uit.dagboek[0].notitie).toBe('hoi')
  })
})
