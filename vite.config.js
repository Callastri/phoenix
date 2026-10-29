// Instellingen voor Vite (bouwen) en Vitest (testen).

import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

const pakket = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// Content-Security-Policy: de browser blokkeert ALLE verbindingen behalve
// met de eigen site en (voor barcodes) met Open Food Facts.
// Zo kan geen enkel script stiekem gegevens versturen. Zie docs/PRIVACY.md.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://world.openfoodfacts.org",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ')

// Zet de Content-Security-Policy alleen in de gebouwde app.
// (Tijdens het ontwikkelen heeft Vite zelf inline stijlen nodig.)
function zetBeveiligingsregels() {
  return {
    name: 'zet-beveiligingsregels',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`)
    }
  }
}

export default defineConfig({
  // De app staat op https://callastri.github.io/phoenix/ (naam van de repository).
  base: '/phoenix/',
  plugins: [zetBeveiligingsregels()],
  define: {
    __APP_VERSIE__: JSON.stringify(pakket.version)
  },
  test: {
    environment: 'node',
    setupFiles: ['tests/opzet.js']
  }
})
