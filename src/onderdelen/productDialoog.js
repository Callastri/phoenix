// Dialoog om een product (NEVO of eigen) aan het dagboek toe te voegen,
// of om de hoeveelheid van een bestaande regel aan te passen.

import { el } from './html.js'
import { openDialoog, bevestig } from './dialoog.js'
import { naarVeld, toonFouten } from './waardenVelden.js'
import { openNevoPortieDialoog } from './nevoPortieDialoog.js'
import { MAALTIJDEN } from '../gegevens/maaltijden.js'
import { VOEDINGSSTOFFEN } from '../gegevens/voedingsstoffen.js'
import { leesGetal, toonGetal } from '../berekeningen/getallen.js'
import { basisHoeveelheid, waardenVoorHoeveelheid } from '../berekeningen/voeding.js'
import { voegRegelToe, werkRegelBij, verwijderRegel } from '../opslag/dagboek.js'
import { isFavoriet, zetFavoriet } from '../opslag/producten.js'
import { OngeldigeInvoer } from '../opslag/fouten.js'
import { bronTekst, haalProduct } from '../diensten/producten.js'

// Tekst voor een portie in de keuzelijst, bijvoorbeeld "snee (35 g)".
function portieTekst(portie, eenheid) {
  return `${portie.naam} (${toonGetal(portie.gram, portie.gram % 1 ? 1 : 0)} ${eenheid})`
}

