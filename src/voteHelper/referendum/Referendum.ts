export class Referendum {
    number: number;
    data: any;

    constructor(referendaNumber, referendaData) {
        this.number = Number(referendaNumber.toHuman()[0]);
        this.data = { ...referendaData.toJSON() };
    }
}
