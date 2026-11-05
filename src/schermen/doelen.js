// Scherm: dagdoelen instellen, met optionele hulp om een kcal-doel te berekenen,
// en de instelling "beweging optellen bij dagbudget".

import { el } from '../onderdelen/html.js'
import { toonMelding } from '../onderdelen/melding.js'
import { toonFouten, naarVeld } from '../onderdelen/waardenVelden.js'
import { ACTIVITEITSNIVEAUS, TEMPOS } from '../gegevens/activiteitsniveaus.js'
import { leesGetal, toonGetal } from '../berekeningen/getallen.js'
import {
  leeftijd, rustverbruik, dagverbruik, voorgesteldDoel, doelWaarschuwingen, gramUitProcent, procentUitGram
} from '../berekeningen/doelen.js'
import { controleerProfiel } from '../berekeningen/controle.js'
import { leesInstelling, bewaarInstelling } from '../opslag/instellingen.js'
import { alleGewichten } from '../opslag/gewicht.js'
import { OngeldigeInvoer } from '../opslag/fouten.js'

const MACROS = [
  { sleutel: 'eiwit', naam: 'Eiwit' },
  { sleutel: 'koolhydraten', naam: 'Koolhydraten' },
  { sleutel: 'vet', naam: 'Vet' }
]
const OVERIG = [
  { sleutel: 'vezels', naam: 'Vezels (g)' },
  { sleutel: 'suiker', naam: 'Suikers, maximaal (g)' },
  { sleutel: 'zout', naam: 'Zout, maximaal (g)' }
]

// Rustverbruik uit profiel + laatste gewicht, of null als er iets ontbreekt.
function berekenBmr(profiel, kg) {
  if (!profiel || kg === null || !profiel.lengteCm || !profiel.geboortejaar || !profiel.formule) return null
  return rustverbruik({ kg, lengteCm: profiel.lengteCm, leeftijd: leeftijd(profiel.geboortejaar), formule: profiel.formule })
}

