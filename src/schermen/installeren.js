// Uitleg: de app op het beginscherm zetten.
// Op iPhone is dit belangrijk: Safari kan gegevens van websites wissen
// na een tijd zonder gebruik. Als app op het beginscherm gebeurt dat niet.

import { el } from '../onderdelen/html.js'
import { openDialoog } from '../onderdelen/dialoog.js'
import { isIos, isGeinstalleerd } from '../diensten/toestel.js'
import { leesInstelling, bewaarInstelling } from '../opslag/instellingen.js'

// Toont de uitleg. Uit: Promise die klaar is als de uitleg gesloten wordt.
export function toonInstallUitleg() {
  return new Promise((klaar) => {
    const inhoud = isIos()
      ? [
          el('ol', { class: 'stappen' },
            el('li', {}, 'Tik in Safari op de Deel-knop (vierkantje met pijl omhoog). Zie je die niet? Tik eerst op ••• .'),
            el('li', {}, 'Kies "Zet op beginscherm". Staat het er niet bij? Scroll iets naar beneden.'),
            el('li', {}, 'Tik op "Voeg toe".'),
            el('li', {}, 'Open de app voortaan via het icoon op je beginscherm.')
          ),
          el('h3', {}, 'Waarom?'),
          el('p', {}, 'Safari kan gegevens van websites wissen als je ze een tijd niet gebruikt. Als app op je beginscherm gebeurt dat niet.'),
          el('p', { class: 'let-op' },
            el('strong', {}, 'Let op: '),
            'wat je hier in Safari invoert, zie je niet terug in de app op je beginscherm. Zet de app dus eerst op je beginscherm en begin daarna pas.')
        ]
      : [
          el('p', {}, 'Op Android: tik in Chrome op het menu (⋮) en kies "App installeren" of "Toevoegen aan startscherm".'),
          el('p', {}, 'Zo open je de app als gewone app, en blijven je gegevens beter bewaard.')
        ]

    const { sluit } = openDialoog('Zet de app op je beginscherm', [
      ...inhoud,
      el('div', { class: 'knoppen' },
        el('button', { type: 'button', class: 'knop knop-hoofd', onclick: () => sluit() }, 'Begrepen')
      )
    ], klaar)
  })
}

// Toont de uitleg automatisch één keer, bij het eerste gebruik op iPhone in Safari.
export async function toonInstallUitlegBijEersteGebruik() {
  if (!isIos() || isGeinstalleerd()) return
  if (await leesInstelling('installUitlegGezien', false)) return
  await toonInstallUitleg()
  await bewaarInstelling('installUitlegGezien', true)
}
