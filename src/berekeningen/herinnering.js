// Beslist of de app moet herinneren aan een back-up.

import { dagenTussen } from './datum.js'

// In:  laatsteBackup (tijdstip als tekst, of null als er nog nooit een was),
//      nu (Date), heeftGegevens (true als er iets is om te bewaren),
//      maxDagen (na hoeveel dagen herinneren)
// Uit: true als er een herinnering moet komen
export function moetBackupHerinneren({ laatsteBackup, nu, heeftGegevens, maxDagen }) {
  if (!heeftGegevens) return false
  if (!laatsteBackup) return true
  return dagenTussen(laatsteBackup, nu) >= maxDagen
}

// Tekst over de laatste back-up, bijvoorbeeld "3 dagen geleden".
export function tekstLaatsteBackup(laatsteBackup, nu) {
  if (!laatsteBackup) return 'Nog nooit'
  const dagen = dagenTussen(laatsteBackup, nu)
  if (dagen <= 0) return 'Vandaag'
  if (dagen === 1) return 'Gisteren'
  return `${dagen} dagen geleden`
}
