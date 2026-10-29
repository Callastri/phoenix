import { describe, it, expect } from 'vitest'
import { moetBackupHerinneren, tekstLaatsteBackup } from '../src/berekeningen/herinnering.js'
import { maakDagboekCsv, csvVeld } from '../src/berekeningen/csv.js'
import { regel, waarden } from './voorbeelden.js'

describe('back-upherinnering', () => {
  const nu = new Date('2026-10-29T12:00:00Z')
  it('geen gegevens: geen herinnering', () => {
    expect(moetBackupHerinneren({ laatsteBackup: null, nu, heeftGegevens: false, maxDagen: 7 })).toBe(false)
  })
  it('nooit een back-up: herinnering', () => {
    expect(moetBackupHerinneren({ laatsteBackup: null, nu, heeftGegevens: true, maxDagen: 7 })).toBe(true)
  })
  it('herinnering pas na 7 dagen', () => {
    expect(moetBackupHerinneren({ laatsteBackup: '2026-10-23T12:00:00Z', nu, heeftGegevens: true, maxDagen: 7 })).toBe(false)
    expect(moetBackupHerinneren({ laatsteBackup: '2026-10-22T12:00:00Z', nu, heeftGegevens: true, maxDagen: 7 })).toBe(true)
  })
  it('tekst', () => {
    expect(tekstLaatsteBackup(null, nu)).toBe('Nog nooit')
    expect(tekstLaatsteBackup('2026-10-29T08:00:00Z', nu)).toBe('Vandaag')
    expect(tekstLaatsteBackup('2026-10-28T08:00:00Z', nu)).toBe('Gisteren')
    expect(tekstLaatsteBackup('2026-10-20T08:00:00Z', nu)).toBe('9 dagen geleden')
  })
})

describe('CSV', () => {
  it('maakt velden veilig', () => {
    expect(csvVeld('a;b')).toBe('"a;b"')
    expect(csvVeld('zeg "hoi"')).toBe('"zeg ""hoi"""')
    expect(csvVeld('=SOM(A1)')).toBe("'=SOM(A1)")
    expect(csvVeld(null)).toBe('')
  })
  it('maakt een dagboek-CSV met waarden voor de gegeten hoeveelheid', () => {
    const csv = maakDagboekCsv([
      regel({ id: 2, datum: '2026-10-29', naam: 'Kaas; jong', gram: 30, hoeveelheid: 30, waarden: waarden({ zout: null }) }),
      regel({ id: 1, datum: '2026-10-28' })
    ])
    const rijen = csv.trim().split('\r\n')
    expect(rijen).toHaveLength(3)
    expect(rijen[0]).toBe('Datum;Maaltijd;Naam;Hoeveelheid;Eenheid;Energie (kcal);Eiwit (g);Koolhydraten (g);Vet (g);Vezels (g);waarvan suikers (g);Zout (g)')
    expect(rijen[1]).toBe('2026-10-28;Ontbijt;Havermout;50,0;g;50;5,0;10,0;2,5;1,0;4,0;0,25')
    // onbekend zout blijft leeg
    expect(rijen[2]).toBe('2026-10-29;Ontbijt;"Kaas; jong";30,0;g;30;3,0;6,0;1,5;0,6;2,4;')
  })
})
