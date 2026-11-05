// Scherm: gewicht invoeren, grafiek en lijst met 7-daags gemiddelde.

import { el } from '../onderdelen/html.js'
import { openDialoog, bevestig } from '../onderdelen/dialoog.js'
import { toonMelding } from '../onderdelen/melding.js'
import { toonFouten } from '../onderdelen/waardenVelden.js'
import { maakGewichtGrafiek } from '../onderdelen/gewichtGrafiek.js'
import { vandaag, verschuifDag, toonDatum } from '../berekeningen/datum.js'
import { leesGetal, toonGetal } from '../berekeningen/getallen.js'
import { metingenMetGemiddelde, zevenDaagsGemiddelde, trend } from '../berekeningen/gewicht.js'
import { bewaarGewicht, verwijderGewicht, alleGewichten } from '../opslag/gewicht.js'
import { OngeldigeInvoer } from '../opslag/fouten.js'

// Periodes voor de grafiek.
const PERIODES = [
  { dagen: 30, naam: '30 dagen' },
  { dagen: 90, naam: '90 dagen' },
  { dagen: null, naam: 'Alles' }
]
let gekozenPeriode = 30

// Formulier om een meting toe te voegen (of te vervangen op dezelfde datum).
function maakInvoer(herteken) {
  const datumVeld = el('input', { id: 'gewicht-datum', type: 'date', value: vandaag(), max: vandaag() })
  const kgVeld = el('input', { id: 'gewicht-kg', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'bv. 72,4' })
  const foutVak = el('div', { class: 'fouten', role: 'alert' })
  async function opslaan(e) {
    e.preventDefault()
    try {
      await bewaarGewicht(datumVeld.value, leesGetal(kgVeld.value))
      toonMelding('Gewicht bewaard')
      herteken()
    } catch (fout) {
      if (!(fout instanceof OngeldigeInvoer)) throw fout
      toonFouten(foutVak, fout.fouten)
    }
  }
  return el('form', { class: 'kaart', onsubmit: opslaan, novalidate: true },
    el('h2', {}, 'Gewicht invoeren'),
    el('div', { class: 'naast-elkaar' },
      el('div', { class: 'veld' }, el('label', { for: 'gewicht-datum' }, 'Datum'), datumVeld),
      el('div', { class: 'veld' }, el('label', { for: 'gewicht-kg' }, 'Gewicht (kg)'), kgVeld)
    ),
    el('p', { class: 'hint' }, 'Eén meting per dag. Een nieuwe meting op dezelfde dag vervangt de oude.'),
    foutVak,
    el('button', { type: 'submit', class: 'knop knop-hoofd knop-breed' }, 'Opslaan')
  )
}

// Samenvatting: laatste meting, gemiddelde en trend.
function maakSamenvatting(metingen) {
  if (metingen.length === 0) return null
  const laatste = metingen[metingen.length - 1]
  const gem = zevenDaagsGemiddelde(metingen, vandaag())
  const verschil = trend(metingen, vandaag())
  let trendTekst = 'Nog te weinig metingen voor een trend (minstens één per week, twee weken lang).'
  if (verschil !== null) {
    const richting = Math.abs(verschil) < 0.05 ? 'gelijk gebleven' : verschil < 0 ? `${toonGetal(-verschil, 1)} kg lager` : `${toonGetal(verschil, 1)} kg hoger`
    trendTekst = `Gemiddelde van deze week tegenover vorige week: ${richting}.`
  }
  return el('section', { class: 'kaart' },
    el('dl', { class: 'totaal-raster' },
      el('div', {}, el('dt', {}, 'Laatste meting'), el('dd', {}, `${toonGetal(laatste.kg, 1)} kg`)),
      el('div', {}, el('dt', {}, 'Gem. 7 dagen'), el('dd', {}, gem === null ? '–' : `${toonGetal(gem, 1)} kg`)),
      el('div', {}, el('dt', {}, 'Datum'), el('dd', {}, toonDatum(laatste.datum)))
    ),
    el('p', { class: 'hint' }, trendTekst)
  )
}

