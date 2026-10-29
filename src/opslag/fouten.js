// Een fout die betekent: de ingevoerde gegevens kloppen niet.
// "fouten" is een lijst meldingen in gewone taal, om op het scherm te tonen.

export class OngeldigeInvoer extends Error {
  constructor(fouten) {
    super(fouten.join(' '))
    this.name = 'OngeldigeInvoer'
    this.fouten = fouten
  }
}
