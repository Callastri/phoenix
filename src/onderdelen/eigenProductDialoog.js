// Dialoog om een eigen product te maken of te bewerken.
// Ook gebruikt voor "eigen versie" van een NEVO-product: dan maak je een NIEUW
// eigen product met de NEVO-waarden als startpunt. Het NEVO-product blijft ongewijzigd.

import { el } from './html.js'
import { openDialoog, bevestig } from './dialoog.js'
import { maakWaardenVelden, naarVeld, toonFouten } from './waardenVelden.js'
import { leesGetal } from '../berekeningen/getallen.js'
import { bewaarEigenProduct, verwijderEigenProduct } from '../opslag/producten.js'
import { OngeldigeInvoer } from '../opslag/fouten.js'

// In:  { product }  — een bestaand eigen product (bewerken), of
//      { basis }    — een NEVO-product als startpunt, of niets (nieuw)
// Uit: Promise met { id } (opgeslagen), 'verwijderd' of null
export function openEigenProductDialoog({ product = null, basis = null } = {}) {
  return new Promise((klaar) => {
    let uitkomst = null
    const bron = product ?? basis
    const naamVeld = el('input', {
      id: 'product-naam', type: 'text', autocomplete: 'off', maxlength: '120',
      value: product ? product.naam : basis ? `${basis.naam} (eigen)` : ''
    })
    const eenheidVeld = el('select', { id: 'product-eenheid' },
      el('option', { value: 'g', selected: !bron || bron.eenheid === 'g' }, 'gram (vast)'),
      el('option', { value: 'ml', selected: bron?.eenheid === 'ml' }, 'ml (vloeibaar)')
    )
    const waarden = maakWaardenVelden(bron ? bron.waarden : null, 'product')
    const foutVak = el('div', { class: 'fouten', role: 'alert' })

    // Porties: een lijst rijen met naam + gewicht.
    const portieRijen = el('div', { class: 'portie-rijen' })
    function voegPortieRijToe(portie = { naam: '', gram: null }) {
      const rij = el('div', { class: 'portie-rij' },
        el('input', { type: 'text', class: 'portie-naam', placeholder: 'bv. stuk', 'aria-label': 'Naam van portie', value: portie.naam }),
        el('input', { type: 'text', class: 'portie-gram', inputmode: 'decimal', placeholder: 'gram', 'aria-label': 'Gewicht van portie', value: naarVeld(portie.gram) }),
        el('button', { type: 'button', class: 'knop knop-klein', 'aria-label': 'Portie weghalen', onclick: () => rij.remove() }, '×')
      )
      portieRijen.append(rij)
    }
    // Alleen porties van een eigen product overnemen (eigen NEVO-porties blijven bij NEVO).
    ;(product?.porties ?? []).forEach(voegPortieRijToe)

    function leesPorties() {
      return [...portieRijen.querySelectorAll('.portie-rij')]
        .map((rij) => ({ naam: rij.querySelector('.portie-naam').value.trim(), gram: leesGetal(rij.querySelector('.portie-gram').value) }))
        .filter((p) => p.naam !== '' || p.gram !== null)
    }

    async function opslaan(gebeurtenis) {
      gebeurtenis.preventDefault()
      try {
        const id = await bewaarEigenProduct({
          id: product ? product.ref.id : undefined,
          naam: naamVeld.value,
          eenheid: eenheidVeld.value,
          waarden: waarden.lees(),
          porties: leesPorties(),
          gebaseerdOpNevo: basis ? basis.ref.id : product?.gebaseerdOpNevo ?? null
        })
        uitkomst = { id }
        sluit()
      } catch (fout) {
        if (!(fout instanceof OngeldigeInvoer)) throw fout
        toonFouten(foutVak, fout.fouten)
      }
    }

    async function verwijder() {
      const zeker = await bevestig({
        titel: 'Product verwijderen?',
        tekst: `"${product.naam}" verwijderen? Wat al in je dagboek staat, blijft staan.`,
        knopTekst: 'Verwijderen', gevaarlijk: true
      })
      if (!zeker) return
      await verwijderEigenProduct(product.ref.id)
      uitkomst = 'verwijderd'
      sluit()
    }

    eenheidVeld.addEventListener('change', () => waarden.zetEenheid(eenheidVeld.value))
    waarden.zetEenheid(eenheidVeld.value)

    const formulier = el('form', { onsubmit: opslaan, novalidate: true },
      basis ? el('p', { class: 'hint' }, 'Je maakt een eigen product op basis van NEVO. Het NEVO-product zelf blijft ongewijzigd.') : null,
      el('div', { class: 'veld' }, el('label', { for: 'product-naam' }, 'Naam'), naamVeld),
      el('div', { class: 'veld' }, el('label', { for: 'product-eenheid' }, 'Meten in'), eenheidVeld),
      waarden.element,
      el('h3', {}, 'Porties (optioneel)'),
      el('p', { class: 'hint' }, 'Bijvoorbeeld "stuk" = 120 gram. Dan kun je straks "2 stuks" kiezen.'),
      portieRijen,
      el('button', { type: 'button', class: 'knop knop-klein', onclick: () => voegPortieRijToe() }, '+ Portie'),
      foutVak,
      el('div', { class: 'knoppen' },
        product ? el('button', { type: 'button', class: 'knop knop-gevaar', onclick: verwijder }, 'Verwijderen') : null,
        el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
        el('button', { type: 'submit', class: 'knop knop-hoofd' }, 'Opslaan')
      )
    )
    const titel = product ? 'Eigen product bewerken' : 'Nieuw eigen product'
    const { sluit } = openDialoog(titel, formulier, () => klaar(uitkomst))
    if (!product) naamVeld.focus()
  })
}
