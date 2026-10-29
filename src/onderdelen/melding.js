// Korte melding bovenaan het scherm die vanzelf verdwijnt (bijvoorbeeld "Opgeslagen").

import { el } from './html.js'

let timer = null

export function toonMelding(tekst, soort = 'gewoon') {
  document.querySelector('.melding')?.remove()
  clearTimeout(timer)
  const melding = el('div', { class: `melding melding-${soort}`, role: 'status' }, tekst)
  document.body.append(melding)
  timer = setTimeout(() => melding.remove(), 3500)
}
