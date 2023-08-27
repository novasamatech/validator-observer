import { ApiPromise } from '@polkadot/api';
import { Vote } from './Vote';

export class StandardVote extends Vote {
    direction: boolean;

    constructor(voteData) {
        super(voteData);
        this.direction = this.decideDirection();
    }

    private decideDirection(): boolean {
        const vote = this.data?.Standard?.vote?.vote;
        if (vote === "Aye") {
            return true;
        } else if (vote === "Nay") {
            return false;
        } else {
            throw new Error(`Unexpected vote value: ${vote}`);
        }
    }

    public createPayload(api: ApiPromise, balance: any) {
        return api.createType('PalletConvictionVotingVoteAccountVote', {
            'Standard': {
                'vote': {
                    'aye': this.direction,
                    'conviction': 'Locked1x',
                },
                'balance': balance
            }
        });

    }
}
