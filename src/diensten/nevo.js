// Laadt de NEVO-tabel (public/nevo.json) die met de app meekomt.
// Het bestand komt van de eigen website; er gaat niets naar buiten.
// Ontbreekt het bestand, dan werkt de app gewoon verder met eigen producten.

import { nevoNaarProducten } from '../berekeningen/nevo.js'

let laden = null

// Uit: { versie, producten, perCode } of null als de NEVO-tabel er (nog) niet is.
export function laadNevo() {
  if (!laden) {
    laden = (async () => {
      try {
        const antwoord = await fetch(`${import.meta.env.BASE_URL}nevo.json`)
        if (!antwoord.ok) return null
        const bestand = await antwoord.json()
        const producten = nevoNaarProducten(bestand)
        const perCode = new Map(producten.map((p) => [p.ref.id, p]))
        return { versie: bestand.versie, producten, perCode }
      } catch (fout) {
        console.error('NEVO-tabel kon niet geladen worden', fout)
        return null
      }
    })()
  }
  return laden
}

// De bronvermelding die de voorwaarden van RIVM vragen.
export function nevoBronvermelding(versie) {
  return `Gebaseerd op gegevens van NEVO-online versie ${versie}, RIVM, Bilthoven en andere gegevens.`
}
