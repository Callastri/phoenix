// Hulpfuncties om het NEVO-databestand van het RIVM te lezen (CSV).
// Gebruikt door scripts/nevo-naar-json.js; getest in tests/nevo-script.test.js.
//
// Regel van de NEVO-voorwaarden: gegevens alleen ONGEWIJZIGD gebruiken.
// Daarom nemen we de getallen precies over (geen afronding) en laten we lege cellen leeg (null).

import { NEVO_KOLOMMEN } from '../src/berekeningen/nevo.js'

// Mogelijke kolomkoppen per gegeven (na normaliseren: kleine letters, alleen letters en cijfers).
// Eerst de NEVO-componentcodes, daarna Nederlandse namen.
export const KOLOM_NAMEN = {
  code: ['nevocode', 'code'],
  naam: ['voedingsmiddelnaam', 'voedingsmiddelnaamdutchfoodname', 'dutchfoodname'],
  synoniem: ['synoniem', 'synonym'],
  hoeveelheid: ['hoeveelheid', 'quantity', 'hoeveelheidquantity'],
  versie: ['nevoversie', 'nevoversion', 'nevoversienevoversion'],
  // In NEVO 2025/9.0 heten de kolommen bijvoorbeeld "ENERCC (kcal)" → 'enercckcal'.
  kcal: ['enercckcal', 'enercc', 'kcal', 'kcalkcal', 'energiekcal'],
  eiwit: ['protg', 'prot', 'eiwit', 'eiwitg', 'eiwittotaal', 'eiwittotaalg'],
  koolhydraten: ['chog', 'cho', 'koolhydraten', 'koolhydrateng'],
  vet: ['fatg', 'fat', 'vet', 'vetg', 'vettotaal', 'vettotaalg'],
  vezels: ['fibtg', 'fibt', 'vezel', 'vezelg', 'voedingsvezel', 'voedingsvezelg'],
  suiker: ['sugarg', 'sugar', 'monodisachariden', 'monodisacharideng'],
  natriumMg: ['namg', 'na', 'natrium', 'natriummg']
}
const VERPLICHT = ['code', 'naam', 'kcal', 'eiwit', 'koolhydraten', 'vet', 'vezels', 'suiker', 'natriumMg']

export function normaliseerKop(kop) {
  return String(kop).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')
}

// Leest bytes als tekst: eerst UTF-8; lukt dat niet, dan Windows-1252 (oude Excel-bestanden).
export function leesTekst(bytes) {
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  const tekst = utf8.includes('�') ? new TextDecoder('windows-1252').decode(bytes) : utf8
  return tekst.replace(/^﻿/, '')
}

// Kiest het scheidingsteken dat het vaakst in de eerste regel voorkomt.
export function vindScheidingsteken(eersteRegel) {
  const kandidaten = ['|', ';', '\t', ',']
  return kandidaten.reduce((beste, teken) =>
    eersteRegel.split(teken).length > eersteRegel.split(beste).length ? teken : beste)
}

// Leest CSV-tekst naar een lijst rijen (elke rij een lijst velden). Kan "velden met ; erin" aan.
export function leesCsv(tekst, scheiding) {
  const rijen = []
  let rij = []
  let veld = ''
  let tussenAanhalingstekens = false
  for (let i = 0; i < tekst.length; i++) {
    const teken = tekst[i]
    if (tussenAanhalingstekens) {
      if (teken === '"' && tekst[i + 1] === '"') { veld += '"'; i++ }
      else if (teken === '"') tussenAanhalingstekens = false
      else veld += teken
    } else if (teken === '"' && veld === '') {
      tussenAanhalingstekens = true
    } else if (teken === scheiding) {
      rij.push(veld); veld = ''
    } else if (teken === '\n' || teken === '\r') {
      if (teken === '\r' && tekst[i + 1] === '\n') i++
      rij.push(veld); veld = ''
      if (rij.some((v) => v !== '')) rijen.push(rij)
      rij = []
    } else {
      veld += teken
    }
  }
  rij.push(veld)
  if (rij.some((v) => v !== '')) rijen.push(rij)
  return rijen
}

