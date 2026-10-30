// Test van het omzetscript met een klein, VERZONNEN voorbeeldbestand (geen echte NEVO-gegevens).

import { describe, it, expect } from 'vitest'
import { leesCsv, vindScheidingsteken, zetNevoOm, leesTekst, leesWaarde, naarJsonTekst } from '../scripts/nevo-lezen.js'
import { nevoNaarProducten } from '../src/berekeningen/nevo.js'

const CSV = [
  'NEVO-versie|Voedingsmiddelgroep|NEVO-code|Voedingsmiddelnaam|Synoniem|Hoeveelheid|ENERCJ|ENERCC|PROT|FAT|CHO|SUGAR|FIBT|NA',
  '2099/1.0|Fruit|2|Testpeer|peren|per 100g|200|48|0,4|0,1|11,5|9|3,1|1',
  '2099/1.0|Dranken|1|"Testsap; vers"||per 100ml|180|43|0,5|0|10|10||sp',
  '2099/1.0|Fruit|2|Dubbel|||1|1|1|1|1|1|1|1'
].join('\r\n')

describe('CSV lezen', () => {
  it('herkent het scheidingsteken', () => {
    expect(vindScheidingsteken('a|b|c')).toBe('|')
    expect(vindScheidingsteken('a;b;c')).toBe(';')
  })
  it('velden tussen aanhalingstekens', () => {
    expect(leesCsv('a;"b;c";"zeg ""hoi"""\n1;2;3', ';')).toEqual([['a', 'b;c', 'zeg "hoi"'], ['1', '2', '3']])
  })
  it('leest Windows-1252 als UTF-8 niet lukt', () => {
    expect(leesTekst(new Uint8Array([0x63, 0x72, 0xe8, 0x6d, 0x65]))).toBe('crème')
    expect(leesTekst(new TextEncoder().encode('﻿crème'))).toBe('crème')
  })
  it('cellen', () => {
    expect(leesWaarde('12,5')).toEqual({ waarde: 12.5, vreemd: false })
    expect(leesWaarde('')).toEqual({ waarde: null, vreemd: false })
    expect(leesWaarde('sp')).toEqual({ waarde: null, vreemd: true })
  })
})

// Zelfde kopregel-vorm als het echte bestand NEVO2025_v9.0.csv (waarden verzonnen).
const CSV_2025 = [
  '"NEVO-versie/NEVO-version"|"Voedingsmiddelgroep"|"Food group"|"NEVO-code"|"Voedingsmiddelnaam/Dutch food name"|"Engelse naam/Food name"|"Synoniem"|"Hoeveelheid/Quantity"|"Opmerking"|"ENERCJ (kJ)"|"ENERCC (kcal)"|"WATER (g)"|"PROT (g)"|"PROTPL (g)"|"FAT (g)"|"CHO (g)"|"SUGAR (g)"|"NVSUGAF (g)"|"FIBT (g)"|"NA (mg)"|"K (mg)"',
  'NEVO-Online 2099 1.0|Groep|Group|7|Testkaas|Test cheese||per 100g||"1500"|"360"|"40"|"25"|"0"|"28"|"0"|"0"||"0"|"800"|"90"',
  'NEVO-Online 2099 1.0|Groep|Group|8|Testsap|Test juice|sap|per 100ml||"180"|"43"|"88"|"0,5"|"0,5"|"0"|"10"|"9,5"||"0,1"||"120"'
].join('\r\n')

describe('NEVO 2025-formaat', () => {
  it('vindt de kolommen en neemt de juiste over (niet PROTPL, NVSUGAF, K enz.)', () => {
    const { bestand } = zetNevoOm(CSV_2025, '2099/1.0')
    expect(bestand.versie).toBe('2099/1.0')
    expect(bestand.rijen).toEqual([
      [7, 'Testkaas', '', 'g', 360, 25, 0, 28, 0, 0, 800],
      [8, 'Testsap', 'sap', 'ml', 43, 0.5, 10, 0, 0.1, 9.5, null]
    ])
  })
})

describe('NEVO omzetten', () => {
  const { bestand, waarschuwingen } = zetNevoOm(CSV)
  it('neemt de juiste kolommen ongewijzigd over, gesorteerd op code', () => {
    expect(bestand.versie).toBe('2099/1.0')
    expect(bestand.rijen).toEqual([
      [1, 'Testsap; vers', '', 'ml', 43, 0.5, 10, 0, null, 10, null],
      [2, 'Testpeer', 'peren', 'g', 48, 0.4, 11.5, 0.1, 3.1, 9, 1]
    ])
  })
  it('meldt dubbele codes en cellen zonder getal', () => {
    expect(waarschuwingen.some((w) => w.includes('Dubbele NEVO-code 2'))).toBe(true)
    expect(waarschuwingen.some((w) => w.includes('"sp"'))).toBe(true)
  })
  it('het resultaat kan de app lezen', () => {
    const producten = nevoNaarProducten(JSON.parse(naarJsonTekst(bestand)))
    expect(producten[1].waarden.zout).toBe(0.0025)
    expect(producten[0].waarden.zout).toBeNull()
  })
  it('stopt met een duidelijke melding als kolommen ontbreken', () => {
    expect(() => zetNevoOm('NEVO-code|Naam\n1|x')).toThrow(/Kolommen niet gevonden/)
  })
})
