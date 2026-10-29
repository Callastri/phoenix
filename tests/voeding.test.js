import { describe, it, expect } from 'vitest'
import {
  basisHoeveelheid, waardenVoorHoeveelheid, telOp, totaalVanRegels, totaalPerMaaltijd
} from '../src/berekeningen/voeding.js'
import { MAALTIJD_SLEUTELS } from '../src/gegevens/maaltijden.js'
import { waarden, regel } from './voorbeelden.js'

describe('basisHoeveelheid', () => {
  it('gram en ml blijven gelijk', () => {
    expect(basisHoeveelheid(150, 'g')).toBe(150)
    expect(basisHoeveelheid(250, 'ml')).toBe(250)
  })
  it('onbekende eenheid geeft een fout', () => {
    expect(() => basisHoeveelheid(1, 'kg')).toThrow()
  })
})

describe('waardenVoorHoeveelheid', () => {
  it('rekent per 100 g om naar de hoeveelheid', () => {
    const uit = waardenVoorHoeveelheid(waarden(), 50)
    expect(uit.kcal).toBe(50)
    expect(uit.eiwit).toBe(5)
    expect(uit.zout).toBe(0.25)
  })
  it('onbekend blijft onbekend (null), nooit 0', () => {
    const uit = waardenVoorHoeveelheid(waarden({ vezels: null }), 200)
    expect(uit.vezels).toBeNull()
    expect(uit.kcal).toBe(200)
  })
})

describe('telOp', () => {
  it('telt bekende waarden op', () => {
    const uit = telOp([{ ...waarden(), kcal: 100 }, { ...waarden(), kcal: 50 }])
    expect(uit.kcal).toEqual({ totaal: 150, onvolledig: false })
  })
  it('markeert onvolledig als er een onbekende waarde bij zit', () => {
    const uit = telOp([waarden({ suiker: 4 }), waarden({ suiker: null })])
    expect(uit.suiker).toEqual({ totaal: 4, onvolledig: true })
  })
  it('alles onbekend geeft null', () => {
    const uit = telOp([waarden({ zout: null }), waarden({ zout: null })])
    expect(uit.zout).toEqual({ totaal: null, onvolledig: true })
  })
  it('lege lijst geeft 0 en is volledig', () => {
    expect(telOp([]).kcal).toEqual({ totaal: 0, onvolledig: false })
  })
})

describe('dagtotalen', () => {
  const regels = [
    regel({ maaltijd: 'ontbijt', gram: 50 }),                                  // 50 kcal
    regel({ maaltijd: 'avond', gram: 200, waarden: waarden({ kcal: 150 }) }),  // 300 kcal
    regel({ maaltijd: 'avond', gram: 100, waarden: waarden({ vet: null }) })   // 100 kcal
  ]
  it('totaal van een dag', () => {
    const t = totaalVanRegels(regels)
    expect(t.kcal.totaal).toBe(450)
    expect(t.vet.totaal).toBe(12.5)
    expect(t.vet.onvolledig).toBe(true)
  })
  it('totaal per maaltijd', () => {
    const t = totaalPerMaaltijd(regels, MAALTIJD_SLEUTELS)
    expect(t.ontbijt.kcal.totaal).toBe(50)
    expect(t.avond.kcal.totaal).toBe(400)
    expect(t.middag.kcal.totaal).toBe(0)
    expect(t.tussendoor.kcal.onvolledig).toBe(false)
  })
})
