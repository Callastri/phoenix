// Scherm: iets toevoegen aan een maaltijd.
// Zoeken (NEVO + eigen producten), of kiezen uit Recent, Favorieten of Eigen producten.
// Adres: #/toevoegen/<datum>/<maaltijd>, bijvoorbeeld #/toevoegen/2026-10-29/ontbijt

import { el } from '../onderdelen/html.js'
import { openProductDialoog } from '../onderdelen/productDialoog.js'
import { openRegelDialoog } from '../onderdelen/regelDialoog.js'
import { openEigenProductDialoog } from '../onderdelen/eigenProductDialoog.js'
import { toonMelding } from '../onderdelen/melding.js'
import { MAALTIJD_SLEUTELS, maaltijdNaam } from '../gegevens/maaltijden.js'
import { isGeldigeDatum } from '../berekeningen/datum.js'
import { toonGetal } from '../berekeningen/getallen.js'
import { recenteRegels } from '../opslag/dagboek.js'
import { alleFavorieten } from '../opslag/producten.js'
import { zoekAlles, haalProduct, bronTekst, eigenProductenGesorteerd } from '../diensten/producten.js'
import { laadNevo, nevoBronvermelding } from '../diensten/nevo.js'

const TABS = [
  { sleutel: 'recent', naam: 'Recent' },
  { sleutel: 'favorieten', naam: 'Favorieten' },
  { sleutel: 'eigen', naam: 'Eigen' }
]

// Onthoudt de gekozen tab zolang de app open is.
let gekozenTab = 'recent'
let zoekterm = ''

// Eén regel in de lijst met resultaten.
function resultaat(naam, onderschrift, bijTik) {
  return el('li', {},
    el('button', { type: 'button', class: 'resultaat', onclick: bijTik },
      el('span', { class: 'regel-naam' }, naam),
      el('span', { class: 'regel-hoeveelheid' }, onderschrift)
    )
  )
}

function onderschriftVan(product) {
  const kcal = product.waarden.kcal
  return `${bronTekst(product)} · ${kcal === null ? '–' : toonGetal(kcal)} kcal per 100 ${product.eenheid}`
}

