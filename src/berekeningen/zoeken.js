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
function score(naam, extra, woorden) {
  const alles = `${naam} ${extra}`
  if (!woorden.every((w) => alles.includes(w))) return 0
  const zinsdeel = woorden.join(' ')
  let punten = 1
  if (naam.startsWith(zinsdeel)) punten += 100                    // naam begint met de zoekterm
  else if (naam.includes(zinsdeel)) punten += 40                  // zoekterm staat in de naam
  const naamWoorden = naam.split(' ')
  for (const w of woorden) {
    if (naamWoorden.includes(w)) punten += 20                          // heel woord ("appel")
    else if (naamWoorden.some((deel) => deel.startsWith(w))) punten += 10  // begin van een woord ("appelmoes")
  }
  punten -= naam.length / 100                                       // kortere namen iets hoger
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
