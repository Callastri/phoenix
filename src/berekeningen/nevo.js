// Zet het NEVO-bestand van de app (public/nevo.json) om naar producten.
//
// Het bestand bevat de NEVO-gegevens ONGEWIJZIGD (zie scripts/nevo-naar-json.js).
// Alleen "zout" wordt hier berekend uit natrium, en zo gemarkeerd.

import { normaliseer } from './zoeken.js'
import { zoutUitNatrium } from './voeding.js'

// De kolommen in public/nevo.json, in deze volgorde.
export const NEVO_KOLOMMEN = [
  'code', 'naam', 'synoniem', 'eenheid',
  'kcal', 'eiwit', 'koolhydraten', 'vet', 'vezels', 'suiker', 'natriumMg'
]

// In:  de inhoud van nevo.json ({ versie, kolommen, rijen })
// Uit: lijst producten, bijvoorbeeld
//      { ref: { soort: 'nevo', id: 1 }, bron: 'nevo', naam, synoniem, eenheid,
//        waarden: { kcal, ..., zout }, zoutBerekend: true, porties: [] }
export function nevoNaarProducten(bestand) {
  if (!bestand || !Array.isArray(bestand.rijen)) throw new Error('Ongeldig NEVO-bestand')
  if (JSON.stringify(bestand.kolommen) !== JSON.stringify(NEVO_KOLOMMEN)) {
    throw new Error('NEVO-bestand heeft andere kolommen dan verwacht')
  }
  return bestand.rijen.map((rij) => {
    const [code, naam, synoniem, eenheid, kcal, eiwit, koolhydraten, vet, vezels, suiker, natriumMg] = rij
    return {
      ref: { soort: 'nevo', id: code },
      bron: 'nevo',
      naam,
      synoniem: synoniem ?? '',
      eenheid,
      waarden: { kcal, eiwit, koolhydraten, vet, vezels, suiker, zout: zoutUitNatrium(natriumMg) },
      zoutBerekend: natriumMg !== null,
      porties: [],
      // Vooraf klaargezet om sneller te zoeken.
      zoekNaam: normaliseer(naam),
      zoekExtra: normaliseer(synoniem)
    }
  })
}
