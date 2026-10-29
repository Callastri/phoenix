// Scherm "Meer": back-up, terugzetten, CSV, opslag, alles wissen, over de app.

import { el } from '../onderdelen/html.js'
import { openDialoog, bevestig } from '../onderdelen/dialoog.js'
import { toonMelding } from '../onderdelen/melding.js'
import { vandaag, toonDatum } from '../berekeningen/datum.js'
import { tekstLaatsteBackup } from '../berekeningen/herinnering.js'
import { maakBackup, leesBackup, herstelBackup, wisAlles, maakCsv, backupBestandsnaam } from '../opslag/backup.js'
import { leesInstelling, bewaarInstelling } from '../opslag/instellingen.js'
import { deelBestand } from '../diensten/delen.js'
import { statusPermanenteOpslag, vraagPermanenteOpslag, isGeinstalleerd } from '../diensten/toestel.js'
import { toonInstallUitleg } from './installeren.js'
import { laadNevo, nevoBronvermelding } from '../diensten/nevo.js'

const APP_VERSIE = __APP_VERSIE__

// --- Back-up maken ----------------------------------------------------------

// Het back-upbestand wordt alvast klaargezet als dit scherm opent.
// Daardoor kan het deelmenu meteen openen bij een tik (dat eist Safari).
async function maakBackupBestand() {
  const backup = await maakBackup({ appVersie: APP_VERSIE })
  const tekst = JSON.stringify(backup, null, 1)
  return new File([tekst], backupBestandsnaam(vandaag()), { type: 'application/json' })
}

async function maakCsvBestand() {
  // ﻿ zorgt dat Excel letters als é en ë goed toont.
  const tekst = '﻿' + (await maakCsv())
  return new File([tekst], backupBestandsnaam(vandaag(), 'csv'), { type: 'text/csv' })
}

function sectieBackup(backupBestand, csvBestand, laatsteBackup, herteken) {
  return el('section', { class: 'kaart' },
    el('h2', {}, 'Back-up'),
    el('p', {}, 'Laatste back-up: ', el('strong', {}, tekstLaatsteBackup(laatsteBackup, new Date()))),
    el('p', { class: 'hint' },
      'Op iPhone: kies in het deelmenu "Bewaar in Bestanden" en dan iCloud Drive. ',
      'Het bestand is niet versleuteld; bewaar het op een plek die je vertrouwt.'),
    el('button', {
      type: 'button', class: 'knop knop-hoofd knop-breed',
      onclick: async () => {
        const uitkomst = await deelBestand(backupBestand)
        if (uitkomst === 'geannuleerd') return
        await bewaarInstelling('laatsteBackup', new Date().toISOString())
        toonMelding(uitkomst === 'gedownload' ? 'Back-up gedownload' : 'Back-up bewaard')
        herteken()
      }
    }, 'Back-up maken'),
    el('button', {
      type: 'button', class: 'knop knop-breed',
      onclick: async () => {
        const uitkomst = await deelBestand(csvBestand)
        if (uitkomst !== 'geannuleerd') toonMelding('CSV bewaard')
      }
    }, 'Dagboek als CSV (voor Excel)')
  )
}

// --- Back-up terugzetten ---------------------------------------------------

function toonFouten(fouten) {
  const { sluit } = openDialoog('Back-up niet teruggezet', [
    el('p', {}, 'Er is niets veranderd. Dit klopt niet in het bestand:'),
    el('ul', { class: 'fouten' }, fouten.map((f) => el('li', {}, f))),
    el('div', { class: 'knoppen' }, el('button', { type: 'button', class: 'knop knop-hoofd', onclick: () => sluit() }, 'Sluiten'))
  ])
}

async function verwerkGekozenBestand(bestand, herteken) {
  const gelezen = leesBackup(await bestand.text())
  if (!gelezen.ok) return toonFouten(gelezen.fouten)

  const gemaakt = toonDatum(vandaag(new Date(gelezen.gemaakt))).toLowerCase()
  const aantal = gelezen.aantallen.dagboek
  const zeker = await bevestig({
    titel: 'Back-up terugzetten?',
    tekst: `Back-up van ${gemaakt} met ${aantal} ${aantal === 1 ? 'dagboekregel' : 'dagboekregels'}. ` +
      'ALLE huidige gegevens op dit toestel worden vervangen door de back-up.',
    knopTekst: 'Vervangen',
    gevaarlijk: true
  })
  if (!zeker) return
  await herstelBackup(gelezen)
  toonMelding('Back-up teruggezet')
  herteken()
}

function sectieTerugzetten(herteken) {
  const kiezer = el('input', {
    type: 'file', accept: '.json,application/json', class: 'verborgen', id: 'kies-backup',
    onchange: async (e) => {
      const bestand = e.target.files[0]
      e.target.value = ''
      if (bestand) await verwerkGekozenBestand(bestand, herteken)
    }
  })
  return el('section', { class: 'kaart' },
    el('h2', {}, 'Back-up terugzetten'),
    el('p', { class: 'hint' }, 'Bijvoorbeeld op een nieuwe telefoon. Het bestand wordt eerst gecontroleerd; daarna kies je of je de huidige gegevens vervangt.'),
    kiezer,
    el('label', { for: 'kies-backup', class: 'knop knop-breed' }, 'Kies back-upbestand')
  )
}

