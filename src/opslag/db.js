// De database op het toestel (IndexedDB, via de library Dexie).
// Alle andere bestanden in deze map gebruiken "db" uit dit bestand.

import Dexie from 'dexie'
import { VERSIES } from './schema.js'
import { migreerDatabase } from './migraties.js'

export const DATABASE_NAAM = 'voedingsdagboek'

// Maakt een database met alle versies en migraties uit schema.js.
// "naam" en "versies" kun je meegeven in tests; de app gebruikt de standaard.
export function maakDatabase(naam = DATABASE_NAAM, versies = VERSIES) {
  const database = new Dexie(naam)
  for (const versie of versies) {
    const stap = database.version(versie.versie).stores(versie.tabellen)
    if (versie.migratie) {
      stap.upgrade((transactie) => migreerDatabase(transactie, versie.migratie))
    }
  }
  return database
}

// De database die de app gebruikt.
export const db = maakDatabase()
