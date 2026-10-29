// Een bestand bewaren via het deelmenu van de telefoon.
// Op iPhone opent dit het deelmenu (kies "Bewaar in Bestanden" → iCloud Drive).
// Kan de browser geen bestanden delen, dan wordt het bestand gedownload.
//
// Let op: roep deelBestand aan DIRECT bij een tik op een knop (zonder eerst te wachten
// op iets anders), anders weigert Safari het deelmenu te openen.

// Uit: 'gedeeld', 'geannuleerd' of 'gedownload'
export async function deelBestand(bestand) {
  if (navigator.canShare && navigator.canShare({ files: [bestand] })) {
    try {
      await navigator.share({ files: [bestand] })
      return 'gedeeld'
    } catch (fout) {
      if (fout.name === 'AbortError') return 'geannuleerd'
      throw fout
    }
  }
  downloadBestand(bestand)
  return 'gedownload'
}

// Downloadt een bestand (de gewone manier op een computer of Android).
export function downloadBestand(bestand) {
  const adres = URL.createObjectURL(bestand)
  const link = document.createElement('a')
  link.href = adres
  link.download = bestand.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(adres), 10000)
}
