// Scherm: beweging registreren, met een geschat kcal-verbruik.

import { el } from '../onderdelen/html.js'
import { openDialoog, bevestig } from '../onderdelen/dialoog.js'
import { toonMelding } from '../onderdelen/melding.js'
import { toonFouten, naarVeld } from '../onderdelen/waardenVelden.js'
import { STANDAARD_SOORTEN } from '../gegevens/bewegingssoorten.js'
import { vandaag, toonDatum, isGeldigeDatum } from '../berekeningen/datum.js'
import { leesGetal, toonGetal } from '../berekeningen/getallen.js'
import { kcalVoorActiviteit, totaalBewegingKcal } from '../berekeningen/beweging.js'
import { gewichtOpDatum } from '../berekeningen/gewicht.js'
import {
  voegActiviteitToe, werkActiviteitBij, verwijderActiviteit, recenteActiviteiten,
  eigenSoorten, bewaarEigenSoort, verwijderEigenSoort
} from '../opslag/beweging.js'
import { alleGewichten } from '../opslag/gewicht.js'
import { OngeldigeInvoer } from '../opslag/fouten.js'

const UITLEG = 'Het verbruik is een ruwe schatting (MET-waarde × gewicht × tijd). ' +
  'Het echte verbruik hangt af van tempo, conditie en lichaamsbouw, en ligt vaak lager.'

// Alle soorten in één lijst: standaard ('std:...') en eigen ('eigen:...').
async function alleSoorten() {
  const eigen = await eigenSoorten()
  return [
    ...STANDAARD_SOORTEN.map((s) => ({ id: `std:${s.sleutel}`, naam: s.naam, met: s.met, afstand: s.afstand, eigen: false })),
    ...eigen.map((s) => ({ id: `eigen:${s.id}`, dbId: s.id, naam: s.naam, met: s.met, afstand: true, eigen: true }))
  ]
}

// Dialoog voor een nieuwe eigen soort. Uit: Promise met het id ('eigen:..') of null.
function openNieuweSoort() {
  return new Promise((klaar) => {
    let uitkomst = null
    const naamVeld = el('input', { id: 'soort-naam', type: 'text', autocomplete: 'off', maxlength: '120' })
    const metVeld = el('input', { id: 'soort-met', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'bv. 5' })
    const foutVak = el('div', { class: 'fouten', role: 'alert' })
    const { sluit } = openDialoog('Nieuwe soort beweging', el('form', {
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault()
        try {
          const id = await bewaarEigenSoort(naamVeld.value, leesGetal(metVeld.value))
          uitkomst = `eigen:${id}`; sluit()
        } catch (fout) {
          if (!(fout instanceof OngeldigeInvoer)) throw fout
          toonFouten(foutVak, fout.fouten)
        }
      }
    },
      el('div', { class: 'veld' }, el('label', { for: 'soort-naam' }, 'Naam'), naamVeld),
      el('div', { class: 'veld' }, el('label', { for: 'soort-met' }, 'MET-waarde'), metVeld),
      el('p', { class: 'hint' }, 'Ter vergelijking: rustig wandelen 3,5 · fietsen 6,8 · hardlopen 8–11. ',
        'Zoek de waarde op in het "Compendium of Physical Activities".'),
      foutVak,
      el('div', { class: 'knoppen' },
        el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
        el('button', { type: 'submit', class: 'knop knop-hoofd' }, 'Opslaan'))
    ), () => klaar(uitkomst))
    naamVeld.focus()
  })
}

