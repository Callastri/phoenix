import { describe, it, expect } from 'vitest'
import { leesGetal, toonGetal } from '../src/berekeningen/getallen.js'

describe('leesGetal', () => {
  it('leest komma en punt', () => {
    expect(leesGetal('12,5')).toBe(12.5)
    expect(leesGetal('12.5')).toBe(12.5)
    expect(leesGetal(' 3 ')).toBe(3)
    expect(leesGetal(',5')).toBe(0.5)
  })
  it('leeg veld is null (onbekend), niet 0', () => {
    expect(leesGetal('')).toBeNull()
    expect(leesGetal('   ')).toBeNull()
    expect(leesGetal(null)).toBeNull()
  })
  it('onzin is NaN', () => {
    expect(leesGetal('abc')).toBeNaN()
    expect(leesGetal('12abc')).toBeNaN()
    expect(leesGetal('1e5')).toBeNaN()
    expect(leesGetal('1,2,3')).toBeNaN()
  })
})

describe('toonGetal', () => {
  it('toont met komma en afronding', () => {
    expect(toonGetal(12.345, 1)).toBe('12,3')
    expect(toonGetal(12.35, 0)).toBe('12')
    expect(toonGetal(0.125, 2)).toBe('0,13')
  })
  it('toont onbekend als streepje', () => {
    expect(toonGetal(null)).toBe('–')
    expect(toonGetal(undefined)).toBe('–')
  })
  it('geen -0', () => {
    expect(toonGetal(-0.01, 0)).toBe('0')
  })
})
