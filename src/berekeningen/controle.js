// Controle van gegevens: bij invoer én bij het terugzetten van een back-up.
// Elke functie geeft een lijst foutmeldingen in gewone taal terug.
// Een lege lijst betekent: alles in orde.

import { SLEUTELS, VOEDINGSSTOFFEN } from '../gegevens/voedingsstoffen.js'
import { MAALTIJD_SLEUTELS } from '../gegevens/maaltijden.js'
import {
  MAX_PER_100, MAX_HOEVEELHEID, MAX_NAAM_LENGTE,
  MIN_GEWICHT_KG, MAX_GEWICHT_KG, MAX_MINUTEN
} from '../gegevens/drempels.js'
import { isGeldigeDatum, isGeldigTijdstip } from './datum.js'

// --- Hulpfuncties ---------------------------------------------------------

function isGetal(waarde) {
  return typeof waarde === 'number' && Number.isFinite(waarde)
}

function isObject(waarde) {
  return waarde !== null && typeof waarde === 'object' && !Array.isArray(waarde)
}

function controleerNaam(naam, fouten, veld = 'Naam') {
  if (typeof naam !== 'string' || naam.trim() === '') fouten.push(`${veld} ontbreekt.`)
  else if (naam.length > MAX_NAAM_LENGTE) fouten.push(`${veld} is te lang (max. ${MAX_NAAM_LENGTE} tekens).`)
}

function controleerId(record, fouten) {
  if (record.id !== undefined && !(Number.isInteger(record.id) && record.id > 0)) {
    fouten.push('Ongeldig volgnummer (id).')
  }
}

function controleerEenheid(eenheid, fouten, toegestaan = ['g', 'ml']) {
  if (!toegestaan.includes(eenheid)) fouten.push(`Eenheid moet ${toegestaan.join(' of ')} zijn.`)
}

// --- Voedingswaarden ------------------------------------------------------

// Controleert voedingswaarden per 100 g of 100 ml.
// Elke waarde moet null (onbekend) zijn, of een getal van 0 tot het maximum.
export function controleerWaarden(waarden) {
  const fouten = []
  if (!isObject(waarden)) return ['Voedingswaarden ontbreken.']
  for (const stof of VOEDINGSSTOFFEN) {
    const waarde = waarden[stof.sleutel]
    if (waarde === null || waarde === undefined) continue
    if (!isGetal(waarde)) fouten.push(`${stof.naam}: geen geldig getal.`)
    else if (waarde < 0) fouten.push(`${stof.naam} kan niet negatief zijn.`)
    else if (waarde > MAX_PER_100[stof.sleutel]) {
      fouten.push(`${stof.naam} kan niet meer zijn dan ${MAX_PER_100[stof.sleutel]} ${stof.eenheid} per 100.`)
    }
  }
  for (const sleutel of Object.keys(waarden)) {
    if (!SLEUTELS.includes(sleutel)) fouten.push(`Onbekende voedingsstof: ${sleutel}.`)
  }
  return fouten
}

// --- Per tabel -------------------------------------------------------------

// Een regel in het dagboek.
export function controleerDagboekregel(regel) {
  if (!isObject(regel)) return ['Geen geldige regel.']
  const fouten = []
  controleerId(regel, fouten)
  if (!isGeldigeDatum(regel.datum)) fouten.push('Ongeldige datum.')
  if (!MAALTIJD_SLEUTELS.includes(regel.maaltijd)) fouten.push('Onbekende maaltijd.')
  controleerNaam(regel.naam, fouten)
  controleerEenheid(regel.eenheid, fouten)
  if (!isGetal(regel.hoeveelheid) || regel.hoeveelheid <= 0) fouten.push('Hoeveelheid moet groter dan 0 zijn.')
  else if (regel.hoeveelheid > MAX_HOEVEELHEID) fouten.push(`Hoeveelheid kan niet meer zijn dan ${MAX_HOEVEELHEID}.`)
  else if (!isGetal(regel.gram) || regel.gram <= 0 || regel.gram > MAX_HOEVEELHEID) fouten.push('Ongeldige hoeveelheid in gram/ml.')
  if (regel.productRef !== null && regel.productRef !== undefined) {
    if (!isObject(regel.productRef) || typeof regel.productRef.soort !== 'string') fouten.push('Ongeldige verwijzing naar product.')
  }
  fouten.push(...controleerWaarden(regel.waarden))
  if (regel.aangemaakt !== undefined && !isGeldigTijdstip(regel.aangemaakt)) fouten.push('Ongeldig tijdstip van aanmaken.')
  return fouten
}

