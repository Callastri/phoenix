// Invoervelden voor de zeven voedingswaarden (per 100 g of 100 ml).
// Gebruikt bij handmatige invoer en bij eigen producten.

import { el } from './html.js'
import { VOEDINGSSTOFFEN } from '../gegevens/voedingsstoffen.js'
import { leesGetal } from '../berekeningen/getallen.js'

// Zet een opgeslagen getal in een invoerveld (12.5 → "12,5"; onbekend → leeg).
// toPrecision(12) haalt rekenruis weg (0,30000000000000004 → 0,3).
export function naarVeld(getal) {
  return getal === null || getal === undefined ? '' : String(Number(getal.toPrecision(12))).replace('.', ',')
}

// Maakt de velden.
// In:  bestaande waarden (of null), een voorvoegsel voor de veldnamen
// Uit: { element, legende, lees, velden }
//      - element: het blok om op het scherm te zetten
//      - legende: de kop ("Voedingswaarden per 100 g"), pas je aan met zetEenheid
//      - lees(): geeft { kcal, eiwit, ... } terug; leeg = null, onzin = NaN
export function maakWaardenVelden(waarden = null, voorvoegsel = 'veld') {
  const velden = {}
  const rijen = VOEDINGSSTOFFEN.map((stof) => {
    const veld = el('input', {
      id: `${voorvoegsel}-${stof.sleutel}`, type: 'text', inputmode: 'decimal', autocomplete: 'off',
      placeholder: 'onbekend', value: waarden ? naarVeld(waarden[stof.sleutel]) : ''
    })
    velden[stof.sleutel] = veld
    return el('div', { class: 'veld-rij' }, el('label', { for: veld.id }, `${stof.naam} (${stof.eenheid})`), veld)
  })
  const legende = el('legend', {}, 'Voedingswaarden per 100 g')
  const element = el('fieldset', { class: 'waarden' },
    legende,
    el('p', { class: 'hint' }, 'Weet je een waarde niet? Laat het veld leeg. Dan telt die niet mee en zie je "–".'),
    rijen
  )
  return {
    element,
    velden,
    zetEenheid: (eenheid) => { legende.textContent = `Voedingswaarden per 100 ${eenheid}` },
    lees: () => {
      const uit = {}
      for (const stof of VOEDINGSSTOFFEN) uit[stof.sleutel] = leesGetal(velden[stof.sleutel].value)
      return uit
    }
  }
}

// Toont foutmeldingen in een foutvak.
export function toonFouten(foutVak, fouten) {
  foutVak.replaceChildren(el('ul', {}, fouten.map((f) => el('li', {}, f))))
  foutVak.scrollIntoView({ block: 'nearest' })
}
