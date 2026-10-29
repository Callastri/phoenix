// Test van de volledige weg: gegevens → back-up → alles wissen → terugzetten → vergelijken.

import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../src/opslag/db.js'
import { voegRegelToe, werkRegelBij, verwijderRegel, regelsVanDag, aantalRegels } from '../src/opslag/dagboek.js'
import { bewaarInstelling, leesInstelling } from '../src/opslag/instellingen.js'
import { maakBackup, leesBackup, herstelBackup, wisAlles, maakCsv } from '../src/opslag/backup.js'
import { TABELNAMEN } from '../src/opslag/schema.js'
import { OngeldigeInvoer } from '../src/opslag/fouten.js'
import { regel, waarden } from './voorbeelden.js'

async function alleGegevens() {
  const uit = {}
  for (const tabel of TABELNAMEN) uit[tabel] = await db.table(tabel).toArray()
  return uit
}

beforeEach(async () => {
  await wisAlles()
})

describe('dagboek opslaan', () => {
  it('toevoegen, aanpassen en verwijderen', async () => {
    const id = await voegRegelToe(regel())
    await voegRegelToe(regel({ naam: 'Melk', eenheid: 'ml', hoeveelheid: 200 }))
    let regels = await regelsVanDag('2026-10-29')
    expect(regels.map((r) => r.naam)).toEqual(['Havermout', 'Melk'])
    expect(regels[1].gram).toBe(200)

    await werkRegelBij(id, { hoeveelheid: 80 })
    regels = await regelsVanDag('2026-10-29')
    expect(regels[0].hoeveelheid).toBe(80)
    expect(regels[0].gram).toBe(80)
    expect(regels[0].aangemaakt).toBe('2026-10-29T08:00:00.000Z')

    await verwijderRegel(id)
    expect(await aantalRegels()).toBe(1)
  })
  it('weigert ongeldige invoer en bewaart niets', async () => {
    await expect(voegRegelToe(regel({ hoeveelheid: -5 }))).rejects.toBeInstanceOf(OngeldigeInvoer)
    await expect(voegRegelToe(regel({ waarden: waarden({ kcal: 5000 }) }))).rejects.toBeInstanceOf(OngeldigeInvoer)
    expect(await aantalRegels()).toBe(0)
  })
})

describe('back-up en herstel', () => {
  it('export → wissen → import geeft exact dezelfde gegevens', async () => {
    await voegRegelToe(regel())
    await voegRegelToe(regel({ datum: '2026-10-28', maaltijd: 'avond', naam: 'Soep', waarden: waarden({ vezels: null }) }))
    await db.gewicht.add({ datum: '2026-10-29', kg: 72.4 })
    await db.beweging.add({ datum: '2026-10-29', soortId: 1, soortNaam: 'Wandelen', met: 3.5, minuten: 30 })
    await bewaarInstelling('installUitlegGezien', true)
    const voor = await alleGegevens()

    const backup = await maakBackup({ nu: new Date('2026-10-29T20:00:00Z'), appVersie: '0.1.0' })
    // Zoals het naar een bestand gaat en terugkomt:
    const tekst = JSON.stringify(backup)

    await wisAlles()
    expect(await aantalRegels()).toBe(0)

    const gelezen = leesBackup(tekst)
    expect(gelezen.ok).toBe(true)
    expect(gelezen.aantallen.dagboek).toBe(2)
    await herstelBackup(gelezen)

    const na = await alleGegevens()
    expect(na.dagboek).toEqual(voor.dagboek)
    expect(na.gewicht).toEqual(voor.gewicht)
    expect(na.beweging).toEqual(voor.beweging)
    expect(await leesInstelling('installUitlegGezien')).toBe(true)
    // Null-waarden blijven null (niet 0) na herstel.
    expect(na.dagboek.find((r) => r.naam === 'Soep').waarden.vezels).toBeNull()
    // De teruggezette back-up telt als laatste back-up.
    expect(await leesInstelling('laatsteBackup')).toBe('2026-10-29T20:00:00.000Z')
  })

  it('een ongeldig bestand verandert niets', async () => {
    await voegRegelToe(regel())
    expect(leesBackup('dit is geen json').ok).toBe(false)
    expect(leesBackup('{"app":"iets anders"}').ok).toBe(false)

    const backup = await maakBackup()
    backup.gegevens.dagboek[0].hoeveelheid = -1
    const gelezen = leesBackup(JSON.stringify(backup))
    expect(gelezen.ok).toBe(false)
    expect(gelezen.fouten[0]).toMatch(/dagboek, regel 1/)
    await expect(herstelBackup(gelezen)).rejects.toThrow()
    expect(await aantalRegels()).toBe(1)
  })

  it('bij een fout tijdens terugzetten blijven de oude gegevens staan', async () => {
    await voegRegelToe(regel({ naam: 'Oud' }))
    // Handmatig "goedgekeurd" maar met dubbele id: de database weigert dit.
    const kapot = { ok: true, gemaakt: '2026-10-29T10:00:00Z', gegevens: {} }
    for (const tabel of TABELNAMEN) kapot.gegevens[tabel] = []
    kapot.gegevens.dagboek = [{ ...regel(), id: 1 }, { ...regel(), id: 1 }]
    await expect(herstelBackup(kapot)).rejects.toThrow()
    const regels = await regelsVanDag('2026-10-29')
    expect(regels.map((r) => r.naam)).toEqual(['Oud'])
  })

  it('CSV-export bevat alle regels', async () => {
    await voegRegelToe(regel())
    await voegRegelToe(regel({ naam: 'Appel' }))
    const csv = await maakCsv()
    expect(csv.trim().split('\r\n')).toHaveLength(3)
  })

  it('alles wissen', async () => {
    await voegRegelToe(regel())
    await bewaarInstelling('laatsteBackup', '2026-10-29T10:00:00Z')
    await wisAlles()
    const na = await alleGegevens()
    for (const tabel of TABELNAMEN) expect(na[tabel]).toEqual([])
  })
})