// Een eigen of opgeslagen product.
export function controleerProduct(product) {
  if (!isObject(product)) return ['Geen geldig product.']
  const fouten = []
  controleerId(product, fouten)
  if (!['eigen', 'off'].includes(product.bron)) fouten.push('Onbekende bron van product.')
  controleerNaam(product.naam, fouten)
  controleerEenheid(product.eenheid, fouten)
  if (product.barcode !== undefined && product.barcode !== null && !/^\d{6,14}$/.test(product.barcode)) {
    fouten.push('Ongeldige barcode.')
  }
  fouten.push(...controleerWaarden(product.waarden))
  if (product.porties !== undefined) {
    if (!Array.isArray(product.porties)) fouten.push('Porties moeten een lijst zijn.')
    else product.porties.forEach((p) => fouten.push(...controleerPortie(p, false)))
  }
  return fouten
}

// Een portie (bijvoorbeeld "1 snee" = 35 g).
// metNevoCode: true voor de tabel "porties" (eigen porties bij NEVO-producten).
export function controleerPortie(portie, metNevoCode = true) {
  if (!isObject(portie)) return ['Geen geldige portie.']
  const fouten = []
  if (metNevoCode) {
    controleerId(portie, fouten)
    if (!Number.isInteger(portie.nevoCode)) fouten.push('Portie zonder NEVO-code.')
  }
  controleerNaam(portie.naam, fouten, 'Naam van portie')
  if (!isGetal(portie.gram) || portie.gram <= 0 || portie.gram > MAX_HOEVEELHEID) fouten.push('Ongeldig gewicht van portie.')
  return fouten
}

// Een recept.
export function controleerRecept(recept) {
  if (!isObject(recept)) return ['Geen geldig recept.']
  const fouten = []
  controleerId(recept, fouten)
  controleerNaam(recept.naam, fouten)
  if (!Number.isInteger(recept.aantalPorties) || recept.aantalPorties < 1 || recept.aantalPorties > 100) {
    fouten.push('Aantal porties moet een heel getal van 1 tot 100 zijn.')
  }
  if (!Array.isArray(recept.ingredienten)) fouten.push('Ingrediënten moeten een lijst zijn.')
  else {
    recept.ingredienten.forEach((ing) => {
      if (!isObject(ing) || !isObject(ing.productRef)) fouten.push('Ingrediënt zonder product.')
      else if (!isGetal(ing.hoeveelheid) || ing.hoeveelheid <= 0) fouten.push('Ingrediënt met ongeldige hoeveelheid.')
    })
  }
  return fouten
}

// Een gewichtsmeting.
export function controleerGewicht(meting) {
  if (!isObject(meting)) return ['Geen geldige meting.']
  const fouten = []
  controleerId(meting, fouten)
  if (!isGeldigeDatum(meting.datum)) fouten.push('Ongeldige datum.')
  if (!isGetal(meting.kg) || meting.kg < MIN_GEWICHT_KG || meting.kg > MAX_GEWICHT_KG) {
    fouten.push(`Gewicht moet tussen ${MIN_GEWICHT_KG} en ${MAX_GEWICHT_KG} kg liggen.`)
  }
  return fouten
}

// Een soort beweging (bijvoorbeeld "Wandelen" met MET-waarde 3,5).
export function controleerBewegingssoort(soort) {
  if (!isObject(soort)) return ['Geen geldige soort beweging.']
  const fouten = []
  controleerId(soort, fouten)
  controleerNaam(soort.naam, fouten)
  if (!isGetal(soort.met) || soort.met < 1 || soort.met > 25) fouten.push('MET-waarde moet tussen 1 en 25 liggen.')
  return fouten
}

