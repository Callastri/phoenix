// Migraties: oude gegevens omzetten naar het nieuwste gegevensmodel.
// Wordt gebruikt bij het openen van de database én bij het terugzetten van een oude back-up.
// Zie schema.js voor hoe je een migratie toevoegt.

// Zet de gegevens van een back-up om naar de nieuwste versie.
// In:  gegevens ({ dagboek: [...], ... }), de versie waaruit ze komen, en de lijst versies
// Uit: NIEUWE gegevens (het origineel wordt niet veranderd), met alle tabellen aanwezig
export function migreerGegevens(gegevens, vanVersie, versies) {
  const nieuwste = versies[versies.length - 1]
  const uitkomst = {}
  for (const tabel of Object.keys(nieuwste.tabellen)) {
    uitkomst[tabel] = structuredClone(gegevens[tabel] ?? [])
  }
  for (const versie of versies) {
    if (versie.versie <= vanVersie || !versie.migratie) continue
    for (const [tabel, zetOm] of Object.entries(versie.migratie)) {
      uitkomst[tabel] = (uitkomst[tabel] ?? []).map((rij) => zetOm(structuredClone(rij)))
    }
  }
  return uitkomst
}

// Voert een migratie uit op de database van het toestel (gebruikt door db.js).
// In:  Dexie-transactie en het "migratie"-blok van één versie
export async function migreerDatabase(transactie, migratie) {
  for (const [tabel, zetOm] of Object.entries(migratie)) {
    await transactie.table(tabel).toCollection().modify((rij, ref) => {
      ref.value = zetOm(structuredClone(rij))
    })
  }
}
