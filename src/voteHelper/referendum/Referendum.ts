export class Referendum {
  number: number;
  data: any;

  constructor(referendaNumber, referendaData) {
    this.number = Number(referendaNumber.toHuman()[0].replace(/,/g, ''));
    this.data = { ...referendaData.toJSON() };
  }
}
