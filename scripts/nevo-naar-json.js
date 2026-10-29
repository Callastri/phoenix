// Zet het NEVO-databestand van het RIVM om naar public/nevo.json voor de app.
//
// Gebruik (in de projectmap):
//   node scripts/nevo-naar-json.js pad/naar/NEVO-bestand.csv [versie]
// Voorbeeld:
//   node scripts/nevo-naar-json.js ~/Downloads/NEVO2025_9.0.csv 2025/9.0
//
// Bij een nieuwe NEVO-versie: draai dit opnieuw met het nieuwe bestand.
// Het originele RIVM-bestand hoort NIET in de repository; alleen public/nevo.json.

import { readFileSync, writeFileSync } from 'node:fs'
import { leesTekst, zetNevoOm, naarJsonTekst } from './nevo-lezen.js'

const [pad, versie] = process.argv.slice(2)
if (!pad) {
  console.error('Gebruik: node scripts/nevo-naar-json.js pad/naar/NEVO-bestand.csv [versie]')
  process.exit(1)
}

const { bestand, waarschuwingen } = zetNevoOm(leesTekst(readFileSync(pad)), versie ?? null)
for (const w of waarschuwingen) console.warn('Let op:', w)
const doel = new URL('../public/nevo.json', import.meta.url)
writeFileSync(doel, naarJsonTekst(bestand))
console.log(`Klaar: ${bestand.rijen.length} producten, NEVO-versie ${bestand.versie} → public/nevo.json`)
