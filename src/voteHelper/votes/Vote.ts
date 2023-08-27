import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types';
import { AbstainVote, StandardVote, SplitVote } from './';

export abstract class Vote {
    referendaNumber: number;
    data: any;
    direction?: boolean;

    constructor(voteData) {
        if (voteData.referendaNumber) {
            this.referendaNumber = voteData.referendaNumber;
            this.data = voteData.data;
            return;
        }
        this.buildData({ ...voteData.toHuman() });
        this.referendaNumber = Number(voteData.toHuman()[0]);
    }

    abstract createPayload(api: ApiPromise, balance: any): Codec;

    private buildData(data: any) {
        const key = Object.keys(data[1])[0];
        const vote = data[1][key];
        this.data = {
            [key]: vote
        };
    }

    static createVote(voteData) {
        const voteType = voteData[1];
        if (voteType.isStandard) {
            return new StandardVote(voteData);
        } else if (voteType.isSplitAbstain) {
            return new AbstainVote(voteData);
        } else if (voteType.isSplit) {
            return new SplitVote(voteData);
        } else {
            throw new Error(`Unexpected vote type: ${voteData}`)
        }
    }
}
