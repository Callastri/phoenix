// Maakt CSV-tekst (voor Excel, Numbers of Google Sheets).
// We gebruiken ';' als scheidingsteken en een komma als decimaalteken,
// zodat Nederlandstalige Excel het bestand meteen goed opent.

import { VOEDINGSSTOFFEN } from '../gegevens/voedingsstoffen.js'
import { maaltijdNaam } from '../gegevens/maaltijden.js'
import { waardenVanRegel } from './voeding.js'
import { toonGetal } from './getallen.js'

// Maakt één veld veilig voor CSV.
// - Velden met ; " of een nieuwe regel komen tussen aanhalingstekens.
// - Tekst die begint met = + - @ krijgt een ' ervoor, zodat Excel er geen formule van maakt.
export function csvVeld(waarde) {
  let tekst = waarde === null || waarde === undefined ? '' : String(waarde)
  if (/^[=+\-@]/.test(tekst)) tekst = `'${tekst}`
  if (/[;"\n\r]/.test(tekst)) tekst = `"${tekst.replace(/"/g, '""')}"`
  return tekst
}

// Maakt een CSV-tekst van dagboekregels.
// Elke regel bevat de waarden voor de gegeten hoeveelheid (niet per 100 g).
// Onbekende waarden blijven een leeg veld.
export function maakDagboekCsv(regels) {
  const kop = [
    'Datum', 'Maaltijd', 'Naam', 'Hoeveelheid', 'Eenheid',
    ...VOEDINGSSTOFFEN.map((s) => `${s.naam} (${s.eenheid})`)
  ]
  const gesorteerd = [...regels].sort((a, b) => a.datum.localeCompare(b.datum) || a.id - b.id)
  const rijen = gesorteerd.map((regel) => {
    const waarden = waardenVanRegel(regel)
    return [
      regel.datum,
      maaltijdNaam(regel.maaltijd),
      regel.naam,
      toonGetal(regel.hoeveelheid, 1),
      regel.eenheid,
      ...VOEDINGSSTOFFEN.map((s) => (waarden[s.sleutel] === null ? '' : toonGetal(waarden[s.sleutel], s.decimalen)))
    ]
  })
  return [kop, ...rijen].map((rij) => rij.map(csvVeld).join(';')).join('\r\n') + '\r\n'
}
