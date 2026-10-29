// Kleine hulp om HTML-elementen te maken zonder innerHTML.
// Zo kan tekst van buitenaf (zoals een productnaam) nooit als code uitgevoerd worden.
//
// Voorbeeld:
//   el('button', { class: 'knop', onclick: () => alert('hoi') }, 'Klik mij')
// geeft:  <button class="knop">Klik mij</button>  met een klik-actie.

export function el(tag, eigenschappen = {}, ...kinderen) {
  const element = document.createElement(tag)
  for (const [naam, waarde] of Object.entries(eigenschappen)) {
    if (waarde === null || waarde === undefined || waarde === false) continue
    if (naam.startsWith('on') && typeof waarde === 'function') {
      element.addEventListener(naam.slice(2), waarde)
    } else if (naam === 'class') {
      element.className = waarde
    } else if (naam === 'value') {
      element.value = waarde
    } else if (waarde === true) {
      element.setAttribute(naam, '')
    } else {
      element.setAttribute(naam, waarde)
    }
  }
  for (const kind of kinderen.flat()) {
    if (kind === null || kind === undefined || kind === false) continue
    element.append(kind instanceof Node ? kind : String(kind))
  }
  return element
}
