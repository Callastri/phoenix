// Gewicht: 7-daags gemiddelde en trend.
// Een meting is { datum: 'JJJJ-MM-DD', kg }.

import { verschuifDag } from './datum.js'

// Gemiddelde van de metingen in de 7 dagen tot en met "datum".
// Uit: het gemiddelde in kg, of null als er in die 7 dagen geen meting is.
export function zevenDaagsGemiddelde(metingen, datum) {
  const vanaf = verschuifDag(datum, -6)
  const binnen = metingen.filter((m) => m.datum >= vanaf && m.datum <= datum)
  if (binnen.length === 0) return null
  return binnen.reduce((som, m) => som + m.kg, 0) / binnen.length
}

// Voegt aan elke meting het 7-daags gemiddelde toe; nieuwste eerst.
export function metingenMetGemiddelde(metingen) {
  return [...metingen]
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .map((m) => ({ ...m, gemiddelde: zevenDaagsGemiddelde(metingen, m.datum) }))
}

// Verschil tussen het 7-daags gemiddelde van nu en dat van "dagen" geleden.
// Uit: verschil in kg (negatief = lichter), of null als er te weinig metingen zijn.
export function trend(metingen, datum, dagen = 7) {
  const nu = zevenDaagsGemiddelde(metingen, datum)
  const toen = zevenDaagsGemiddelde(metingen, verschuifDag(datum, -dagen))
  if (nu === null || toen === null) return null
  return nu - toen
}

// Het gewicht dat het dichtst bij een datum ligt (bij gelijke afstand: het eerdere).
// Gebruikt om verbrande kcal bij beweging te schatten.
// Uit: kg, of null als er geen metingen zijn.
export function gewichtOpDatum(metingen, datum) {
  let beste = null
  let besteAfstand = Infinity
  const doel = Date.parse(datum)
  for (const m of metingen) {
    const afstand = Math.abs(Date.parse(m.datum) - doel)
    if (afstand < besteAfstand || (afstand === besteAfstand && m.datum < beste.datum)) {
      beste = m
      besteAfstand = afstand
    }
  }
  return beste ? beste.kg : null
}