// Grafiek met keuze van de periode.
function maakGrafiekBlok(metingen, herteken) {
  if (metingen.length < 2) return el('section', { class: 'kaart' }, el('p', { class: 'hint' }, 'De grafiek verschijnt vanaf twee metingen.'))
  const vanaf = gekozenPeriode ? verschuifDag(vandaag(), -(gekozenPeriode - 1)) : '0000-00-00'
  const punten = metingenMetGemiddelde(metingen).filter((m) => m.datum >= vanaf).reverse()
  return el('section', { class: 'kaart' },
    el('div', { class: 'tabs', role: 'group', 'aria-label': 'Periode' },
      PERIODES.map((p) => el('button', {
        type: 'button', class: 'tab', 'aria-pressed': String(p.dagen === gekozenPeriode),
        onclick: () => { gekozenPeriode = p.dagen; herteken() }
      }, p.naam))
    ),
    punten.length > 0 ? maakGewichtGrafiek(punten) : el('p', { class: 'hint' }, 'Geen metingen in deze periode.')
  )
}

// Een meting aanpassen of verwijderen.
function openMeting(meting, herteken) {
  const kgVeld = el('input', { id: 'meting-kg', type: 'text', inputmode: 'decimal', value: String(meting.kg).replace('.', ',') })
  const foutVak = el('div', { class: 'fouten', role: 'alert' })
  const { sluit } = openDialoog(`Gewicht ${toonDatum(meting.datum)}`, el('form', {
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault()
      try {
        await bewaarGewicht(meting.datum, leesGetal(kgVeld.value))
        sluit(); toonMelding('Opgeslagen'); herteken()
      } catch (fout) {
        if (!(fout instanceof OngeldigeInvoer)) throw fout
        toonFouten(foutVak, fout.fouten)
      }
    }
  },
    el('div', { class: 'veld' }, el('label', { for: 'meting-kg' }, 'Gewicht (kg)'), kgVeld),
    foutVak,
    el('div', { class: 'knoppen' },
      el('button', {
        type: 'button', class: 'knop knop-gevaar',
        onclick: async () => {
          if (!(await bevestig({ titel: 'Verwijderen?', tekst: 'Deze meting verwijderen?', knopTekst: 'Verwijderen', gevaarlijk: true }))) return
          await verwijderGewicht(meting.id); sluit(); toonMelding('Verwijderd'); herteken()
        }
      }, 'Verwijderen'),
      el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
      el('button', { type: 'submit', class: 'knop knop-hoofd' }, 'Opslaan')
    )
  ))
}

// De lijst (ook de tabelweergave van de grafiek).
function maakLijst(metingen, herteken) {
  if (metingen.length === 0) return null
  return el('section', { class: 'kaart' },
    el('h2', {}, 'Alle metingen'),
    el('table', { class: 'tabel' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Datum'), el('th', { scope: 'col' }, 'Gewicht'), el('th', { scope: 'col' }, 'Gem. 7 dagen'))),
      el('tbody', {}, metingenMetGemiddelde(metingen).map((m) => el('tr', {},
        el('td', {}, el('button', { type: 'button', class: 'link-knop', onclick: () => openMeting(m, herteken) }, toonDatum(m.datum))),
        el('td', {}, `${toonGetal(m.kg, 1)} kg`),
        el('td', {}, m.gemiddelde === null ? '–' : `${toonGetal(m.gemiddelde, 1)} kg`)
      )))
    ),
    el('p', { class: 'hint' }, 'Tik op een datum om aan te passen of te verwijderen.')
  )
}

export async function toonGewicht(container) {
  const herteken = () => toonGewicht(container)
  const metingen = await alleGewichten()
  container.replaceChildren(...[
    el('h1', { class: 'schermtitel' }, 'Gewicht'),
    maakInvoer(herteken),
    maakSamenvatting(metingen),
    maakGrafiekBlok(metingen, herteken),
    maakLijst(metingen, herteken)
  ].filter(Boolean))
}
