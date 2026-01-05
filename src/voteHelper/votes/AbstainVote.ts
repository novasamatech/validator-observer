import { ApiPromise } from '@polkadot/api';
import { Vote } from './Vote';

export class AbstainVote extends Vote {
  direction: boolean;
  abstain: boolean;

  constructor(voteData) {
    super(voteData);
    this.abstain = false;
    this.direction = false;
    this.decideDirection();
  }

  private decideDirection(): void {
    const { aye, nay, abstain } = this.data?.SplitAbstain;
    this.direction = parseInt(aye) > Math.max(parseInt(nay), parseInt(abstain));
    this.abstain = parseInt(abstain) > Math.max(parseInt(aye), parseInt(nay));
  }

  public createPayload(api: ApiPromise, balance: any) {
    return api.createType('PalletConvictionVotingVoteAccountVote', {
      SplitAbstain: {
        aye: 0,
        nay: 0,
        abstain: balance,
      },
    });
  }
}
