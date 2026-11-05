import { describe, it, expect, beforeEach } from 'vitest'
import {
  leeftijd, rustverbruik, dagverbruik, voorgesteldDoel, doelWaarschuwingen,
  gramUitProcent, procentUitGram, dagBudget
} from '../src/berekeningen/doelen.js'
import { zevenDaagsGemiddelde, metingenMetGemiddelde, trend, gewichtOpDatum } from '../src/berekeningen/gewicht.js'
import { kcalVoorActiviteit, totaalBewegingKcal } from '../src/berekeningen/beweging.js'
import { controleerProfiel, controleerDoelen, controleerInstelling } from '../src/berekeningen/controle.js'
import { STANDAARD_SOORTEN } from '../src/gegevens/bewegingssoorten.js'
import { bewaarGewicht, alleGewichten } from '../src/opslag/gewicht.js'
import { voegActiviteitToe, recenteActiviteiten, bewaarEigenSoort } from '../src/opslag/beweging.js'
import { bewaarInstelling } from '../src/opslag/instellingen.js'
import { wisAlles, maakBackup, leesBackup, herstelBackup } from '../src/opslag/backup.js'
import { OngeldigeInvoer } from '../src/opslag/fouten.js'

describe('Mifflin-St Jeor', () => {
  it('man: 10×kg + 6,25×cm − 5×leeftijd + 5', () => {
    expect(rustverbruik({ kg: 80, lengteCm: 180, leeftijd: 30, formule: 'man' })).toBe(1780)
  })
  it('vrouw: 10×kg + 6,25×cm − 5×leeftijd − 161', () => {
    expect(rustverbruik({ kg: 65, lengteCm: 165, leeftijd: 40, formule: 'vrouw' })).toBe(1320.25)
  })
  it('geen formule = fout', () => {
    expect(() => rustverbruik({ kg: 65, lengteCm: 165, leeftijd: 40, formule: null })).toThrow()
  })
  it('leeftijd uit geboortejaar', () => {
    expect(leeftijd(1990, new Date(2026, 10, 5))).toBe(36)
  })
  it('dagverbruik en voorgesteld doel', () => {
    const tdee = dagverbruik(1780, 1.55)
    expect(tdee).toBeCloseTo(2759)
    expect(voorgesteldDoel(tdee, 0)).toBe(2759)
    expect(voorgesteldDoel(tdee, -0.5)).toBe(2209)    // − 7700 × 0,5 / 7 = − 550
    expect(voorgesteldDoel(tdee, 0.25)).toBe(3034)
  })
})

describe('doelwaarschuwingen', () => {
  it('onder rustverbruik', () => {
    expect(doelWaarschuwingen(1300, 1400)).toHaveLength(1)
  })
  it('onder 1200', () => {
    expect(doelWaarschuwingen(1100, 1000)).toHaveLength(1)
    expect(doelWaarschuwingen(1100, null)).toHaveLength(1)
  })
  it('beide', () => {
    expect(doelWaarschuwingen(1000, 1300)).toHaveLength(2)
  })
  it('geen waarschuwing bij een normaal doel of geen doel', () => {
    expect(doelWaarschuwingen(1800, 1400)).toEqual([])
    expect(doelWaarschuwingen(null, 1400)).toEqual([])
  })
})

describe('macro\'s in procenten', () => {
  it('omrekenen', () => {
    expect(gramUitProcent(2000, 30, 'vet')).toBeCloseTo(66.67, 2)
    expect(gramUitProcent(2000, 20, 'eiwit')).toBe(100)
    expect(procentUitGram(2000, 250, 'koolhydraten')).toBe(50)
  })
})

describe('dagbudget', () => {
  it('beweging telt alleen mee als het aan staat', () => {
    expect(dagBudget(2000, 300, false)).toEqual({ budget: 2000, bewegingErbij: 0 })
    expect(dagBudget(2000, 300, true)).toEqual({ budget: 2300, bewegingErbij: 300 })
    expect(dagBudget(null, 300, true)).toEqual({ budget: null, bewegingErbij: 0 })
  })
})