export async function toonToevoegen(container, [datum, maaltijd] = []) {
  if (!isGeldigeDatum(datum) || !MAALTIJD_SLEUTELS.includes(maaltijd)) {
    location.replace('#/dagboek')
    return
  }
  zoekterm = ''   // elke keer met een leeg zoekveld beginnen
  const terugNaarDagboek = () => { location.hash = `#/dagboek/${datum}` }
  const lijst = el('ul', { class: 'resultaten', 'aria-live': 'polite' })
  const voet = el('p', { class: 'hint bronvermelding' })

  // Product gekozen: hoeveelheid kiezen en toevoegen.
  async function kiesProduct(product, voorkeur = null) {
    const uitkomst = await openProductDialoog({ product, datum, maaltijd, voorkeur })
    if (uitkomst === 'opgeslagen') {
      toonMelding('Toegevoegd')
      terugNaarDagboek()
    } else if (uitkomst && uitkomst.bewerk) {
      const bewerk = uitkomst.bewerk
      const resultaatBewerken = bewerk.bron === 'nevo'
        ? await openEigenProductDialoog({ basis: bewerk })
        : await openEigenProductDialoog({ product: bewerk })
      await toonLijst()
      if (resultaatBewerken && resultaatBewerken.id) {
        const nieuw = await haalProduct({ soort: 'eigen', id: resultaatBewerken.id })
        if (nieuw) await kiesProduct(nieuw)
      }
    }
  }

  // Eerder handmatig ingevoerd: velden alvast invullen.
  async function kiesHandmatig(sjabloon = null) {
    const uitkomst = await openRegelDialoog({ datum, maaltijd, sjabloon })
    if (uitkomst === 'opgeslagen') { toonMelding('Toegevoegd'); terugNaarDagboek() }
  }

  async function nieuwEigenProduct() {
    const uitkomst = await openEigenProductDialoog()
    if (uitkomst && uitkomst.id) {
      const nieuw = await haalProduct({ soort: 'eigen', id: uitkomst.id })
      await toonLijst()
      if (nieuw) await kiesProduct(nieuw)
    }
  }

  // Vult de lijst: zoekresultaten, of de gekozen tab.
  async function toonLijst() {
    let items = []
    let leeg = ''
    if (zoekterm.trim() !== '') {
      const gevonden = await zoekAlles(zoekterm)
      items = gevonden.map((p) => resultaat(p.naam, onderschriftVan(p), () => kiesProduct(p)))
      leeg = 'Niets gevonden. Probeer een ander woord, of voeg een eigen product toe.'
    } else if (gekozenTab === 'recent') {
      const regels = await recenteRegels()
      for (const regel of regels) {
        const product = regel.productRef ? await haalProduct(regel.productRef) : null
        if (product) items.push(resultaat(product.naam, onderschriftVan(product), () => kiesProduct(product, regel)))
        else items.push(resultaat(regel.naam, 'Eerder ingevoerd', () => kiesHandmatig(regel)))
      }
      leeg = 'Nog niets gebruikt. Zoek hierboven, of voer iets handmatig in.'
    } else if (gekozenTab === 'favorieten') {
      for (const ref of await alleFavorieten()) {
        const product = await haalProduct(ref)
        if (product) items.push(resultaat(product.naam, onderschriftVan(product), () => kiesProduct(product)))
      }
      items.sort((a, b) => a.textContent.localeCompare(b.textContent, 'nl'))
      leeg = 'Nog geen favorieten. Tik bij een product op ☆ Favoriet.'
    } else {
      const eigen = await eigenProductenGesorteerd()
      items = eigen.map((p) => resultaat(p.naam, onderschriftVan(p), () => kiesProduct(p)))
      leeg = 'Nog geen eigen producten.'
    }
    lijst.replaceChildren(...(items.length ? items : [el('li', { class: 'leeg' }, leeg)]))
  }

  // Zoekveld: zoekt terwijl je typt (met een korte pauze).
  let timer = null
  const zoekVeld = el('input', {
    type: 'search', class: 'zoekveld', placeholder: 'Zoek, bijvoorbeeld appel', value: zoekterm,
    'aria-label': 'Zoek een product', autocomplete: 'off', enterkeyhint: 'search'
  })
  zoekVeld.addEventListener('input', () => {
    clearTimeout(timer)
    timer = setTimeout(() => { zoekterm = zoekVeld.value; tabBalk.hidden = zoekterm.trim() !== ''; toonLijst() }, 150)
  })

  const tabBalk = el('div', { class: 'tabs', role: 'tablist' },
    TABS.map((tab) => el('button', {
      type: 'button', role: 'tab', class: 'tab', 'aria-selected': String(tab.sleutel === gekozenTab),
      onclick: (e) => {
        gekozenTab = tab.sleutel
        for (const knop of tabBalk.querySelectorAll('.tab')) knop.setAttribute('aria-selected', String(knop === e.currentTarget))
        toonLijst()
      }
    }, tab.naam))
  )
  tabBalk.hidden = zoekterm.trim() !== ''

  container.replaceChildren(
    el('header', { class: 'scherm-kop' },
      el('button', { type: 'button', class: 'knop-rond', 'aria-label': 'Terug naar dagboek', onclick: terugNaarDagboek }, '‹'),
      el('h1', { class: 'schermtitel' }, `Toevoegen aan ${maaltijdNaam(maaltijd).toLowerCase()}`)
    ),
    zoekVeld,
    tabBalk,
    lijst,
    el('div', { class: 'knoppen-onder' },
      el('button', { type: 'button', class: 'knop', onclick: () => kiesHandmatig() }, 'Handmatig invoeren'),
      el('button', { type: 'button', class: 'knop', onclick: nieuwEigenProduct }, 'Nieuw eigen product')
    ),
    voet
  )
  await toonLijst()

  const nevo = await laadNevo()
  voet.textContent = nevo
    ? nevoBronvermelding(nevo.versie)
    : 'De NEVO-tabel is nog niet toegevoegd aan de app. Je kunt wel eigen producten maken.'
}
