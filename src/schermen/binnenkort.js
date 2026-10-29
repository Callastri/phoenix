// Tijdelijk scherm voor onderdelen die in een latere fase komen.

import { el } from '../onderdelen/html.js'

// Maakt een scherm-functie voor een onderdeel dat nog niet klaar is.
export function binnenkort(titel, fase) {
  return async (container) => {
    container.replaceChildren(
      el('h1', { class: 'schermtitel' }, titel),
      el('section', { class: 'kaart' }, el('p', {}, `Dit onderdeel komt in fase ${fase}.`))
    )
  }
}