describe('gewicht', () => {
  const metingen = [
    { datum: '2026-10-25', kg: 80 },
    { datum: '2026-10-28', kg: 79 },
    { datum: '2026-10-31', kg: 78.4 },
    { datum: '2026-11-01', kg: 78 }
  ]
  it('7-daags gemiddelde: de 7 dagen tot en met de datum', () => {
    // 26 okt t/m 1 nov: 79, 78,4, 78
    expect(zevenDaagsGemiddelde(metingen, '2026-11-01')).toBeCloseTo(78.4667, 3)
    // 19 t/m 25 okt: alleen 80
    expect(zevenDaagsGemiddelde(metingen, '2026-10-25')).toBe(80)
    expect(zevenDaagsGemiddelde(metingen, '2026-10-01')).toBeNull()
  })
  it('lijst met gemiddelde, nieuwste eerst', () => {
    const lijst = metingenMetGemiddelde(metingen)
    expect(lijst.map((m) => m.datum)).toEqual(['2026-11-01', '2026-10-31', '2026-10-28', '2026-10-25'])
    expect(lijst[3].gemiddelde).toBe(80)
  })
  it('trend over 7 dagen', () => {
    // nu (26 okt–1 nov) 78,47 tegen 19–25 okt 80 → −1,53
    expect(trend(metingen, '2026-11-01')).toBeCloseTo(-1.5333, 3)
    expect(trend(metingen, '2026-10-25')).toBeNull()
  })
  it('gewicht dichtst bij een datum', () => {
    expect(gewichtOpDatum(metingen, '2026-10-29')).toBe(79)
    expect(gewichtOpDatum(metingen, '2026-12-31')).toBe(78)
    expect(gewichtOpDatum(metingen, '2026-10-01')).toBe(80)
    // even ver van 28 en 31 okt? 29,5 bestaat niet; 26 okt ligt even ver van 25 en 27 → eerdere
    expect(gewichtOpDatum([{ datum: '2026-10-25', kg: 80 }, { datum: '2026-10-27', kg: 70 }], '2026-10-26')).toBe(80)
    expect(gewichtOpDatum([], '2026-10-26')).toBeNull()
  })
})

describe('MET-schatting', () => {
  it('MET × kg × uren', () => {
    expect(kcalVoorActiviteit(3.5, 70, 60)).toBe(245)
    expect(kcalVoorActiviteit(8.3, 80, 30)).toBeCloseTo(332)
    expect(kcalVoorActiviteit(4, null, 30)).toBeNull()
  })
  it('totaal met het gewicht dichtst bij elke datum', () => {
    const metingen = [{ datum: '2026-10-01', kg: 80 }, { datum: '2026-11-01', kg: 70 }]
    const activiteiten = [
      { datum: '2026-10-02', met: 4, minuten: 60 },  // 4 × 80 = 320
      { datum: '2026-11-02', met: 4, minuten: 30 }   // 4 × 70 × 0,5 = 140
    ]
    expect(totaalBewegingKcal(activiteiten, metingen)).toEqual({ totaal: 460, onvolledig: false })
    expect(totaalBewegingKcal(activiteiten, [])).toEqual({ totaal: 0, onvolledig: true })
  })
  it('alle standaardsoorten zijn geldig en uniek', () => {
    const sleutels = new Set(STANDAARD_SOORTEN.map((s) => s.sleutel))
    expect(sleutels.size).toBe(STANDAARD_SOORTEN.length)
    for (const s of STANDAARD_SOORTEN) {
      expect(s.met).toBeGreaterThanOrEqual(1)
      expect(s.met).toBeLessThanOrEqual(25)
    }
  })
})

