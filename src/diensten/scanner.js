// Barcode scannen met de camera.
//
// - Android (Chrome) heeft een ingebouwde barcodelezer; die gebruiken we als die er is.
// - iPhone (Safari) heeft dat niet. Dan gebruiken we ZXing (in WebAssembly).
//   Het WebAssembly-bestand komt mee met de app (niet van een andere server)
//   en wordt pas geladen als je echt gaat scannen.
// Er gaat geen camerabeeld het toestel uit.

import { isGeldigeBarcode } from '../berekeningen/barcode.js'

const FORMATEN = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

let lezerBelofte = null

// Maakt (één keer) een barcodelezer.
async function maakLezer() {
  if (!lezerBelofte) {
    lezerBelofte = (async () => {
      if ('BarcodeDetector' in window) {
        try {
          const ondersteund = await window.BarcodeDetector.getSupportedFormats()
          if (ondersteund.includes('ean_13')) {
            return new window.BarcodeDetector({ formats: FORMATEN.filter((f) => ondersteund.includes(f)) })
          }
        } catch { /* dan ZXing gebruiken */ }
      }
      const [{ BarcodeDetector, prepareZXingModule }, { default: wasmAdres }] = await Promise.all([
        import('barcode-detector/ponyfill'),
        import('zxing-wasm/reader/zxing_reader.wasm?url')
      ])
      await prepareZXingModule({
        overrides: { locateFile: (pad, voorvoegsel) => (pad.endsWith('.wasm') ? wasmAdres : voorvoegsel + pad) },
        fireImmediately: true
      })
      return new BarcodeDetector({ formats: FORMATEN })
    })()
    // Mislukt het laden, probeer het de volgende keer opnieuw.
    lezerBelofte.catch(() => { lezerBelofte = null })
  }
  return lezerBelofte
}

// Zet een UPC-A (12 cijfers) om naar EAN-13 door er een 0 voor te zetten.
// Zo wordt hetzelfde product altijd onder hetzelfde nummer gevonden.
function naarEan13(code) {
  return code.length === 12 ? `0${code}` : code
}

// Start de camera in een <video>-element en zoekt naar een barcode.
// In:  video-element, en een functie die de gevonden code krijgt
// Uit: { stop } — roep stop() aan om de camera uit te zetten
// Gooit een fout als de camera niet beschikbaar is of geen toestemming heeft.
export async function startScanner(video, bijGevonden) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('geen-camera')
  }
  const stroom = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
  })
  let gestopt = false
  const stop = () => {
    gestopt = true
    stroom.getTracks().forEach((spoor) => spoor.stop())
    video.srcObject = null
  }

  video.setAttribute('playsinline', '')   // nodig op iPhone, anders wordt het beeld schermvullend
  video.muted = true
  video.srcObject = stroom
  await video.play()

  let lezer
  try {
    lezer = await maakLezer()
  } catch (fout) {
    stop()
    throw fout
  }

  // Twee keer dezelfde code achter elkaar = betrouwbaar gelezen.
  let vorige = null
  async function kijk() {
    if (gestopt) return
    try {
      if (video.readyState >= 2) {
        const gevonden = await lezer.detect(video)
        const code = gevonden.map((b) => naarEan13(b.rawValue)).find(isGeldigeBarcode)
        if (code && code === vorige) {
          stop()
          bijGevonden(code)
          return
        }
        vorige = code ?? vorige
      }
    } catch { /* volgend beeld proberen */ }
    setTimeout(kijk, 150)
  }
  kijk()
  return { stop }
}
