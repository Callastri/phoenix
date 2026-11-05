// Getallen lezen uit invoervelden en netjes tonen.
// Werkt met een komma (Nederlands) én met een punt als decimaalteken.

// Leest een getal uit tekst.
// In:  tekst zoals "12,5", "12.5", " 3 " of ""
// Uit: een getal (12.5), null als het veld leeg is, of NaN als het geen getal is.
export function leesGetal(tekst) {
  if (tekst === null || tekst === undefined) return null
  const schoon = String(tekst).trim().replace(',', '.')
  if (schoon === '') return null
  // Alleen cijfers met hoogstens één decimaalteken; geen "1e5", geen "12abc".
  if (!/^-?\d+(\.\d+)?$|^-?\.\d+$/.test(schoon)) return NaN
  return Number(schoon)
}

// Toont een getal op Nederlandse wijze.
// In:  getal (of null) en het aantal decimalen
// Uit: tekst zoals "12,5"; een ontbrekende waarde wordt "–".
export function toonGetal(getal, decimalen = 0) {
  if (getal === null || getal === undefined || Number.isNaN(getal)) return '–'
  const factor = 10 ** decimalen
  const afgerond = Math.round(getal * factor) / factor
  // Voorkom "-0" na afronden.
  const zonderMinNul = Object.is(afgerond, -0) ? 0 : afgerond
  return zonderMinNul.toFixed(decimalen).replace('.', ',')
}

// Toont een getal zonder overbodige ",0": 25 → "25", 2,5 → "2,5".
export function toonKortGetal(getal) {
  return toonGetal(getal, getal % 1 ? 1 : 0)
}

// Toont een portie met het gewicht erbij, bijvoorbeeld "snee (35 g)".
// Staat het gewicht al in de naam (zoals "2 koeken (25 g)"), dan niet nog eens.
export function toonPortie(naam, gram, eenheid) {
  const gewicht = `${toonKortGetal(gram)} ${eenheid}`
  const zonderSpatie = (t) => t.replace(/\s/g, '').replace(',', '.').toLowerCase()
  if (zonderSpatie(naam).includes(zonderSpatie(`${gram}${eenheid}`))) return naam
  return `${naam} (${gewicht})`
}
