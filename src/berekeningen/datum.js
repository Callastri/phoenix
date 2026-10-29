// Werken met datums in de vorm 'JJJJ-MM-DD' (bijvoorbeeld '2026-10-29').
// Altijd in de tijdzone van het toestel, zodat "vandaag" klopt met je klok.

const WEEKDAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

// Maakt van een Date-object een datumtekst 'JJJJ-MM-DD' (lokale tijd).
export function naarDatumTekst(datum) {
  const j = datum.getFullYear()
  const m = String(datum.getMonth() + 1).padStart(2, '0')
  const d = String(datum.getDate()).padStart(2, '0')
  return `${j}-${m}-${d}`
}

// Maakt van 'JJJJ-MM-DD' een Date-object om 12:00 's middags lokale tijd.
// (12:00 voorkomt fouten rond de wissel van zomer- naar wintertijd.)
export function naarDate(datumTekst) {
  const [j, m, d] = datumTekst.split('-').map(Number)
  return new Date(j, m - 1, d, 12)
}

// De datum van vandaag als tekst. "nu" kan je meegeven voor tests.
export function vandaag(nu = new Date()) {
  return naarDatumTekst(nu)
}

// Telt dagen op bij een datum. verschuifDag('2026-10-31', 1) → '2026-11-01'.
export function verschuifDag(datumTekst, aantalDagen) {
  const datum = naarDate(datumTekst)
  datum.setDate(datum.getDate() + aantalDagen)
  return naarDatumTekst(datum)
}

// Controleert of een tekst een echte datum is (dus geen 31 februari).
export function isGeldigeDatum(datumTekst) {
  if (typeof datumTekst !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datumTekst)) return false
  const [j] = datumTekst.split('-').map(Number)
  if (j < 1900 || j > 2200) return false
  return naarDatumTekst(naarDate(datumTekst)) === datumTekst
}

// Controleert of een tekst een geldig tijdstip is (zoals '2026-10-29T12:00:00.000Z').
export function isGeldigTijdstip(tekst) {
  return typeof tekst === 'string' && tekst.length >= 10 && !Number.isNaN(Date.parse(tekst))
}

// Aantal hele dagen tussen twee tijdstippen (Date-objecten of tijdsteksten).
export function dagenTussen(van, tot) {
  const ms = new Date(tot).getTime() - new Date(van).getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

// Leesbare datum voor op het scherm.
// 'Vandaag', 'Gisteren', 'Morgen', of bijvoorbeeld 'di 27 okt' (met jaar als dat anders is).
export function toonDatum(datumTekst, vandaagTekst = vandaag()) {
  if (datumTekst === vandaagTekst) return 'Vandaag'
  if (datumTekst === verschuifDag(vandaagTekst, -1)) return 'Gisteren'
  if (datumTekst === verschuifDag(vandaagTekst, 1)) return 'Morgen'
  const datum = naarDate(datumTekst)
  const tekst = `${WEEKDAGEN[datum.getDay()]} ${datum.getDate()} ${MAANDEN[datum.getMonth()]}`
  const zelfdeJaar = datumTekst.slice(0, 4) === vandaagTekst.slice(0, 4)
  return zelfdeJaar ? tekst : `${tekst} ${datum.getFullYear()}`
}
