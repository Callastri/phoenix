// Dialoog om een dagboekregel toe te voegen of aan te passen (handmatige invoer).

import { el } from './html.js'
import { openDialoog, bevestig } from './dialoog.js'
import { VOEDINGSSTOFFEN } from '../gegevens/voedingsstoffen.js'
import { MAALTIJDEN } from '../gegevens/maaltijden.js'
import { leesGetal, toonGetal } from '../berekeningen/getallen.js'
import { waardenVoorHoeveelheid } from '../berekeningen/voeding.js'
import { voegRegelToe, werkRegelBij, verwijderRegel } from '../opslag/dagboek.js'
import { OngeldigeInvoer } from '../opslag/fouten.js'

// Zet een opgeslagen getal terug in een invoerveld (12.5 → "12,5"; onbekend → leeg).
function naarVeld(getal) {
  return getal === null || getal === undefined ? '' : String(getal).replace('.', ',')
}

// Opent de dialoog.
// In:  { datum, maaltijd, regel }  — "regel" alleen bij aanpassen
// Uit: Promise met 'opgeslagen', 'verwijderd' of null (geannuleerd)
export function openRegelDialoog({ datum, maaltijd, regel = null }) {
  return new Promise((klaar) => {
    let uitkomst = null
    const bestaand = regel !== null

    const naamVeld = el('input', {
      id: 'veld-naam', type: 'text', required: true, autocomplete: 'off',
      maxlength: '120', value: bestaand ? regel.naam : ''
    })
    const maaltijdVeld = el('select', { id: 'veld-maaltijd' },
      MAALTIJDEN.map((m) => el('option', { value: m.sleutel, selected: m.sleutel === (bestaand ? regel.maaltijd : maaltijd) }, m.naam))
    )
    const hoeveelheidVeld = el('input', {
      id: 'veld-hoeveelheid', type: 'text', inputmode: 'decimal', autocomplete: 'off',
      value: bestaand ? naarVeld(regel.hoeveelheid) : '100'
    })
    const eenheidVeld = el('select', { id: 'veld-eenheid', 'aria-label': 'Eenheid' },
      el('option', { value: 'g', selected: !bestaand || regel.eenheid === 'g' }, 'gram'),
      el('option', { value: 'ml', selected: bestaand && regel.eenheid === 'ml' }, 'ml')
    )

    const waardeVelden = {}
    const waardeRijen = VOEDINGSSTOFFEN.map((stof) => {
      const veld = el('input', {
        id: `veld-${stof.sleutel}`, type: 'text', inputmode: 'decimal', autocomplete: 'off',
        placeholder: 'onbekend', value: bestaand ? naarVeld(regel.waarden[stof.sleutel]) : ''
      })
      waardeVelden[stof.sleutel] = veld
      return el('div', { class: 'veld-rij' },
        el('label', { for: veld.id }, `${stof.naam} (${stof.eenheid})`),
        veld
      )
    })

    const legende = el('legend', {})
    const voorbeeld = el('p', { class: 'voorbeeld', 'aria-live': 'polite' })
    const foutVak = el('div', { class: 'fouten', role: 'alert' })

    // Werkt "per 100 g/ml" en de berekende kcal voor deze hoeveelheid bij.
    function werkVoorbeeldBij() {
      legende.textContent = `Voedingswaarden per 100 ${eenheidVeld.value}`
      const hoeveelheid = leesGetal(hoeveelheidVeld.value)
      const kcal = leesGetal(waardeVelden.kcal.value)
      if (hoeveelheid > 0 && kcal >= 0 && kcal !== null) {
        const waarden = waardenVoorHoeveelheid({ kcal }, hoeveelheid)
        voorbeeld.textContent = `Deze hoeveelheid: ${toonGetal(waarden.kcal)} kcal`
      } else {
        voorbeeld.textContent = ''
      }
    }

    // Leest het formulier uit en bewaart de regel.
    async function opslaan(gebeurtenis) {
      gebeurtenis.preventDefault()
      const waarden = {}
      for (const stof of VOEDINGSSTOFFEN) waarden[stof.sleutel] = leesGetal(waardeVelden[stof.sleutel].value)
      const invoer = {
        datum: bestaand ? regel.datum : datum,
        maaltijd: maaltijdVeld.value,
        naam: naamVeld.value,
        hoeveelheid: leesGetal(hoeveelheidVeld.value),
        eenheid: eenheidVeld.value,
        waarden
      }
      try {
        if (bestaand) await werkRegelBij(regel.id, invoer)
        else await voegRegelToe(invoer)
        uitkomst = 'opgeslagen'
        sluit()
      } catch (fout) {
        if (!(fout instanceof OngeldigeInvoer)) throw fout
        foutVak.replaceChildren(el('ul', {}, fout.fouten.map((f) => el('li', {}, f))))
        foutVak.scrollIntoView({ block: 'nearest' })
      }
    }

    async function verwijder() {
      const zeker = await bevestig({
        titel: 'Verwijderen?', tekst: `"${regel.naam}" uit het dagboek verwijderen?`,
        knopTekst: 'Verwijderen', gevaarlijk: true
      })
      if (!zeker) return
      await verwijderRegel(regel.id)
      uitkomst = 'verwijderd'
      sluit()
    }

    const formulier = el('form', { onsubmit: opslaan, novalidate: true },
      el('div', { class: 'veld' }, el('label', { for: 'veld-naam' }, 'Naam'), naamVeld),
      el('div', { class: 'veld' }, el('label', { for: 'veld-maaltijd' }, 'Maaltijd'), maaltijdVeld),
      el('div', { class: 'veld' },
        el('label', { for: 'veld-hoeveelheid' }, 'Hoeveelheid'),
        el('div', { class: 'naast-elkaar' }, hoeveelheidVeld, eenheidVeld)
      ),
      voorbeeld,
      el('fieldset', { class: 'waarden' },
        legende,
        el('p', { class: 'hint' }, 'Weet je een waarde niet? Laat het veld leeg. Dan telt die niet mee en zie je "–".'),
        waardeRijen
      ),
      foutVak,
      el('div', { class: 'knoppen' },
        bestaand ? el('button', { type: 'button', class: 'knop knop-gevaar', onclick: verwijder }, 'Verwijderen') : null,
        el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
        el('button', { type: 'submit', class: 'knop knop-hoofd' }, 'Opslaan')
      )
    )
    formulier.addEventListener('input', werkVoorbeeldBij)
    werkVoorbeeldBij()

    const { sluit } = openDialoog(bestaand ? 'Aanpassen' : 'Toevoegen', formulier, () => klaar(uitkomst))
    if (!bestaand) naamVeld.focus()
  })
}
