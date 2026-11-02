// Dialoog om een barcode te scannen met de camera, of het nummer in te typen.

import { el } from './html.js'
import { openDialoog } from './dialoog.js'
import { schoneBarcode, isGeldigeBarcode } from '../berekeningen/barcode.js'
import { startScanner } from '../diensten/scanner.js'

// Uit: Promise met de barcode (tekst), of null als je annuleert.
export function openScanDialoog() {
  return new Promise((klaar) => {
    let uitkomst = null
    let scanner = null

    const video = el('video', { class: 'scan-video', playsinline: true, muted: true, 'aria-label': 'Camerabeeld' })
    const status = el('p', { class: 'scan-status', role: 'status' }, 'Camera starten…')
    const nummerVeld = el('input', {
      id: 'barcode-nummer', type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: 'bv. 8711327538481'
    })
    const foutVak = el('p', { class: 'fouten', role: 'alert' })

    function gevonden(code) {
      uitkomst = code
      if (navigator.vibrate) navigator.vibrate(60)
      sluit()
    }

    function typNummer(gebeurtenis) {
      gebeurtenis.preventDefault()
      const code = schoneBarcode(nummerVeld.value)
      if (!isGeldigeBarcode(code)) {
        foutVak.textContent = 'Dit is geen geldige barcode. Controleer de cijfers (8, 12 of 13 cijfers).'
        return
      }
      gevonden(code)
    }

    const { sluit } = openDialoog('Barcode scannen', [
      el('div', { class: 'scan-kader' }, video, el('div', { class: 'scan-lijn', 'aria-hidden': 'true' })),
      status,
      el('p', { class: 'hint' }, 'Alleen het barcodenummer wordt opgezocht bij Open Food Facts. Het camerabeeld blijft op je toestel.'),
      el('form', { onsubmit: typNummer, novalidate: true },
        el('div', { class: 'veld' },
          el('label', { for: 'barcode-nummer' }, 'Of typ het nummer onder de streepjes'),
          el('div', { class: 'naast-elkaar' }, nummerVeld, el('button', { type: 'submit', class: 'knop' }, 'Zoek'))
        ),
        foutVak
      ),
      el('div', { class: 'knoppen' }, el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'))
    ], () => {
      if (scanner) scanner.stop()
      klaar(uitkomst)
    })

    startScanner(video, gevonden)
      .then((s) => {
        scanner = s
        if (!video.isConnected) s.stop()   // dialoog al gesloten
        else status.textContent = 'Houd de barcode in het kader.'
      })
      .catch((fout) => {
        const geenToestemming = fout && (fout.name === 'NotAllowedError' || fout.name === 'SecurityError')
        status.textContent = geenToestemming
          ? 'Geen toegang tot de camera. Sta de camera toe in de instellingen, of typ het nummer hieronder.'
          : 'De camera kon niet starten. Typ het nummer hieronder.'
        video.hidden = true
      })
  })
}
