// Soorten beweging met hun MET-waarde.
//
// MET = hoeveel keer meer energie een activiteit kost dan stilzitten.
// Geschatte kcal = MET × lichaamsgewicht (kg) × duur (uren).
//
// Bron: Compendium of Physical Activities 2011 (Ainsworth e.a.); de code staat erbij.
// LET OP: overgenomen uit het Compendium zoals bekend bij de ontwikkelaar; de website
// was niet bereikbaar om ze na te kijken (zie docs/EISEN.md). Pas gerust aan.
//
// Je mag hier soorten toevoegen of waarden aanpassen.
// "sleutel" verander je liever niet: oude activiteiten bewaren hun eigen kopie van
// naam en MET, dus er gaat niets kapot, maar de sleutel koppelt ze aan deze lijst.
// "afstand: true" = er kan een afstand bij ingevuld worden.

export const STANDAARD_SOORTEN = [
  { sleutel: 'wandelen-rustig', naam: 'Wandelen, rustig (± 4 km/u)', met: 3.5, afstand: true, compendium: '17190' },
  { sleutel: 'wandelen-stevig', naam: 'Wandelen, stevig (± 5,5 km/u)', met: 4.3, afstand: true, compendium: '17200' },
  { sleutel: 'wandelen-snel', naam: 'Wandelen, snel (± 6,5 km/u)', met: 5.0, afstand: true, compendium: '17220' },
  { sleutel: 'hardlopen-8', naam: 'Hardlopen (± 8 km/u)', met: 8.3, afstand: true, compendium: '12030' },
  { sleutel: 'hardlopen-10', naam: 'Hardlopen (± 10 km/u)', met: 9.8, afstand: true, compendium: '12050' },
  { sleutel: 'hardlopen-11', naam: 'Hardlopen (± 11 km/u)', met: 11.0, afstand: true, compendium: '12070' },
  { sleutel: 'fietsen-rustig', naam: 'Fietsen, rustig (< 16 km/u)', met: 4.0, afstand: true, compendium: '01010' },
  { sleutel: 'fietsen-gemiddeld', naam: 'Fietsen, gemiddeld (16–19 km/u)', met: 6.8, afstand: true, compendium: '01020' },
  { sleutel: 'fietsen-stevig', naam: 'Fietsen, stevig (19–22 km/u)', met: 8.0, afstand: true, compendium: '01030' },
  { sleutel: 'zwemmen-rustig', naam: 'Zwemmen, rustig', met: 6.0, afstand: true, compendium: '18350' },
  { sleutel: 'zwemmen-baantjes', naam: 'Zwemmen, baantjes (snel)', met: 9.8, afstand: true, compendium: '18230' },
  { sleutel: 'kracht-matig', naam: 'Krachttraining, matig', met: 3.5, afstand: false, compendium: '02050' },
  { sleutel: 'kracht-zwaar', naam: 'Krachttraining, zwaar', met: 6.0, afstand: false, compendium: '02054' },
  { sleutel: 'yoga', naam: 'Yoga', met: 2.5, afstand: false, compendium: '02150' },
  { sleutel: 'pilates', naam: 'Pilates', met: 3.0, afstand: false, compendium: '02105' },
  { sleutel: 'aerobics', naam: 'Aerobics / danstraining', met: 7.3, afstand: false, compendium: '03015' },
  { sleutel: 'roeien', naam: 'Roeien op roeimachine, matig', met: 7.0, afstand: true, compendium: '02071' },
  { sleutel: 'tennis', naam: 'Tennis', met: 7.3, afstand: false, compendium: '15675' },
  { sleutel: 'voetbal', naam: 'Voetbal, recreatief', met: 7.0, afstand: false, compendium: '15610' },
  { sleutel: 'traplopen', naam: 'Traplopen, rustig', met: 4.0, afstand: false, compendium: '17133' },
  { sleutel: 'tuinieren', naam: 'Tuinieren', met: 3.8, afstand: false, compendium: '08245' },
  { sleutel: 'schoonmaken', naam: 'Huishouden, schoonmaken', met: 3.5, afstand: false, compendium: '05021' }
]
