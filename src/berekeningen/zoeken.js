// Zoeken in producten op naam.
// Hoofdletters en accenten maken niet uit: "creme" vindt ook "Crème".

// Maakt tekst klaar om te vergelijken: kleine letters, zonder accenten, enkele spaties.
// Voorbeeld: "  Crème Fraîche " → "creme fraiche"
export function normaliseer(tekst) {
  return String(tekst ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim()
}

// Geeft een score: hoe beter het product bij de zoekterm past, hoe hoger.
// 0 betekent: past niet (niet elk zoekwoord komt voor).
// In:  genormaliseerde tekst van het product en de zoekwoorden
//
// NEVO zet het hoofdproduct vooraan ("Melk halfvolle", "Ei kippen- gekookt").
// Daarom tellen mee:
// - elk zoekwoord dat een heel woord in de naam is (of het begin van een woord);
// - of het EERSTE woord van de naam bij de zoekwoorden past;
// - hoeveel van de naam door de zoekwoorden gedekt wordt
//   ("Melk halfvolle" past beter bij "halfvolle melk" dan "Saus v halfvolle melk en maizena").
function score(naam, extra, woorden) {
  const alles = `${naam} ${extra}`
  if (!woorden.every((w) => alles.includes(w))) return 0
  const naamWoorden = naam.split(' ').filter(Boolean)
  let punten = 1

  for (const w of woorden) {
    if (naamWoorden.includes(w)) punten += 25                               // heel woord ("appel")
    else if (naamWoorden.some((deel) => deel.startsWith(w))) punten += 12   // begin van een woord ("appelmoes")
    else if (naamWoorden.some((deel) => deel.includes(w))) punten += 8      // in een samengesteld woord ("tarwebrood")
  }

  const eerste = naamWoorden[0] ?? ''
  if (woorden.includes(eerste)) punten += 15
  else if (woorden.some((w) => eerste.startsWith(w))) punten += 8
  else if (woorden.some((w) => eerste.includes(w))) punten += 5

  let gedekt = 0
  for (const deel of naamWoorden) {
    if (woorden.includes(deel)) gedekt += 1
    else if (woorden.some((w) => deel.includes(w))) gedekt += 0.5
  }
  punten += 60 * (gedekt / Math.max(naamWoorden.length, 1))

  const zinsdeel = woorden.join(' ')
  if (naam.startsWith(zinsdeel)) punten += 30
  else if (naam.includes(zinsdeel)) punten += 10

  punten -= naam.length / 100                                               // kortere namen iets hoger
  return punten
}

// Zoekt producten.
// In:  lijst producten (met "naam" en eventueel "synoniem"), zoekterm, maximum aantal
// Uit: de best passende producten, beste eerst
export function zoekProducten(producten, zoekterm, max = 50) {
  const woorden = normaliseer(zoekterm).split(' ').filter(Boolean)
  if (woorden.length === 0) return []
  const gevonden = []
  for (const product of producten) {
    const naam = product.zoekNaam ?? normaliseer(product.naam)
    const extra = product.zoekExtra ?? normaliseer(product.synoniem)
    const punten = score(naam, extra, woorden)
    if (punten > 0) gevonden.push({ product, punten })
  }
  gevonden.sort((a, b) => b.punten - a.punten || a.product.naam.localeCompare(b.product.naam, 'nl'))
  return gevonden.slice(0, max).map((g) => g.product)
}
