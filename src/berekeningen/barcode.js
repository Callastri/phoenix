// Barcodes (EAN-13, EAN-8, UPC-A, GTIN-14) controleren.

// Haalt spaties en streepjes weg: "8 711327 538481" → "8711327538481".
export function schoneBarcode(tekst) {
  return String(tekst ?? '').replace(/[\s-]/g, '')
}

// Controleert of een barcode geldig is (juiste lengte én juist controlecijfer).
// Het laatste cijfer is een controlecijfer; zo vangen we leesfouten van de camera af.
// In:  tekst met alleen cijfers   Uit: true of false
export function isGeldigeBarcode(code) {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false
  const cijfers = code.split('').map(Number)
  const controle = cijfers.pop()
  // Van rechts naar links: afwisselend × 3 en × 1.
  let som = 0
  cijfers.reverse().forEach((cijfer, i) => { som += cijfer * (i % 2 === 0 ? 3 : 1) })
  return (10 - (som % 10)) % 10 === controle
}