describe('controle profiel en doelen', () => {
  const nu = new Date(2026, 10, 5)
  it('profiel', () => {
    expect(controleerProfiel({ lengteCm: 172, geboortejaar: 1990, formule: 'vrouw', activiteitsniveau: 'licht' }, nu)).toEqual([])
    expect(controleerProfiel({ lengteCm: null, geboortejaar: null, formule: null, activiteitsniveau: null }, nu)).toEqual([])
    expect(controleerProfiel({ lengteCm: 30 }, nu)).toHaveLength(1)
    expect(controleerProfiel({ geboortejaar: 2020 }, nu)).toHaveLength(1)
    expect(controleerProfiel({ formule: 'x' }, nu)).toHaveLength(1)
    expect(controleerProfiel({ activiteitsniveau: 'super' }, nu)).toHaveLength(1)
  })
  it('doelen', () => {
    expect(controleerDoelen({ kcal: 1800, eiwit: 90, koolhydraten: null })).toEqual([])
    expect(controleerDoelen({ kcal: -5 })).toHaveLength(1)
    expect(controleerDoelen({ kcal: 20000 })).toHaveLength(1)
    expect(controleerDoelen({ alcohol: 3 })).toHaveLength(1)
  })
  it('instellingen bij import', () => {
    expect(controleerInstelling({ sleutel: 'bewegingOptellen', waarde: 'ja' })).toHaveLength(1)
    expect(controleerInstelling({ sleutel: 'doelen', waarde: { kcal: 0 } })).toHaveLength(1)
  })
})

describe('opslag gewicht, beweging en doelen', () => {
  beforeEach(async () => { await wisAlles() })
  it('één meting per datum: nieuwe vervangt oude', async () => {
    await bewaarGewicht('2026-11-01', 78)
    await bewaarGewicht('2026-11-01', 77.6)
    await bewaarGewicht('2026-10-31', 78.2)
    expect(await alleGewichten()).toMatchObject([{ datum: '2026-10-31', kg: 78.2 }, { datum: '2026-11-01', kg: 77.6 }])
    await expect(bewaarGewicht('2026-11-01', 5)).rejects.toBeInstanceOf(OngeldigeInvoer)
  })
  it('activiteiten en eigen soorten', async () => {
    await voegActiviteitToe({ datum: '2026-11-01', soortId: 'wandelen-rustig', soortNaam: 'Wandelen', met: 3.5, minuten: 30, notitie: '  met de hond ' })
    await voegActiviteitToe({ datum: '2026-09-01', soortId: 'yoga', soortNaam: 'Yoga', met: 2.5, minuten: 60 })
    const recent = await recenteActiviteiten('2026-11-05', 30)
    expect(recent).toHaveLength(1)
    expect(recent[0].notitie).toBe('met de hond')
    await expect(voegActiviteitToe({ datum: '2026-11-01', soortId: 'x', soortNaam: 'X', met: 3, minuten: 0 })).rejects.toBeInstanceOf(OngeldigeInvoer)
    await bewaarEigenSoort('Klimmen', 8)
    await expect(bewaarEigenSoort('Iets', 50)).rejects.toBeInstanceOf(OngeldigeInvoer)
  })
  it('ongeldige doelen worden niet bewaard', async () => {
    await expect(bewaarInstelling('doelen', { kcal: -1 })).rejects.toBeInstanceOf(OngeldigeInvoer)
  })
  it('back-up met gewicht, beweging, profiel en doelen', async () => {
    await bewaarGewicht('2026-11-01', 78)
    await voegActiviteitToe({ datum: '2026-11-01', soortId: 'yoga', soortNaam: 'Yoga', met: 2.5, minuten: 60 })
    await bewaarEigenSoort('Klimmen', 8)
    await bewaarInstelling('profiel', { lengteCm: 172, geboortejaar: 1990, formule: 'vrouw', activiteitsniveau: 'licht' })
    await bewaarInstelling('doelen', { kcal: 1800, eiwit: 90, koolhydraten: null, vet: 60, vezels: null, suiker: null, zout: null })
    await bewaarInstelling('bewegingOptellen', true)
    const tekst = JSON.stringify(await maakBackup())
    await wisAlles()
    const gelezen = leesBackup(tekst)
    expect(gelezen.ok).toBe(true)
    await herstelBackup(gelezen)
    expect(await alleGewichten()).toHaveLength(1)
    expect(await recenteActiviteiten('2026-11-05')).toHaveLength(1)
  })
})
