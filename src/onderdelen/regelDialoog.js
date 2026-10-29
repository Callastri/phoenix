// Dialoog om een dagboekregel handmatig toe te voegen of aan te passen
// (zonder product uit de NEVO-tabel of eigen producten).

import { el } from './html.js'
import { openDialoog, bevestig } from './dialoog.js'
import { maakWaardenVelden, naarVeld, toonFouten } from './waardenVelden.js'
import { MAALTIJDEN } from '../gegevens/maaltijden.js'
import { leesGetal, toonGetal } from '../berekeningen/getallen.js'
import { waardenVoorHoeveelheid } from '../berekeningen/voeding.js'
import { voegRegelToe, werkRegelBij, verwijderRegel } from '../opslag/dagboek.js'
import { OngeldigeInvoer } from '../opslag/fouten.js'

// Opent de dialoog.
// In:  { datum, maaltijd, regel, sjabloon }
//      - regel: alleen bij aanpassen
//      - sjabloon: een eerdere regel om de velden alvast mee te vullen (nieuwe regel)
// Uit: Promise met 'opgeslagen', 'verwijderd' of null (geannuleerd)
export function openRegelDialoog({ datum, maaltijd, regel = null, sjabloon = null }) {
  return new Promise((klaar) => {
    let uitkomst = null
    const bestaand = regel !== null
    const begin = regel ?? sjabloon

    const naamVeld = el('input', {
      id: 'veld-naam', type: 'text', required: true, autocomplete: 'off',
      maxlength: '120', value: begin ? begin.naam : ''
    })
    const maaltijdVeld = el('select', { id: 'veld-maaltijd' },
      MAALTIJDEN.map((m) => el('option', { value: m.sleutel, selected: m.sleutel === (bestaand ? regel.maaltijd : maaltijd) }, m.naam))
    )
    const hoeveelheidVeld = el('input', {
      id: 'veld-hoeveelheid', type: 'text', inputmode: 'decimal', autocomplete: 'off',
      value: begin ? naarVeld(begin.hoeveelheid) : '100'
    })
    const eenheidVeld = el('select', { id: 'veld-eenheid', 'aria-label': 'Eenheid' },
      el('option', { value: 'g', selected: !begin || begin.eenheid === 'g' }, 'gram'),
      el('option', { value: 'ml', selected: begin?.eenheid === 'ml' }, 'ml')
    )
    const waarden = maakWaardenVelden(begin ? begin.waarden : null)
    const voorbeeld = el('p', { class: 'voorbeeld', 'aria-live': 'polite' })
    const foutVak = el('div', { class: 'fouten', role: 'alert' })

    // Werkt "per 100 g/ml" en de berekende kcal voor deze hoeveelheid bij.
    function werkVoorbeeldBij() {
      waarden.zetEenheid(eenheidVeld.value)
      const hoeveelheid = leesGetal(hoeveelheidVeld.value)
      const kcal = leesGetal(waarden.velden.kcal.value)
      if (hoeveelheid > 0 && kcal !== null && kcal >= 0) {
        voorbeeld.textContent = `Deze hoeveelheid: ${toonGetal(waardenVoorHoeveelheid({ kcal }, hoeveelheid).kcal)} kcal`
      } else {
        voorbeeld.textContent = ''
      }
    }

    // Leest het formulier uit en bewaart de regel.
    async function opslaan(gebeurtenis) {
      gebeurtenis.preventDefault()
      const invoer = {
        datum: bestaand ? regel.datum : datum,
        maaltijd: maaltijdVeld.value,
        productRef: null,
        naam: naamVeld.value,
        hoeveelheid: leesGetal(hoeveelheidVeld.value),
        eenheid: eenheidVeld.value,
        waarden: waarden.lees()
      }
      try {
        if (bestaand) await werkRegelBij(regel.id, invoer)
        else await voegRegelToe(invoer)
        uitkomst = 'opgeslagen'
        sluit()
      } catch (fout) {
        if (!(fout instanceof OngeldigeInvoer)) throw fout
        toonFouten(foutVak, fout.fouten)
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
      waarden.element,
      foutVak,
      el('div', { class: 'knoppen' },
        bestaand ? el('button', { type: 'button', class: 'knop knop-gevaar', onclick: verwijder }, 'Verwijderen') : null,
        el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
        el('button', { type: 'submit', class: 'knop knop-hoofd' }, 'Opslaan')
      )
    )
    formulier.addEventListener('input', werkVoorbeeldBij)
    werkVoorbeeldBij()

    const { sluit } = openDialoog(bestaand ? 'Aanpassen' : 'Handmatig invoeren', formulier, () => klaar(uitkomst))
    if (!begin) naamVeld.focus()
  })
}