// Dialoog om een activiteit toe te voegen of aan te passen.
// Uit: Promise met 'opgeslagen', 'verwijderd' of null.
function openActiviteit({ activiteit = null, soorten, metingen }) {
  return new Promise((klaar) => {
    let uitkomst = null
    const datumVeld = el('input', { id: 'act-datum', type: 'date', value: activiteit?.datum ?? vandaag(), max: vandaag() })
    const soortVeld = el('select', { id: 'act-soort' })
    const minutenVeld = el('input', { id: 'act-minuten', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: activiteit ? String(activiteit.minuten) : '30' })
    const afstandVeld = el('input', { id: 'act-afstand', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'optioneel', value: naarVeld(activiteit?.afstandKm) })
    const notitieVeld = el('input', { id: 'act-notitie', type: 'text', autocomplete: 'off', maxlength: '500', placeholder: 'optioneel', value: activiteit?.notitie ?? '' })
    const afstandBlok = el('div', { class: 'veld' }, el('label', { for: 'act-afstand' }, 'Afstand (km)'), afstandVeld)
    const schatting = el('p', { class: 'voorbeeld', 'aria-live': 'polite' })
    const foutVak = el('div', { class: 'fouten', role: 'alert' })

    // Een oude activiteit met een soort die niet meer in de lijst staat, toch tonen.
    let lijst = [...soorten]
    if (activiteit && !lijst.some((s) => s.id === activiteit.soortId)) {
      lijst.push({ id: activiteit.soortId, naam: activiteit.soortNaam, met: activiteit.met, afstand: true, eigen: true })
    }
    function vulSoorten(gekozen) {
      soortVeld.replaceChildren(
        el('optgroup', { label: 'Standaard' }, lijst.filter((s) => !s.eigen).map((s) => el('option', { value: s.id }, `${s.naam} · MET ${toonGetal(s.met, 1)}`))),
        lijst.some((s) => s.eigen)
          ? el('optgroup', { label: 'Eigen' }, lijst.filter((s) => s.eigen).map((s) => el('option', { value: s.id }, `${s.naam} · MET ${toonGetal(s.met, 1)}`)))
          : el('optgroup', { label: 'Eigen' }),
        el('option', { value: 'nieuw' }, '+ Nieuwe soort…')
      )
      soortVeld.value = gekozen
    }
    vulSoorten(activiteit?.soortId ?? lijst[0].id)
    let vorigeSoort = soortVeld.value

    function gekozenSoort() { return lijst.find((s) => s.id === soortVeld.value) }

    function werkBij() {
      const soort = gekozenSoort()
      afstandBlok.hidden = !soort?.afstand
      // Bij aanpassen: de MET-waarde van toen blijven gebruiken als de soort gelijk blijft.
      const met = activiteit && soort?.id === activiteit.soortId ? activiteit.met : soort?.met
      const kg = gewichtOpDatum(metingen, datumVeld.value)
      const minuten = leesGetal(minutenVeld.value)
      if (kg === null) schatting.textContent = 'Voer je gewicht in (scherm Gewicht) om het verbruik te schatten.'
      else if (minuten > 0 && met) schatting.textContent = `Geschat verbruik: ± ${toonGetal(kcalVoorActiviteit(met, kg, minuten))} kcal (bij ${toonGetal(kg, 1)} kg)`
      else schatting.textContent = ''
    }

    soortVeld.addEventListener('change', async () => {
      if (soortVeld.value !== 'nieuw') { vorigeSoort = soortVeld.value; werkBij(); return }
      const nieuw = await openNieuweSoort()
      if (nieuw) {
        lijst = [...(await alleSoorten())]
        vulSoorten(nieuw)
        vorigeSoort = nieuw
      } else {
        soortVeld.value = vorigeSoort
      }
      werkBij()
    })

    async function opslaan(e) {
      e.preventDefault()
      if (!isGeldigeDatum(datumVeld.value)) { toonFouten(foutVak, ['Ongeldige datum.']); return }
      const soort = gekozenSoort()
      const invoer = {
        datum: datumVeld.value,
        soortId: soort.id,
        soortNaam: soort.naam,
        met: activiteit && soort.id === activiteit.soortId ? activiteit.met : soort.met,
        minuten: leesGetal(minutenVeld.value),
        afstandKm: soort.afstand ? leesGetal(afstandVeld.value) : null,
        notitie: notitieVeld.value
      }
      try {
        if (activiteit) await werkActiviteitBij(activiteit.id, invoer)
        else await voegActiviteitToe(invoer)
        uitkomst = 'opgeslagen'; sluit()
      } catch (fout) {
        if (!(fout instanceof OngeldigeInvoer)) throw fout
        toonFouten(foutVak, fout.fouten)
      }
    }

    async function verwijder() {
      if (!(await bevestig({ titel: 'Verwijderen?', tekst: 'Deze activiteit verwijderen?', knopTekst: 'Verwijderen', gevaarlijk: true }))) return
      await verwijderActiviteit(activiteit.id)
      uitkomst = 'verwijderd'; sluit()
    }

    const formulier = el('form', { onsubmit: opslaan, novalidate: true },
      el('div', { class: 'veld' }, el('label', { for: 'act-soort' }, 'Soort'), soortVeld),
      el('div', { class: 'naast-elkaar' },
        el('div', { class: 'veld' }, el('label', { for: 'act-datum' }, 'Datum'), datumVeld),
        el('div', { class: 'veld' }, el('label', { for: 'act-minuten' }, 'Duur (minuten)'), minutenVeld)
      ),
      afstandBlok,
      el('div', { class: 'veld' }, el('label', { for: 'act-notitie' }, 'Notitie'), notitieVeld),
      schatting,
      el('p', { class: 'hint' }, UITLEG),
      foutVak,
      el('div', { class: 'knoppen' },
        activiteit ? el('button', { type: 'button', class: 'knop knop-gevaar', onclick: verwijder }, 'Verwijderen') : null,
        el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
        el('button', { type: 'submit', class: 'knop knop-hoofd' }, 'Opslaan'))
    )
    formulier.addEventListener('input', werkBij)
    werkBij()
    const { sluit } = openDialoog(activiteit ? 'Activiteit aanpassen' : 'Activiteit toevoegen', formulier, () => klaar(uitkomst))
  })
}

