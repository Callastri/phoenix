// Recent gebruikt en maaltijden kopiëren.

// Een sleutel voor een product, bijvoorbeeld 'nevo:123' of 'eigen:5'.
// Handmatige invoer (zonder product) krijgt 'handmatig:<naam>'.
export function productSleutel(productRef, naam = '') {
  if (productRef && productRef.soort) return `${productRef.soort}:${productRef.id}`
  return `handmatig:${String(naam).trim().toLowerCase()}`
}

// Bepaalt de recent gebruikte producten uit dagboekregels.
// In:  dagboekregels (in willekeurige volgorde), maximum aantal
// Uit: de meest recente regel per product (nieuwste eerst), zonder dubbele
export function recentGebruikt(regels, max = 30) {
  const gesorteerd = [...regels].sort((a, b) => (b.aangemaakt ?? '').localeCompare(a.aangemaakt ?? '') || b.id - a.id)
  const gezien = new Set()
  const uitkomst = []
  for (const regel of gesorteerd) {
    const sleutel = productSleutel(regel.productRef, regel.naam)
    if (gezien.has(sleutel)) continue
    gezien.add(sleutel)
    uitkomst.push(regel)
    if (uitkomst.length >= max) break
  }
  return uitkomst
}

// Maakt kopieën van dagboekregels voor een andere datum (en eventueel andere maaltijd).
// Het volgnummer (id) wordt weggelaten, zodat de database een nieuw nummer geeft.
// In:  regels, nieuwe datum, nieuwe maaltijd (of null = zelfde), tijdstip "nu"
export function maakKopieen(regels, naarDatum, naarMaaltijd, nu = new Date()) {
  return regels.map((regel) => {
    const { id, ...rest } = regel
    return {
      ...structuredClone(rest),
      datum: naarDatum,
      maaltijd: naarMaaltijd ?? regel.maaltijd,
      aangemaakt: nu.toISOString()
    }
  })
}
