import { ApiPromise } from '@polkadot/api';
import { Vote } from './Vote';

export class SplitVote extends Vote {
  direction: boolean;

  constructor(voteData) {
    super(voteData);
    this.direction = this.decideAyeNay();
  }

  private decideAyeNay() {
    const aye = parseInt(this.data?.Split?.aye.replace(/,/g, ''));
    const nay = parseInt(this.data?.Split?.nay.replace(/,/g, ''));
    return aye >= nay;
  }

  public createPayload(api: ApiPromise, balance: any) {
    return api.createType('PalletConvictionVotingVoteAccountVote', {
      Standard: {
        vote: {
          aye: this.direction,
          conviction: 'Locked1x',
        },
        balance: balance,
      },
    });
  }
}