// Zoekt per gegeven de kolom. Gooit een fout met alle koppen als iets verplichts ontbreekt.
export function vindKolommen(koppen) {
  const genormaliseerd = koppen.map(normaliseerKop)
  const posities = {}
  for (const [gegeven, namen] of Object.entries(KOLOM_NAMEN)) {
    const positie = genormaliseerd.findIndex((kop) => namen.includes(kop))
    if (positie >= 0) posities[gegeven] = positie
  }
  const ontbreekt = VERPLICHT.filter((g) => posities[g] === undefined)
  if (ontbreekt.length > 0) {
    throw new Error(`Kolommen niet gevonden: ${ontbreekt.join(', ')}.\nGevonden koppen: ${koppen.join(' | ')}`)
  }
  return posities
}

// Leest een getal uit een NEVO-cel. Leeg = null. Komma of punt als decimaalteken.
// Uit: { waarde, vreemd } — vreemd = true als de cel iets anders dan een getal bevat.
export function leesWaarde(cel) {
  const schoon = String(cel ?? '').trim().replace(',', '.')
  if (schoon === '') return { waarde: null, vreemd: false }
  if (!/^\d+(\.\d+)?$/.test(schoon)) return { waarde: null, vreemd: true }
  return { waarde: Number(schoon), vreemd: false }
}

// Zet de tekst van het NEVO-bestand om naar de inhoud van public/nevo.json.
// Uit: { bestand, waarschuwingen }
export function zetNevoOm(tekst, versieOpgegeven = null) {
  const eersteRegel = tekst.split(/\r?\n/, 1)[0]
  const rijen = leesCsv(tekst, vindScheidingsteken(eersteRegel))
  const [koppen, ...data] = rijen
  const k = vindKolommen(koppen)
  const waarschuwingen = []
  const vreemdeCellen = []
  if (k.hoeveelheid === undefined) waarschuwingen.push('Geen kolom "Hoeveelheid"; alles wordt als per 100 g gezien.')

  const uit = []
  const geziene = new Set()
  for (const rij of data) {
    const code = Number.parseInt(rij[k.code], 10)
    if (!Number.isInteger(code) || code <= 0) { waarschuwingen.push(`Rij zonder geldige NEVO-code overgeslagen: ${rij.slice(0, 3).join(' ')}`); continue }
    if (geziene.has(code)) { waarschuwingen.push(`Dubbele NEVO-code ${code} overgeslagen.`); continue }
    geziene.add(code)
    const hoeveelheid = k.hoeveelheid !== undefined ? String(rij[k.hoeveelheid] ?? '') : ''
    const waarden = ['kcal', 'eiwit', 'koolhydraten', 'vet', 'vezels', 'suiker', 'natriumMg'].map((g) => {
      const { waarde, vreemd } = leesWaarde(rij[k[g]])
      if (vreemd) vreemdeCellen.push(`${code} ${g}: "${rij[k[g]]}"`)
      return waarde
    })
    uit.push([
      code,
      String(rij[k.naam]).trim(),
      k.synoniem !== undefined ? String(rij[k.synoniem] ?? '').trim() : '',
      /ml/i.test(hoeveelheid) ? 'ml' : 'g',
      ...waarden
    ])
  }
  if (vreemdeCellen.length > 0) {
    waarschuwingen.push(`${vreemdeCellen.length} cellen zonder getal zijn leeg gelaten, bv.: ${vreemdeCellen.slice(0, 5).join('; ')}`)
  }
  uit.sort((a, b) => a[0] - b[0])
  const versie = versieOpgegeven ?? (k.versie !== undefined ? String(data[0]?.[k.versie] ?? '').trim() : '')
  if (!versie) throw new Error('Geen NEVO-versie gevonden. Geef die op, bijvoorbeeld: 2025/9.0')
  return { bestand: { versie, kolommen: NEVO_KOLOMMEN, rijen: uit }, waarschuwingen }
}

// Schrijft nevo.json compact maar leesbaar: één product per regel.
export function naarJsonTekst(bestand) {
  const rijen = bestand.rijen.map((r) => '  ' + JSON.stringify(r)).join(',\n')
  return `{"versie":${JSON.stringify(bestand.versie)},"kolommen":${JSON.stringify(bestand.kolommen)},"rijen":[\n${rijen}\n]}\n`
}