export async function toonBeweging(container) {
  const herteken = () => toonBeweging(container)
  const [activiteiten, metingen, soorten, eigen] = await Promise.all([
    recenteActiviteiten(vandaag(), 30), alleGewichten(), alleSoorten(), eigenSoorten()
  ])

  const vanVandaag = activiteiten.filter((a) => a.datum === vandaag())
  const totaalVandaag = totaalBewegingKcal(vanVandaag, metingen)
  const minutenVandaag = vanVandaag.reduce((som, a) => som + a.minuten, 0)

  async function nieuw() {
    if (await openActiviteit({ soorten, metingen })) { toonMelding('Opgeslagen'); herteken() }
  }

  // Lijst, per dag gegroepeerd.
  const perDag = new Map()
  for (const a of activiteiten) {
    if (!perDag.has(a.datum)) perDag.set(a.datum, [])
    perDag.get(a.datum).push(a)
  }
  const lijst = [...perDag.entries()].map(([datum, lijstDag]) => el('section', { class: 'kaart' },
    el('h2', {}, toonDatum(datum)),
    el('ul', { class: 'regels' }, lijstDag.map((a) => {
      const kcal = kcalVoorActiviteit(a.met, gewichtOpDatum(metingen, a.datum), a.minuten)
      const details = [`${a.minuten} min`, a.afstandKm ? `${toonGetal(a.afstandKm, 1)} km` : null, a.notitie].filter(Boolean).join(' · ')
      return el('li', {}, el('button', {
        type: 'button', class: 'regel',
        onclick: async () => { const u = await openActiviteit({ activiteit: a, soorten, metingen }); if (u) { toonMelding(u === 'verwijderd' ? 'Verwijderd' : 'Opgeslagen'); herteken() } }
      },
        el('span', { class: 'regel-naam' }, a.soortNaam),
        el('span', { class: 'regel-hoeveelheid' }, details),
        el('span', { class: 'regel-kcal' }, kcal === null ? '– kcal' : `± ${toonGetal(kcal)} kcal`)
      ))
    }))
  ))

  container.replaceChildren(...[
    el('h1', { class: 'schermtitel' }, 'Beweging'),
    el('section', { class: 'kaart' },
      el('dl', { class: 'totaal-raster' },
        el('div', {}, el('dt', {}, 'Vandaag'), el('dd', {}, `${minutenVandaag} min`)),
        el('div', {}, el('dt', {}, 'Geschat verbruik'), el('dd', {}, vanVandaag.length === 0 ? '0 kcal' : totaalVandaag.onvolledig ? '– kcal' : `± ${toonGetal(totaalVandaag.totaal)} kcal`))
      ),
      metingen.length === 0 ? el('p', { class: 'hint' }, 'Voer je gewicht in (scherm Gewicht) om het verbruik te kunnen schatten.') : null,
      el('p', { class: 'hint' }, UITLEG)
    ),
    el('button', { type: 'button', class: 'knop knop-hoofd knop-breed', onclick: nieuw }, '+ Activiteit toevoegen'),
    ...lijst,
    activiteiten.length === 0 ? el('p', { class: 'hint' }, 'Nog geen activiteiten in de laatste 30 dagen.') : null,
    eigen.length > 0
      ? el('section', { class: 'kaart' },
          el('h2', {}, 'Eigen soorten'),
          el('ul', { class: 'portie-lijst' }, eigen.map((s) => el('li', {},
            el('span', {}, `${s.naam} · MET ${toonGetal(s.met, 1)}`),
            el('button', {
              type: 'button', class: 'knop knop-klein',
              onclick: async () => {
                if (!(await bevestig({ titel: 'Soort verwijderen?', tekst: `"${s.naam}" uit de lijst halen? Activiteiten die je al hebt, blijven staan.`, knopTekst: 'Verwijderen', gevaarlijk: true }))) return
                await verwijderEigenSoort(s.id); herteken()
              }
            }, 'Verwijder')
          ))))
      : null
  ].filter(Boolean))
}
