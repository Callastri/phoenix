// Voorbeeldgegevens voor de tests.

export function waarden(overschrijf = {}) {
  return { kcal: 100, eiwit: 10, koolhydraten: 20, vet: 5, vezels: 2, suiker: 8, zout: 0.5, ...overschrijf }
}

export function regel(overschrijf = {}) {
  return {
    datum: '2026-10-29',
    maaltijd: 'ontbijt',
    productRef: null,
    naam: 'Havermout',
    waarden: waarden(),
    hoeveelheid: 50,
    eenheid: 'g',
    gram: 50,
    aangemaakt: '2026-10-29T08:00:00.000Z',
    ...overschrijf
  }
}
