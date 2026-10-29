// Scherm: het dagboek van één dag.
// Bovenaan de datum (met pijltjes), dan de dagtotalen, dan de vier maaltijden.

import { el } from '../onderdelen/html.js'
import { openRegelDialoog } from '../onderdelen/regelDialoog.js'
import { openProductDialoog } from '../onderdelen/productDialoog.js'
import { productVoorRegel } from '../diensten/producten.js'
import { toonMelding } from '../onderdelen/melding.js'
import { MAALTIJDEN, MAALTIJD_SLEUTELS } from '../gegevens/maaltijden.js'
import { VOEDINGSSTOFFEN } from '../gegevens/voedingsstoffen.js'
import { BACKUP_HERINNERING_DAGEN } from '../gegevens/drempels.js'
import { vandaag, verschuifDag, toonDatum, isGeldigeDatum } from '../berekeningen/datum.js'
import { toonGetal } from '../berekeningen/getallen.js'
import { totaalVanRegels, totaalPerMaaltijd, waardenVanRegel } from '../berekeningen/voeding.js'
import { moetBackupHerinneren } from '../berekeningen/herinnering.js'
import { regelsVanDag, aantalRegels, kopieerMaaltijd } from '../opslag/dagboek.js'
import { leesInstelling } from '../opslag/instellingen.js'
import { isIos, isGeinstalleerd } from '../diensten/toestel.js'
import { toonInstallUitleg } from './installeren.js'

// Ga naar een andere dag (zonder de "terug"-geschiedenis vol te zetten).
function gaNaarDag(datum) {
  location.replace(`#/dagboek/${datum}`)
}

// Toont een totaal met eenheid, en * als er onbekende waarden bij zaten.
// Is alles onbekend, dan alleen "–".
function toonTotaal(totaal, decimalen, eenheid) {
  if (totaal.totaal === null) return '–'
  return `${toonGetal(totaal.totaal, decimalen)}${totaal.onvolledig ? '*' : ''} ${eenheid}`
}

// De balk met de datum en pijltjes.
function maakDatumBalk(datum) {
  const datumVeld = el('input', {
    type: 'date', class: 'datum-kiezer', value: datum, 'aria-label': 'Kies een datum',
    onchange: (e) => { if (isGeldigeDatum(e.target.value)) gaNaarDag(e.target.value) }
  })
  return el('header', { class: 'datum-balk' },
    el('button', { type: 'button', class: 'knop-rond', 'aria-label': 'Vorige dag', onclick: () => gaNaarDag(verschuifDag(datum, -1)) }, '‹'),
    el('label', { class: 'datum-label' }, el('span', {}, toonDatum(datum)), datumVeld),
    el('button', { type: 'button', class: 'knop-rond', 'aria-label': 'Volgende dag', onclick: () => gaNaarDag(verschuifDag(datum, 1)) }, '›')
  )
}

// Meldingen bovenaan: app nog niet geïnstalleerd, of back-up nodig.
async function maakMeldingen() {
  const meldingen = []
  if (isIos() && !isGeinstalleerd()) {
    meldingen.push(el('div', { class: 'banner banner-let-op' },
      el('p', {}, 'Je gebruikt de app in Safari. Zet hem op je beginscherm, anders kan Safari je gegevens wissen.'),
      el('button', { type: 'button', class: 'knop knop-klein', onclick: () => toonInstallUitleg() }, 'Hoe?')
    ))
  }
  const herinneren = moetBackupHerinneren({
    laatsteBackup: await leesInstelling('laatsteBackup'),
    nu: new Date(),
    heeftGegevens: (await aantalRegels()) > 0,
    maxDagen: BACKUP_HERINNERING_DAGEN
  })
  if (herinneren) {
    meldingen.push(el('div', { class: 'banner' },
      el('p', {}, 'Tijd voor een back-up. Zonder back-up ben je je gegevens kwijt als je telefoon stuk of weg is.'),
      el('a', { class: 'knop knop-klein', href: '#/meer' }, 'Naar back-up')
    ))
  }
  return meldingen
}

// Het blok met de dagtotalen.
function maakTotalen(totaal) {
  const [energie, ...rest] = VOEDINGSSTOFFEN
  const onvolledig = VOEDINGSSTOFFEN.some((s) => totaal[s.sleutel].onvolledig)
  return el('section', { class: 'kaart totalen', 'aria-label': 'Dagtotaal' },
    el('div', { class: 'totaal-kcal' },
      el('span', { class: 'groot' }, toonTotaal(totaal[energie.sleutel], 0, 'kcal'))
    ),
    el('dl', { class: 'totaal-raster' },
      rest.map((stof) => el('div', {},
        el('dt', {}, stof.naam),
        el('dd', {}, toonTotaal(totaal[stof.sleutel], stof.decimalen, stof.eenheid))
      ))
    ),
    onvolledig ? el('p', { class: 'hint' }, '* Niet alle waarden zijn bekend; het echte totaal kan hoger zijn.') : null
  )
}