// Een geregistreerde activiteit.
export function controleerBeweging(activiteit) {
  if (!isObject(activiteit)) return ['Geen geldige activiteit.']
  const fouten = []
  controleerId(activiteit, fouten)
  if (!isGeldigeDatum(activiteit.datum)) fouten.push('Ongeldige datum.')
  controleerNaam(activiteit.soortNaam, fouten, 'Soort')
  if (!isGetal(activiteit.met) || activiteit.met < 1 || activiteit.met > 25) fouten.push('Ongeldige MET-waarde.')
  if (!isGetal(activiteit.minuten) || activiteit.minuten <= 0 || activiteit.minuten > MAX_MINUTEN) {
    fouten.push(`Duur moet tussen 1 en ${MAX_MINUTEN} minuten liggen.`)
  }
  if (activiteit.afstandKm !== undefined && activiteit.afstandKm !== null &&
      (!isGetal(activiteit.afstandKm) || activiteit.afstandKm < 0 || activiteit.afstandKm > 1000)) {
    fouten.push('Ongeldige afstand.')
  }
  return fouten
}

// Een instelling (sleutel + waarde).
export function controleerInstelling(instelling) {
  if (!isObject(instelling)) return ['Geen geldige instelling.']
  const fouten = []
  if (typeof instelling.sleutel !== 'string' || instelling.sleutel === '') fouten.push('Instelling zonder naam.')
  if (instelling.sleutel === 'laatsteBackup' && instelling.waarde !== null && !isGeldigTijdstip(instelling.waarde)) {
    fouten.push('Ongeldige datum van laatste back-up.')
  }
  return fouten
}

// Welke controle bij welke tabel hoort (gebruikt bij het terugzetten van een back-up).
export const CONTROLE_PER_TABEL = {
  producten: controleerProduct,
  porties: (p) => controleerPortie(p, true),
  recepten: controleerRecept,
  dagboek: controleerDagboekregel,
  gewicht: controleerGewicht,
  bewegingssoorten: controleerBewegingssoort,
  beweging: controleerBeweging,
  instellingen: controleerInstelling
}

// Controleert de buitenkant van een back-upbestand (nog niet de inhoud per regel).
// In:  het ingelezen JSON-object, de huidige schemaversie en de lijst tabelnamen
// Uit: lijst foutmeldingen
export function controleerBackupVorm(backup, huidigeVersie, tabelnamen) {
  if (!isObject(backup)) return ['Dit is geen back-upbestand van deze app.']
  if (backup.app !== 'voedingsdagboek') return ['Dit is geen back-upbestand van deze app.']
  const fouten = []
  if (!Number.isInteger(backup.schemaVersie) || backup.schemaVersie < 1) fouten.push('Onbekende versie van de back-up.')
  else if (backup.schemaVersie > huidigeVersie) {
    fouten.push('Deze back-up komt uit een nieuwere versie van de app. Werk de app eerst bij.')
  }
  if (!isGeldigTijdstip(backup.gemaakt)) fouten.push('De back-up heeft geen geldige datum.')
  if (!isObject(backup.gegevens)) {
    fouten.push('De back-up bevat geen gegevens.')
    return fouten
  }
  for (const [tabel, rijen] of Object.entries(backup.gegevens)) {
    if (!tabelnamen.includes(tabel)) fouten.push(`Onbekend onderdeel in de back-up: ${tabel}.`)
    else if (!Array.isArray(rijen)) fouten.push(`Onderdeel ${tabel} is geen lijst.`)
  }
  return fouten
}

// Velden die per tabel maar één keer mogen voorkomen (naast het volgnummer).
const UNIEKE_VELDEN = { gewicht: 'datum', instellingen: 'sleutel' }

// Controleert alle regels in de gegevens van een back-up.
// Geeft hoogstens "max" fouten terug, met vermelding van onderdeel en regelnummer.
export function controleerBackupInhoud(gegevens, max = 20) {
  const fouten = []
  for (const [tabel, rijen] of Object.entries(gegevens)) {
    const controleer = CONTROLE_PER_TABEL[tabel]
    if (!controleer) continue
    const gezieneIds = new Set()
    const uniekVeld = UNIEKE_VELDEN[tabel]
    const gezieneWaarden = new Set()
    rijen.forEach((rij, index) => {
      const rijFouten = [...controleer(rij)]
      if (rij && rij.id !== undefined) {
        if (gezieneIds.has(rij.id)) rijFouten.push('Dubbel volgnummer (id).')
        gezieneIds.add(rij.id)
      }
      if (rij && uniekVeld) {
        if (gezieneWaarden.has(rij[uniekVeld])) rijFouten.push(`${uniekVeld} komt dubbel voor.`)
        gezieneWaarden.add(rij[uniekVeld])
      }
      for (const fout of rijFouten) fouten.push(`${tabel}, regel ${index + 1}: ${fout}`)
    })
  }
  return fouten.slice(0, max)
}
