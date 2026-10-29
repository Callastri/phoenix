// Grenzen en instellingen die je zelf kunt aanpassen.
// Ze worden gebruikt bij het controleren van invoer en bij het terugzetten van een back-up.

// Hoogst mogelijke waarde per 100 g of 100 ml.
// (Pure olie heeft ongeveer 900 kcal per 100 g; meer kan niet.)
export const MAX_PER_100 = {
  kcal: 900,
  eiwit: 100,
  koolhydraten: 100,
  vet: 100,
  vezels: 100,
  suiker: 100,
  zout: 100
}

// Grootste hoeveelheid voor één regel in het dagboek (in gram of ml).
export const MAX_HOEVEELHEID = 10000

// Langste naam voor een product of regel.
export const MAX_NAAM_LENGTE = 120

// Toegestaan lichaamsgewicht in kg.
export const MIN_GEWICHT_KG = 20
export const MAX_GEWICHT_KG = 400

// Langste duur van één activiteit, in minuten (24 uur).
export const MAX_MINUTEN = 1440

// Na hoeveel dagen zonder back-up de app je eraan herinnert.
export const BACKUP_HERINNERING_DAGEN = 7
