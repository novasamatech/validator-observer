export class TrackVotes {
    trackNumber: number;
    data: any;

    constructor(trackNumber, trackVotes) {
        this.trackNumber = Number(trackNumber.toHuman());
        this.data = trackVotes;
    }
}
