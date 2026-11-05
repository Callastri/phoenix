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

// Onder dit dagdoel (kcal) toont de app een waarschuwing (naast: onder je rustverbruik).
export const MIN_DOEL_KCAL = 1200

// Ongeveer zoveel kcal zit er in 1 kg lichaamsvet (gebruikt voor het tempo in de doelhulp).
export const KCAL_PER_KG = 7700

// Lengte in cm voor het profiel.
export const MIN_LENGTE_CM = 100
export const MAX_LENGTE_CM = 250