export async function toonDoelen(container) {
  const herteken = () => toonDoelen(container)
  const doelen = await leesInstelling('doelen', {})
  const profiel = await leesInstelling('profiel', { lengteCm: null, geboortejaar: null, formule: null, activiteitsniveau: null })
  const optellen = await leesInstelling('bewegingOptellen', false)
  const metingen = await alleGewichten()
  const kg = metingen.length ? metingen[metingen.length - 1].kg : null

  // --- Dagdoel ---------------------------------------------------------------
  let inProcent = false
  const kcalVeld = el('input', { id: 'doel-kcal', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: naarVeld(doelen.kcal) })
  const macroVelden = {}
  const macroEenheden = []
  const macroRijen = MACROS.map((m) => {
    const veld = el('input', { id: `doel-${m.sleutel}`, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'geen doel', value: naarVeld(doelen[m.sleutel]) })
    const eenheid = el('span', { class: 'eenheid' }, 'g')
    macroVelden[m.sleutel] = veld
    macroEenheden.push(eenheid)
    return el('div', { class: 'veld-rij' }, el('label', { for: veld.id }, m.naam), el('div', { class: 'naast-elkaar' }, veld, eenheid))
  })
  const overigeVelden = {}
  const overigeRijen = OVERIG.map((o) => {
    const veld = el('input', { id: `doel-${o.sleutel}`, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'geen doel', value: naarVeld(doelen[o.sleutel]) })
    overigeVelden[o.sleutel] = veld
    return el('div', { class: 'veld-rij' }, el('label', { for: veld.id }, o.naam), veld)
  })
  const waarschuwing = el('div', { class: 'let-op', role: 'alert', hidden: true })
  const somProcent = el('p', { class: 'hint', 'aria-live': 'polite' })
  const foutVak = el('div', { class: 'fouten', role: 'alert' })

  // Schakelt de macrovelden tussen gram en procent (rekent de ingevulde waarden om).
  const eenheidKnop = el('button', { type: 'button', class: 'knop knop-klein' }, 'Invullen in %')
  eenheidKnop.addEventListener('click', () => {
    const kcal = leesGetal(kcalVeld.value)
    if (!(kcal > 0)) { toonFouten(foutVak, ['Vul eerst een kcal-doel in om in procenten te werken.']); return }
    foutVak.replaceChildren()
    for (const m of MACROS) {
      const w = leesGetal(macroVelden[m.sleutel].value)
      if (w > 0) {
        const nieuw = inProcent ? gramUitProcent(kcal, w, m.sleutel) : procentUitGram(kcal, w, m.sleutel)
        macroVelden[m.sleutel].value = naarVeld(Math.round(nieuw * 10) / 10)
      }
    }
    inProcent = !inProcent
    macroEenheden.forEach((e) => { e.textContent = inProcent ? '%' : 'g' })
    eenheidKnop.textContent = inProcent ? 'Invullen in gram' : 'Invullen in %'
    werkWaarschuwingBij()
  })

  function werkWaarschuwingBij() {
    const kcal = leesGetal(kcalVeld.value)
    const meldingen = kcal > 0 ? doelWaarschuwingen(kcal, berekenBmr(profiel, kg)) : []
    waarschuwing.hidden = meldingen.length === 0
    waarschuwing.replaceChildren(el('strong', {}, 'Let op: '), ...meldingen.map((m) => el('p', {}, m)))
    if (inProcent) {
      const som = MACROS.reduce((s, m) => s + (leesGetal(macroVelden[m.sleutel].value) || 0), 0)
      somProcent.textContent = `Samen ${toonGetal(som, 0)}% van je kcal${Math.round(som) === 100 ? '.' : ' (meestal samen 100%).'}`
    } else {
      somProcent.textContent = ''
    }
  }

  async function bewaarDoelen(e) {
    e.preventDefault()
    const kcal = leesGetal(kcalVeld.value)
    const nieuw = { kcal }
    for (const m of MACROS) {
      const w = leesGetal(macroVelden[m.sleutel].value)
      nieuw[m.sleutel] = inProcent && w !== null && kcal > 0 ? Math.round(gramUitProcent(kcal, w, m.sleutel) * 10) / 10 : w
    }
    for (const o of OVERIG) nieuw[o.sleutel] = leesGetal(overigeVelden[o.sleutel].value)
    try {
      await bewaarInstelling('doelen', nieuw)
      toonMelding('Doelen bewaard')
      herteken()
    } catch (fout) {
      if (!(fout instanceof OngeldigeInvoer)) throw fout
      toonFouten(foutVak, fout.fouten)
    }
  }

  const doelFormulier = el('form', { class: 'kaart', onsubmit: bewaarDoelen, novalidate: true },
    el('h2', {}, 'Dagdoel'),
    el('div', { class: 'veld' }, el('label', { for: 'doel-kcal' }, 'Energie (kcal per dag)'), kcalVeld),
    waarschuwing,
    el('div', { class: 'acties' }, el('h3', {}, 'Macro\'s'), eenheidKnop),
    macroRijen,
    somProcent,
    el('h3', {}, 'Overig (optioneel)'),
    overigeRijen,
    el('p', { class: 'hint' }, 'Laat een veld leeg als je er geen doel voor wilt.'),
    foutVak,
    el('button', { type: 'submit', class: 'knop knop-hoofd knop-breed' }, 'Doelen opslaan')
  )
  doelFormulier.addEventListener('input', werkWaarschuwingBij)
  werkWaarschuwingBij()

  // --- Hulp bij berekenen ---------------------------------------------------------
  const lengteVeld = el('input', { id: 'prof-lengte', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: naarVeld(profiel.lengteCm) })
  const jaarVeld = el('input', { id: 'prof-jaar', type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: 'bv. 1985', value: naarVeld(profiel.geboortejaar) })
  const formuleVeld = el('select', { id: 'prof-formule' },
    el('option', { value: '', selected: !profiel.formule }, 'Kies…'),
    el('option', { value: 'vrouw', selected: profiel.formule === 'vrouw' }, 'vrouw'),
    el('option', { value: 'man', selected: profiel.formule === 'man' }, 'man'))
  const niveauVeld = el('select', { id: 'prof-niveau' },
    ACTIVITEITSNIVEAUS.map((n) => el('option', { value: n.sleutel, selected: n.sleutel === (profiel.activiteitsniveau ?? 'licht') }, `${n.naam} – ${n.uitleg}`)))
  const uitkomst = el('div', { 'aria-live': 'polite' })
  const hulpFouten = el('div', { class: 'fouten', role: 'alert' })

  async function bereken(e) {
    e.preventDefault()
    const nieuwProfiel = {
      lengteCm: leesGetal(lengteVeld.value),
      geboortejaar: leesGetal(jaarVeld.value),
      formule: formuleVeld.value || null,
      activiteitsniveau: niveauVeld.value
    }
    const fouten = controleerProfiel(nieuwProfiel)
    if (!nieuwProfiel.lengteCm || !nieuwProfiel.geboortejaar || !nieuwProfiel.formule) fouten.push('Vul lengte, geboortejaar en formule in.')
    if (kg === null) fouten.push('Voer eerst je gewicht in op het scherm Gewicht.')
    if (fouten.length) { toonFouten(hulpFouten, fouten); return }
    hulpFouten.replaceChildren()
    await bewaarInstelling('profiel', nieuwProfiel)
    Object.assign(profiel, nieuwProfiel)

    const bmr = berekenBmr(nieuwProfiel, kg)
    const factor = ACTIVITEITSNIVEAUS.find((n) => n.sleutel === nieuwProfiel.activiteitsniveau).factor
    const tdee = dagverbruik(bmr, factor)
    uitkomst.replaceChildren(
      el('dl', { class: 'totaal-raster' },
        el('div', {}, el('dt', {}, 'Rustverbruik'), el('dd', {}, `± ${toonGetal(bmr)} kcal`)),
        el('div', {}, el('dt', {}, 'Dagverbruik'), el('dd', {}, `± ${toonGetal(tdee)} kcal`))
      ),
      el('ul', { class: 'portie-lijst' }, TEMPOS.map((t) => {
        const doel = voorgesteldDoel(tdee, t.kgPerWeek)
        const meldingen = doelWaarschuwingen(doel, bmr)
        return el('li', {},
          el('span', {}, `${t.naam}: ${toonGetal(doel)} kcal`, meldingen.length ? el('strong', { class: 'waarschuwing-tekst' }, ' ⚠ te laag') : null),
          el('button', {
            type: 'button', class: 'knop knop-klein',
            onclick: () => { kcalVeld.value = String(doel); werkWaarschuwingBij(); kcalVeld.scrollIntoView({ block: 'center' }); toonMelding('Ingevuld – vergeet niet op te slaan') }
          }, 'Gebruik')
        )
      })),
      el('p', { class: 'hint' }, 'Formule: Mifflin-St Jeor, met je laatste gewicht (', `${toonGetal(kg, 1)} kg`, '). Dit is een schatting; je echte verbruik kan 10–20% afwijken. Kijk na een paar weken naar je gewichtstrend en stel bij.')
    )
  }

  const hulpFormulier = el('form', { class: 'kaart', onsubmit: bereken, novalidate: true },
    el('h2', {}, 'Hulp bij berekenen (optioneel)'),
    el('div', { class: 'veld' }, el('label', { for: 'prof-lengte' }, 'Lengte (cm)'), lengteVeld),
    el('div', { class: 'veld' }, el('label', { for: 'prof-jaar' }, 'Geboortejaar'), jaarVeld),
    el('div', { class: 'veld' }, el('label', { for: 'prof-formule' }, 'Formule'), formuleVeld),
    el('p', { class: 'hint' }, 'De formule heeft een variant voor man en voor vrouw. Kies wat het best bij je lichaam past; dit wordt alleen voor deze berekening gebruikt.'),
    el('div', { class: 'veld' }, el('label', { for: 'prof-niveau' }, 'Activiteitsniveau'), niveauVeld),
    el('p', { class: 'hint' }, kg === null ? 'Gewicht: nog niet ingevoerd.' : `Gewicht: ${toonGetal(kg, 1)} kg (je laatste meting).`),
    hulpFouten,
    el('button', { type: 'submit', class: 'knop knop-breed' }, 'Bereken'),
    uitkomst
  )

  // --- Beweging en dagbudget ---------------------------------------------------------
  const schakelaar = el('input', { id: 'beweging-optellen', type: 'checkbox', checked: optellen })
  schakelaar.addEventListener('change', async () => {
    await bewaarInstelling('bewegingOptellen', schakelaar.checked)
    toonMelding(schakelaar.checked ? 'Beweging telt mee in je budget' : 'Beweging telt niet mee')
  })
  const bewegingKaart = el('section', { class: 'kaart' },
    el('h2', {}, 'Beweging en dagbudget'),
    el('label', { class: 'schakel', for: 'beweging-optellen' }, schakelaar, el('span', {}, 'Beweging optellen bij mijn dagbudget')),
    el('p', { class: 'hint' },
      'Standaard uit. Het verbruik van beweging is een ruwe schatting en vaak te hoog. ',
      'Heb je een activiteitsniveau gekozen in de hulp hierboven, dan zit je beweging al in je doel; optellen telt het dan dubbel.')
  )

  container.replaceChildren(
    el('header', { class: 'scherm-kop' },
      el('a', { class: 'knop-rond', href: '#/meer', 'aria-label': 'Terug naar Meer' }, '‹'),
      el('h1', { class: 'schermtitel' }, 'Doelen')
    ),
    doelFormulier,
    hulpFormulier,
    bewegingKaart
  )
}
