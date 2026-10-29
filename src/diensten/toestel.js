// Informatie over het toestel en de browser.

// Is dit een iPhone of iPad? (Een iPad doet zich soms voor als Mac.)
export function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Draait de app vanaf het beginscherm (als "app"), in plaats van in de browser?
export function isGeinstalleerd() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}

// Vraagt de browser om de gegevens niet zomaar te wissen.
// Uit: 'ja', 'nee' of 'niet-ondersteund'
export async function vraagPermanenteOpslag() {
  if (!navigator.storage || !navigator.storage.persist) return 'niet-ondersteund'
  try {
    if (await navigator.storage.persisted()) return 'ja'
    return (await navigator.storage.persist()) ? 'ja' : 'nee'
  } catch {
    return 'niet-ondersteund'
  }
}

// Kijkt of de opslag al permanent is (vraagt niets aan).
// Uit: 'ja', 'nee' of 'niet-ondersteund'
export async function statusPermanenteOpslag() {
  if (!navigator.storage || !navigator.storage.persisted) return 'niet-ondersteund'
  try {
    return (await navigator.storage.persisted()) ? 'ja' : 'nee'
  } catch {
    return 'niet-ondersteund'
  }
}
