// Dialoogvensters (schuiven onderaan in beeld, handig met één hand).

import { el } from './html.js'

// Opent een dialoog met een titel en inhoud.
// Uit: { dialoog, sluit } — roep sluit() aan om hem te sluiten.
// "bijSluiten" wordt altijd aangeroepen als de dialoog dichtgaat (ook met de Esc-toets).
export function openDialoog(titel, inhoud, bijSluiten = () => {}) {
  const dialoog = el('dialog', { class: 'dialoog' },
    el('h2', { class: 'dialoog-titel' }, titel),
    inhoud
  )
  dialoog.addEventListener('close', () => {
    dialoog.remove()
    bijSluiten()
  })
  // Tik naast de dialoog (op de donkere achtergrond) = sluiten.
  dialoog.addEventListener('click', (gebeurtenis) => {
    if (gebeurtenis.target === dialoog) dialoog.close()
  })
  document.body.append(dialoog)
  dialoog.showModal()
  return { dialoog, sluit: () => dialoog.close() }
}

// Vraagt een bevestiging. Uit: Promise met true (ja) of false (nee).
export function bevestig({ titel, tekst, knopTekst = 'Ja', gevaarlijk = false }) {
  return new Promise((klaar) => {
    let antwoord = false
    const { sluit } = openDialoog(titel, [
      el('p', {}, tekst),
      el('div', { class: 'knoppen' },
        el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
        el('button', {
          type: 'button',
          class: gevaarlijk ? 'knop knop-gevaar' : 'knop knop-hoofd',
          onclick: () => { antwoord = true; sluit() }
        }, knopTekst)
      )
    ], () => klaar(antwoord))
  })
}
