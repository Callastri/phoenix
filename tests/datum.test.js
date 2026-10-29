import { describe, it, expect } from 'vitest'
import { vandaag, verschuifDag, isGeldigeDatum, dagenTussen, toonDatum } from '../src/berekeningen/datum.js'

describe('datum', () => {
  it('vandaag gebruikt de lokale datum', () => {
    expect(vandaag(new Date(2026, 9, 29, 23, 59))).toBe('2026-10-29')
    expect(vandaag(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01')
  })
  it('verschuift over maand- en jaargrenzen', () => {
    expect(verschuifDag('2026-10-31', 1)).toBe('2026-11-01')
    expect(verschuifDag('2026-01-01', -1)).toBe('2025-12-31')
    expect(verschuifDag('2028-02-28', 1)).toBe('2028-02-29')
  })
  it('rond de wissel naar wintertijd', () => {
    expect(verschuifDag('2026-10-24', 1)).toBe('2026-10-25')
    expect(verschuifDag('2026-10-25', 1)).toBe('2026-10-26')
  })
  it('herkent ongeldige datums', () => {
    expect(isGeldigeDatum('2026-10-29')).toBe(true)
    expect(isGeldigeDatum('2026-02-31')).toBe(false)
    expect(isGeldigeDatum('29-10-2026')).toBe(false)
    expect(isGeldigeDatum('')).toBe(false)
    expect(isGeldigeDatum(20261029)).toBe(false)
    expect(isGeldigeDatum('1800-01-01')).toBe(false)
  })
  it('telt hele dagen', () => {
    expect(dagenTussen('2026-10-01T10:00:00Z', '2026-10-08T09:00:00Z')).toBe(6)
    expect(dagenTussen('2026-10-01T10:00:00Z', '2026-10-08T10:00:00Z')).toBe(7)
  })
  it('toont leesbare datum', () => {
    expect(toonDatum('2026-10-29', '2026-10-29')).toBe('Vandaag')
    expect(toonDatum('2026-10-28', '2026-10-29')).toBe('Gisteren')
    expect(toonDatum('2026-10-30', '2026-10-29')).toBe('Morgen')
    expect(toonDatum('2026-10-27', '2026-10-29')).toBe('di 27 okt')
    expect(toonDatum('2025-12-31', '2026-10-29')).toBe('wo 31 dec 2025')
  })
})
