// Back-up maken, terugzetten, en alle gegevens wissen.
//
// Een back-up is één JSON-bestand met ALLE tabellen. Zie docs/ARCHITECTUUR.md.
// Terugzetten gebeurt in twee stappen:
//   1. leesBackup(tekst)    → controleert alles, verandert nog niets
//   2. herstelBackup(...)   → wist de huidige gegevens en zet de back-up terug
// Is er ook maar één fout, dan wordt er niets veranderd.

import { db } from './db.js'
import { VERSIES, HUIDIGE_VERSIE, TABELNAMEN } from './schema.js'
import { migreerGegevens } from './migraties.js'
import { controleerBackupVorm, controleerBackupInhoud } from '../berekeningen/controle.js'
import { maakDagboekCsv } from '../berekeningen/csv.js'

// Maakt een back-upobject met alle gegevens.
// "nu" en "appVersie" kun je meegeven (handig voor tests).
export async function maakBackup({ nu = new Date(), appVersie = '' } = {}) {
  const gegevens = {}
  await db.transaction('r', TABELNAMEN, async () => {
    for (const tabel of TABELNAMEN) gegevens[tabel] = await db.table(tabel).toArray()
  })
  return {
    app: 'voedingsdagboek',
    schemaVersie: HUIDIGE_VERSIE,
    appVersie,
    gemaakt: nu.toISOString(),
    gegevens
  }
}

// Leest en controleert de tekst van een back-upbestand. Verandert niets.
// Uit: { ok: true, gegevens, gemaakt, aantallen } of { ok: false, fouten: [...] }
export function leesBackup(tekst) {
  let backup
  try {
    backup = JSON.parse(tekst)
  } catch {
    return { ok: false, fouten: ['Dit bestand kan niet gelezen worden (geen geldige JSON).'] }
  }
  const vormFouten = controleerBackupVorm(backup, HUIDIGE_VERSIE, TABELNAMEN)
  if (vormFouten.length > 0) return { ok: false, fouten: vormFouten }

  // Oude back-up? Eerst omzetten naar de nieuwste versie, dan pas controleren.
  const gegevens = migreerGegevens(backup.gegevens, backup.schemaVersie, VERSIES)
  const inhoudFouten = controleerBackupInhoud(gegevens)
  if (inhoudFouten.length > 0) return { ok: false, fouten: inhoudFouten }

  const aantallen = {}
  for (const tabel of TABELNAMEN) aantallen[tabel] = gegevens[tabel].length
  return { ok: true, gegevens, gemaakt: backup.gemaakt, aantallen }
}

// Wist alle huidige gegevens en zet de gecontroleerde back-up terug.
// In:  het resultaat van leesBackup (moet ok zijn)
// Gebeurt in één transactie: lukt iets niet, dan blijft alles zoals het was.
export async function herstelBackup(gelezen) {
  if (!gelezen || !gelezen.ok) throw new Error('Alleen een gecontroleerde back-up kan teruggezet worden.')
  await db.transaction('rw', TABELNAMEN, async () => {
    for (const tabel of TABELNAMEN) await db.table(tabel).clear()
    for (const tabel of TABELNAMEN) await db.table(tabel).bulkAdd(gelezen.gegevens[tabel])
    // De teruggezette back-up telt als laatste back-up.
    await db.instellingen.put({ sleutel: 'laatsteBackup', waarde: gelezen.gemaakt })
  })
}

// Wist ALLE gegevens op dit toestel.
export async function wisAlles() {
  await db.transaction('rw', TABELNAMEN, async () => {
    for (const tabel of TABELNAMEN) await db.table(tabel).clear()
  })
}

// Maakt CSV-tekst van het hele dagboek.
export async function maakCsv() {
  return maakDagboekCsv(await db.dagboek.toArray())
}

// Bestandsnaam voor een back-up, bijvoorbeeld "voedingsdagboek-2026-10-29.json".
export function backupBestandsnaam(datumTekst, extensie = 'json') {
  return `voedingsdagboek-${datumTekst}.${extensie}`
}