// Toont de hoeveelheid van een regel, bijvoorbeeld "50 g" of "2 × snee (70 g)".
function toonHoeveelheid(regel) {
  const getal = (n) => toonGetal(n, n % 1 ? 1 : 0)
  if (regel.eenheid === 'portie') return `${getal(regel.hoeveelheid)} × ${regel.portieNaam} (${getal(regel.gram)} ${regel.basisEenheid})`
  return `${getal(regel.hoeveelheid)} ${regel.eenheid}`
}

// Opent de juiste dialoog om een regel aan te passen.
async function pasRegelAan(regel) {
  if (regel.productRef) {
    const product = await productVoorRegel(regel)
    return openProductDialoog({ product, datum: regel.datum, maaltijd: regel.maaltijd, regel })
  }
  return openRegelDialoog({ datum: regel.datum, maaltijd: regel.maaltijd, regel })
}

// Eén maaltijd met zijn regels en een knop om toe te voegen.
// "vorigeDag" = { datum, aantal } — om die maaltijd van de vorige dag te kopiëren.
function maakMaaltijd(maaltijd, regels, totaal, datum, vorigeDag, herteken) {
  const lijst = regels.map((regel) => {
    const kcal = waardenVanRegel(regel).kcal
    return el('li', {},
      el('button', {
        type: 'button', class: 'regel',
        onclick: async () => {
          const uitkomst = await pasRegelAan(regel)
          if (uitkomst) { toonMelding(uitkomst === 'verwijderd' ? 'Verwijderd' : 'Opgeslagen'); herteken() }
        }
      },
        el('span', { class: 'regel-naam' }, regel.naam),
        el('span', { class: 'regel-hoeveelheid' }, toonHoeveelheid(regel)),
        el('span', { class: 'regel-kcal' }, kcal === null ? '– kcal' : `${toonGetal(kcal)} kcal`)
      )
    )
  })
  return el('section', { class: 'kaart maaltijd' },
    el('h2', {},
      el('span', {}, maaltijd.naam),
      el('span', { class: 'zacht' }, toonTotaal(totaal.kcal, 0, 'kcal'))
    ),
    lijst.length ? el('ul', { class: 'regels' }, lijst) : null,
    // Kopiëren kan alleen als deze maaltijd nog leeg is (zo komt niets dubbel).
    lijst.length === 0 && vorigeDag.aantal > 0
      ? el('button', {
          type: 'button', class: 'knop knop-kopieer',
          onclick: async () => {
            const aantal = await kopieerMaaltijd(vorigeDag.datum, datum, maaltijd.sleutel)
            toonMelding(`${aantal} ${aantal === 1 ? 'regel' : 'regels'} gekopieerd`)
            herteken()
          }
        }, `↺ Zelfde als ${datum === vandaag() ? 'gisteren' : 'vorige dag'} (${vorigeDag.aantal})`)
      : null,
    el('a', {
      class: 'knop knop-toevoegen', href: `#/toevoegen/${datum}/${maaltijd.sleutel}`
    }, `+ Toevoegen aan ${maaltijd.naam.toLowerCase()}`)
  )
}

// Tekent het hele scherm.
// In: container (waar het scherm in komt) en de delen van het adres (bv. ['2026-10-29'])
export async function toonDagboek(container, [datumUitAdres] = []) {
  const datum = isGeldigeDatum(datumUitAdres) ? datumUitAdres : vandaag()
  const herteken = () => toonDagboek(container, [datum])

  const regels = await regelsVanDag(datum)
  const vorigeDatum = verschuifDag(datum, -1)
  const regelsVorigeDag = await regelsVanDag(vorigeDatum)
  const perMaaltijd = totaalPerMaaltijd(regels, MAALTIJD_SLEUTELS)
  const meldingen = await maakMeldingen()

  const delen = [
    maakDatumBalk(datum),
    ...meldingen,
    maakTotalen(totaalVanRegels(regels)),
    ...MAALTIJDEN.map((m) => maakMaaltijd(
      m, regels.filter((r) => r.maaltijd === m.sleutel), perMaaltijd[m.sleutel], datum,
      { datum: vorigeDatum, aantal: regelsVorigeDag.filter((r) => r.maaltijd === m.sleutel).length },
      herteken
    )),
    datum !== vandaag()
      ? el('button', { type: 'button', class: 'knop knop-breed', onclick: () => gaNaarDag(vandaag()) }, 'Naar vandaag')
      : null
  ]
  container.replaceChildren(...delen.filter(Boolean))
}