// Opent de dialoog.
// In:  { product, datum, maaltijd, regel }
//      - product: zie diensten/producten.js
//      - regel: alleen bij aanpassen van een bestaande dagboekregel
//      - voorkeur: een eerdere regel van dit product (dan staat dezelfde hoeveelheid klaar)
// Uit: Promise met 'opgeslagen', 'verwijderd', { bewerk: product } of null
export function openProductDialoog({ product, datum, maaltijd, regel = null, voorkeur = null }) {
  return new Promise(async (klaar) => {
    let uitkomst = null
    const bestaand = regel !== null
    // Bij aanpassen gebruiken we de waarden die in het dagboek bewaard zijn (momentopname).
    const waardenPer100 = bestaand ? regel.waarden : product.waarden
    const eenheid = product.eenheid
    let porties = [...product.porties]
    // Een portie uit een oude regel die niet meer bij het product staat, toch tonen.
    if (bestaand && regel.eenheid === 'portie' && !porties.some((p) => p.naam === regel.portieNaam && p.gram === regel.portieGram)) {
      porties.push({ naam: regel.portieNaam, gram: regel.portieGram })
    }

    const hoeveelheidVeld = el('input', {
      id: 'veld-hoeveelheid', type: 'text', inputmode: 'decimal', autocomplete: 'off'
    })
    const eenheidVeld = el('select', { id: 'veld-eenheid', 'aria-label': 'Eenheid' })
    const maaltijdVeld = el('select', { id: 'veld-maaltijd' },
      MAALTIJDEN.map((m) => el('option', { value: m.sleutel, selected: m.sleutel === (bestaand ? regel.maaltijd : maaltijd) }, m.naam))
    )
    const tabel = el('table', { class: 'waarden-tabel' })
    const foutVak = el('div', { class: 'fouten', role: 'alert' })

    // Vult de keuzelijst met eenheden: gram/ml en de porties.
    function vulEenheden(gekozen) {
      eenheidVeld.replaceChildren(
        el('option', { value: 'basis' }, eenheid === 'ml' ? 'ml' : 'gram'),
        ...porties.map((p, i) => el('option', { value: `portie:${i}` }, portieTekst(p, eenheid)))
      )
      eenheidVeld.value = gekozen
    }

    // Welke eenheid en portie is gekozen?
    function gekozenEenheid() {
      if (eenheidVeld.value === 'basis') return { eenheid, portie: null }
      const portie = porties[Number(eenheidVeld.value.split(':')[1])]
      return { eenheid: 'portie', portie }
    }

    // Berekent de waarden voor de gekozen hoeveelheid en zet ze in de tabel.
    function werkTabelBij() {
      const hoeveelheid = leesGetal(hoeveelheidVeld.value)
      const { eenheid: e, portie } = gekozenEenheid()
      const geldig = hoeveelheid > 0
      const gram = geldig ? basisHoeveelheid(hoeveelheid, e, portie?.gram) : null
      const waarden = geldig ? waardenVoorHoeveelheid(waardenPer100, gram) : null
      tabel.replaceChildren(
        el('caption', {}, geldig ? `Voor ${toonGetal(gram, gram % 1 ? 1 : 0)} ${eenheid}` : 'Vul een hoeveelheid in'),
        ...VOEDINGSSTOFFEN.map((stof) => el('tr', {},
          el('th', { scope: 'row' }, stof.naam,
            stof.sleutel === 'zout' && product.zoutBerekend ? el('span', { class: 'hint' }, ' (berekend uit natrium)') : null),
          el('td', {}, waarden && waarden[stof.sleutel] !== null ? `${toonGetal(waarden[stof.sleutel], stof.decimalen)} ${stof.eenheid}` : '–')
        ))
      )
    }

    // Beginwaarden: de bestaande (of vorige) regel, of 1 portie, of 100 g/ml.
    const vorige = bestaand ? regel : voorkeur
    const vorigePortie = vorige ? porties.findIndex((p) => p.naam === vorige.portieNaam && p.gram === vorige.portieGram) : -1
    if (vorige && (vorige.eenheid !== 'portie' || vorigePortie >= 0)) {
      hoeveelheidVeld.value = naarVeld(vorige.hoeveelheid)
      vulEenheden(vorige.eenheid === 'portie' ? `portie:${vorigePortie}` : 'basis')
    } else if (porties.length > 0) {
      hoeveelheidVeld.value = '1'
      vulEenheden('portie:0')
    } else {
      hoeveelheidVeld.value = '100'
      vulEenheden('basis')
    }

    async function opslaan(gebeurtenis) {
      gebeurtenis.preventDefault()
      const { eenheid: e, portie } = gekozenEenheid()
      const invoer = {
        datum: bestaand ? regel.datum : datum,
        maaltijd: maaltijdVeld.value,
        productRef: product.ref,
        naam: bestaand ? regel.naam : product.naam,
        waarden: waardenPer100,
        hoeveelheid: leesGetal(hoeveelheidVeld.value),
        eenheid: e
      }
      if (portie) Object.assign(invoer, { portieNaam: portie.naam, portieGram: portie.gram, basisEenheid: eenheid })
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

    // Favoriet aan/uit (meteen bewaard).
    const favoriet = await isFavoriet(product.ref)
    const sterKnop = el('button', {
      type: 'button', class: 'knop knop-klein ster', 'aria-pressed': String(favoriet)
    }, favoriet ? '★ Favoriet' : '☆ Favoriet')
    sterKnop.addEventListener('click', async () => {
      const aan = sterKnop.getAttribute('aria-pressed') !== 'true'
      await zetFavoriet(product.ref, aan)
      sterKnop.setAttribute('aria-pressed', String(aan))
      sterKnop.textContent = aan ? '★ Favoriet' : '☆ Favoriet'
    })

    // Extra acties: eigen portie toevoegen (NEVO), of het product bewerken / een eigen versie maken.
    const acties = []
    if (product.bron === 'nevo') {
      acties.push(el('button', {
        type: 'button', class: 'knop knop-klein',
        onclick: async () => {
          await openNevoPortieDialoog(product)
          const vernieuwd = await haalProduct(product.ref)
          if (vernieuwd) porties = vernieuwd.porties
          vulEenheden('basis')
          werkTabelBij()
        }
      }, '+ Eigen portie'))
    }
    if (!bestaand) {
      acties.push(el('button', {
        type: 'button', class: 'knop knop-klein',
        onclick: () => { uitkomst = { bewerk: product }; sluit() }
      }, product.bron === 'nevo' ? 'Eigen versie maken' : 'Product bewerken'))
    }

    const formulier = el('form', { onsubmit: opslaan, novalidate: true },
      el('p', { class: 'bron' }, bronTekst(product)),
      el('div', { class: 'acties' }, sterKnop, acties),
      el('div', { class: 'veld' },
        el('label', { for: 'veld-hoeveelheid' }, 'Hoeveelheid'),
        el('div', { class: 'naast-elkaar breed-keuze' }, hoeveelheidVeld, eenheidVeld)
      ),
      el('div', { class: 'veld' }, el('label', { for: 'veld-maaltijd' }, 'Maaltijd'), maaltijdVeld),
      tabel,
      foutVak,
      el('div', { class: 'knoppen' },
        bestaand ? el('button', { type: 'button', class: 'knop knop-gevaar', onclick: verwijder }, 'Verwijderen') : null,
        el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
        el('button', { type: 'submit', class: 'knop knop-hoofd' }, bestaand ? 'Opslaan' : 'Toevoegen')
      )
    )
    formulier.addEventListener('input', werkTabelBij)
    formulier.addEventListener('change', werkTabelBij)
    werkTabelBij()

    const { sluit } = openDialoog(bestaand ? regel.naam : product.naam, formulier, () => klaar(uitkomst))
  })
}
