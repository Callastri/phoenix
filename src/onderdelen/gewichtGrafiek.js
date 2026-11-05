// Grafiek van het gewicht: losse metingen (oranje punten) en het
// 7-daags gemiddelde (blauwe lijn). Eén y-as in kg.
// Tik of beweeg over de grafiek om de waarden van een dag te zien.

import { naarDate, toonDatum, naarDatumTekst } from '../berekeningen/datum.js'
import { toonGetal } from '../berekeningen/getallen.js'
import { el } from './html.js'

const NS = 'http://www.w3.org/2000/svg'
const B = 340, H = 200                          // maten van de tekening (schaalt mee)
const MARGE = { links: 36, rechts: 44, boven: 10, onder: 24 }

function svg(tag, attributen = {}) {
  const element = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attributen)) element.setAttribute(k, v)
  return element
}

// Mooie stappen voor de y-as (0,5 / 1 / 2 / 5 kg).
function yStappen(min, max) {
  const bereik = max - min
  const stap = [0.5, 1, 2, 5, 10].find((s) => bereik / s <= 4) ?? 10
  const eerste = Math.ceil(min / stap) * stap
  const stappen = []
  for (let w = eerste; w <= max + 1e-9; w += stap) stappen.push(Math.round(w * 10) / 10)
  return stappen
}

// In:  punten = [{ datum, kg, gemiddelde }] (oudste eerst)
// Uit: een element met legenda, grafiek en tooltip
export function maakGewichtGrafiek(punten) {
  const tijden = punten.map((p) => naarDate(p.datum).getTime())
  let tMin = Math.min(...tijden)
  let tMax = Math.max(...tijden)
  if (tMin === tMax) { tMin -= 3 * 864e5; tMax += 3 * 864e5 }
  const waarden = punten.flatMap((p) => [p.kg, p.gemiddelde]).filter((w) => w !== null)
  const yMin = Math.floor((Math.min(...waarden) - 0.5) * 2) / 2
  const yMax = Math.ceil((Math.max(...waarden) + 0.5) * 2) / 2

  const x = (t) => MARGE.links + ((t - tMin) / (tMax - tMin)) * (B - MARGE.links - MARGE.rechts)
  const y = (kg) => MARGE.boven + (1 - (kg - yMin) / (yMax - yMin)) * (H - MARGE.boven - MARGE.onder)

  const teken = svg('svg', { viewBox: `0 0 ${B} ${H}`, class: 'grafiek', role: 'img',
    'aria-label': 'Grafiek van je gewicht en het 7-daags gemiddelde. De waarden staan ook in de lijst hieronder.' })

  // Raster en y-as (rustig, op de achtergrond).
  for (const stap of yStappen(yMin, yMax)) {
    teken.append(svg('line', { x1: MARGE.links, x2: B - MARGE.rechts, y1: y(stap), y2: y(stap), class: 'grafiek-raster' }))
    const label = svg('text', { x: MARGE.links - 6, y: y(stap) + 4, class: 'grafiek-as', 'text-anchor': 'end' })
    label.textContent = toonGetal(stap, stap % 1 ? 1 : 0)
    teken.append(label)
  }
  // X-as: eerste en laatste datum.
  for (const [t, anker] of [[tMin, 'start'], [tMax, 'end']]) {
    const label = svg('text', { x: x(t), y: H - 6, class: 'grafiek-as', 'text-anchor': anker })
    label.textContent = toonDatum(naarDatumTekst(new Date(t)))
    teken.append(label)
  }

  // Lijn van het 7-daags gemiddelde.
  const lijnPunten = punten.filter((p) => p.gemiddelde !== null)
  if (lijnPunten.length > 1) {
    const d = lijnPunten.map((p, i) => `${i ? 'L' : 'M'}${x(naarDate(p.datum).getTime()).toFixed(1)},${y(p.gemiddelde).toFixed(1)}`).join(' ')
    teken.append(svg('path', { d, class: 'grafiek-lijn' }))
  }
  // Losse metingen (met een rand in de achtergrondkleur, zodat ze los van de lijn staan).
  for (const p of punten) {
    teken.append(svg('circle', { cx: x(naarDate(p.datum).getTime()), cy: y(p.kg), r: 4, class: 'grafiek-punt' }))
  }
  // Direct label bij de laatste waarde van het gemiddelde.
  const laatste = lijnPunten[lijnPunten.length - 1]
  if (laatste) {
    const label = svg('text', { x: x(naarDate(laatste.datum).getTime()) + 6, y: y(laatste.gemiddelde) + 4, class: 'grafiek-label' })
    label.textContent = toonGetal(laatste.gemiddelde, 1)
    teken.append(label)
  }

  // Aanwijzen: verticale lijn + tooltip bij het dichtstbijzijnde punt.
  const kruis = svg('line', { y1: MARGE.boven, y2: H - MARGE.onder, class: 'grafiek-kruis', visibility: 'hidden' })
  const ring = svg('circle', { r: 6, class: 'grafiek-ring', visibility: 'hidden' })
  teken.append(kruis, ring)
  const tooltip = el('div', { class: 'grafiek-tooltip', role: 'status', hidden: true })

  function wijsAan(gebeurtenis) {
    const vak = teken.getBoundingClientRect()
    const muisX = ((gebeurtenis.clientX - vak.left) / vak.width) * B
    let beste = punten[0]
    for (const p of punten) {
      if (Math.abs(x(naarDate(p.datum).getTime()) - muisX) < Math.abs(x(naarDate(beste.datum).getTime()) - muisX)) beste = p
    }
    const px = x(naarDate(beste.datum).getTime())
    kruis.setAttribute('x1', px); kruis.setAttribute('x2', px); kruis.setAttribute('visibility', 'visible')
    ring.setAttribute('cx', px); ring.setAttribute('cy', y(beste.kg)); ring.setAttribute('visibility', 'visible')
    tooltip.hidden = false
    tooltip.replaceChildren(
      el('strong', {}, toonDatum(beste.datum)),
      el('span', {}, `Gewicht: ${toonGetal(beste.kg, 1)} kg`),
      el('span', {}, `Gemiddelde 7 dagen: ${toonGetal(beste.gemiddelde, 1)} kg`)
    )
    const links = (px / B) * vak.width
    tooltip.style.left = `${Math.min(Math.max(links, 70), vak.width - 70)}px`
  }
  teken.addEventListener('pointermove', wijsAan)
  teken.addEventListener('pointerdown', wijsAan)
  teken.addEventListener('pointerleave', () => {
    kruis.setAttribute('visibility', 'hidden'); ring.setAttribute('visibility', 'hidden'); tooltip.hidden = true
  })

  return el('div', { class: 'grafiek-blok' },
    el('ul', { class: 'legenda' },
      el('li', {}, el('span', { class: 'legenda-punt', 'aria-hidden': 'true' }), 'Meting'),
      el('li', {}, el('span', { class: 'legenda-lijn', 'aria-hidden': 'true' }), 'Gemiddelde 7 dagen')
    ),
    el('div', { class: 'grafiek-houder' }, teken, tooltip)
  )
}
