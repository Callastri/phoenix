// Startpunt van de app.
// Kiest het juiste scherm op basis van het adres, bijvoorbeeld:
//   #/dagboek             → dagboek van vandaag
//   #/dagboek/2026-10-29  → dagboek van 29 oktober 2026
//   #/meer                → back-up, instellingen, over

import './stijl/thema.css'
import './stijl/basis.css'
import './stijl/onderdelen.css'
import './stijl/schermen.css'

import { toonDagboek } from './schermen/dagboek.js'
import { toonMeer } from './schermen/meer.js'
import { toonToevoegen } from './schermen/toevoegen.js'
import { binnenkort } from './schermen/binnenkort.js'
import { toonInstallUitlegBijEersteGebruik } from './schermen/installeren.js'
import { vraagPermanenteOpslag } from './diensten/toestel.js'

// Welk scherm bij welk adres hoort.
const SCHERMEN = {
  dagboek: toonDagboek,
  toevoegen: toonToevoegen,
  gewicht: binnenkort('Gewicht', 4),
  beweging: binnenkort('Beweging', 4),
  overzicht: binnenkort('Overzicht', 5),
  meer: toonMeer
}

const inhoud = document.getElementById('inhoud')

// Toont het scherm dat bij het huidige adres hoort.
async function toonScherm() {
  const [naam, ...rest] = location.hash.replace(/^#\/?/, '').split('/')
  const scherm = SCHERMEN[naam] ? naam : 'dagboek'
  // "Toevoegen" hoort bij het dagboek in de navigatie onderaan.
  const tab = scherm === 'toevoegen' ? 'dagboek' : scherm
  for (const link of document.querySelectorAll('.navigatie a')) {
    if (link.dataset.scherm === tab) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  }
  window.scrollTo(0, 0)
  try {
    await SCHERMEN[scherm](inhoud, rest)
  } catch (fout) {
    console.error(fout)
    inhoud.textContent = 'Er ging iets mis. Probeer de app opnieuw te openen.'
  }
}

window.addEventListener('hashchange', toonScherm)
toonScherm()

// Vraag de browser om de gegevens niet te wissen, en toon (op iPhone) de installatie-uitleg.
vraagPermanenteOpslag()
toonInstallUitlegBijEersteGebruik()