// --- Opslag en installatie --------------------------------------------------

function sectieOpslag(status, herteken) {
  const teksten = {
    ja: ['ja', 'De browser wist je gegevens niet zomaar.'],
    nee: ['nog niet', 'Zet de app op je beginscherm en open hem daar; vraag het daarna opnieuw.'],
    'niet-ondersteund': ['onbekend', 'Deze browser ondersteunt dit niet.']
  }
  const [kort, uitleg] = teksten[status]
  return el('section', { class: 'kaart' },
    el('h2', {}, 'Opslag op dit toestel'),
    el('p', {}, 'Op beginscherm: ', el('strong', {}, isGeinstalleerd() ? 'ja' : 'nee')),
    el('p', {}, 'Permanente opslag: ', el('strong', {}, kort)),
    el('p', { class: 'hint' }, uitleg),
    status === 'nee'
      ? el('button', {
          type: 'button', class: 'knop knop-breed',
          onclick: async () => { await vraagPermanenteOpslag(); herteken() }
        }, 'Opnieuw vragen')
      : null,
    el('button', { type: 'button', class: 'knop knop-breed', onclick: () => toonInstallUitleg() }, 'Uitleg: op beginscherm zetten')
  )
}

// --- Alles wissen -------------------------------------------------------------

function vraagAllesWissen(herteken) {
  const veld = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', 'aria-label': 'Typ WISSEN' })
  const knop = el('button', { type: 'button', class: 'knop knop-gevaar', disabled: true }, 'Alles wissen')
  veld.addEventListener('input', () => { knop.disabled = veld.value.trim() !== 'WISSEN' })
  knop.addEventListener('click', async () => {
    await wisAlles()
    sluit()
    toonMelding('Alle gegevens zijn gewist')
    herteken()
  })
  const { sluit } = openDialoog('Alle gegevens wissen?', [
    el('p', {}, 'Dit wist je hele dagboek en alle instellingen op dit toestel. Dit kan niet ongedaan gemaakt worden.'),
    el('p', {}, 'Maak eerst een back-up als je de gegevens wilt houden.'),
    el('p', {}, 'Typ ', el('strong', {}, 'WISSEN'), ' om te bevestigen:'),
    veld,
    el('div', { class: 'knoppen' },
      el('button', { type: 'button', class: 'knop', onclick: () => sluit() }, 'Annuleren'),
      knop
    )
  ])
}

function sectieWissen(herteken) {
  return el('section', { class: 'kaart' },
    el('h2', {}, 'Alle gegevens wissen'),
    el('button', { type: 'button', class: 'knop knop-gevaar knop-breed', onclick: () => vraagAllesWissen(herteken) }, 'Alle gegevens wissen…')
  )
}

// --- Over ---------------------------------------------------------------------

function sectieOver(nevo) {
  return el('section', { class: 'kaart' },
    el('h2', {}, 'Over deze app'),
    el('p', {}, `Voedingsdagboek, versie ${APP_VERSIE}. Gratis, zonder advertenties, zonder account.`),
    el('p', {}, 'Al je gegevens blijven op dit toestel. Er gaat niets naar een server. ',
      'Enige uitzondering (vanaf een volgende versie): bij het scannen van een barcode wordt alleen het barcodenummer opgezocht bij Open Food Facts.'),
    el('h3', {}, 'Bronnen'),
    nevo
      ? el('p', {},
          nevoBronvermelding(nevo.versie), ' ',
          el('a', { href: 'https://nevo-online.rivm.nl/', rel: 'noopener' }, 'NEVO-online'), '. ',
          'Zout is berekend uit natrium (zout = natrium × 2,5). ',
          'Eigen producten en eigen porties zijn aanvullingen van jezelf, geen NEVO-gegevens. ',
          'Het RIVM is niet aansprakelijk voor fouten in of verkeerd gebruik van de gegevens.')
      : el('p', {}, 'De NEVO-tabel is nog niet toegevoegd.'),
    el('p', {}, 'Broncode: ', el('a', { href: 'https://github.com/Callastri/phoenix', rel: 'noopener' }, 'github.com/Callastri/phoenix'))
  )
}

// Tekent het hele scherm.
export async function toonMeer(container) {
  const herteken = () => toonMeer(container)
  const [backupBestand, csvBestand, laatsteBackup, status, nevo] = await Promise.all([
    maakBackupBestand(), maakCsvBestand(), leesInstelling('laatsteBackup'), statusPermanenteOpslag(), laadNevo()
  ])
  container.replaceChildren(
    el('h1', { class: 'schermtitel' }, 'Meer'),
    sectieBackup(backupBestand, csvBestand, laatsteBackup, herteken),
    sectieTerugzetten(herteken),
    sectieOpslag(status, herteken),
    sectieWissen(herteken),
    sectieOver(nevo)
  )
}
