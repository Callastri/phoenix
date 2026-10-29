// Dialoog om eigen porties bij een NEVO-product te beheren
// (bijvoorbeeld "snee" = 35 g). Het NEVO-product zelf blijft ongewijzigd.

import { el } from './html.js'
import { openDialoog } from './dialoog.js'
import { toonFouten } from './waardenVelden.js'
import { leesGetal, toonGetal } from '../berekeningen/getallen.js'
import { voegNevoPortieToe, verwijderNevoPortie, portiesVoorNevo } from '../opslag/producten.js'
import { OngeldigeInvoer } from '../opslag/fouten.js'

// Uit: Promise die klaar is als de dialoog sluit.
export function openNevoPortieDialoog(product) {
  return new Promise(async (klaar) => {
    const eenheid = product.eenheid
    const lijst = el('ul', { class: 'portie-lijst' })
    const naamVeld = el('input', { id: 'portie-naam', type: 'text', autocomplete: 'off', placeholder: 'bv. snee, stuk, glas' })
    const gramVeld = el('input', { id: 'portie-gram', type: 'text', inputmode: 'decimal', autocomplete: 'off' })
    const foutVak = el('div', { class: 'fouten', role: 'alert' })

    async function vulLijst() {
      const porties = await portiesVoorNevo(product.ref.id)
      lijst.replaceChildren(...porties.map((p) => el('li', {},
        el('span', {}, `${p.naam} = ${toonGetal(p.gram, p.gram % 1 ? 1 : 0)} ${eenheid}`),
        el('button', {
          type: 'button', class: 'knop knop-klein', 'aria-label': `${p.naam} verwijderen`,
          onclick: async () => { await verwijderNevoPortie(p.id); vulLijst() }
        }, 'Verwijder')
      )))
    }

    async function voegToe(gebeurtenis) {
      gebeurtenis.preventDefault()
      try {
        await voegNevoPortieToe(product.ref.id, naamVeld.value, leesGetal(gramVeld.value))
        naamVeld.value = ''
        gramVeld.value = ''
        foutVak.replaceChildren()
        await vulLijst()
      } catch (fout) {
        if (!(fout instanceof OngeldigeInvoer)) throw fout
        toonFouten(foutVak, fout.fouten)
      }
    }

    await vulLijst()
    const { sluit } = openDialoog(`Porties: ${product.naam}`, el('form', { onsubmit: voegToe, novalidate: true },
      el('p', { class: 'hint' }, 'Dit zijn je eigen porties. Ze worden niet aan de NEVO-gegevens toegevoegd.'),
      lijst,
      el('div', { class: 'veld' }, el('label', { for: 'portie-naam' }, 'Naam van de portie'), naamVeld),
      el('div', { class: 'veld' }, el('label', { for: 'portie-gram' }, `Hoeveel ${eenheid === 'ml' ? 'ml' : 'gram'} is één portie?`), gramVeld),
      foutVak,
      el('div', { class: 'knoppen' },
        el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Klaar'),
        el('button', { type: 'submit', class: 'knop knop-hoofd' }, 'Portie toevoegen')
      )
    ), klaar)
  })
}
