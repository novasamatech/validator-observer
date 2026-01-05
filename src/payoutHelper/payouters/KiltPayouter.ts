import { Validator } from '../../config/conf';
import { sendTransaction } from '../../utils';
import { PayoutHelper } from '../PayoutHelper';
import { AnyJson } from '@polkadot/types/types';

/**
 * KiltPayoutHelper is a class that extends PayoutHelper and provides methods to handle payouts on the Kilt network.
 */
export class KiltPayoutHelper extends PayoutHelper {
  /**
   * Payouts rewards to the given validators.
   * @param validators - The validators to payout rewards to.
   * @param sender - The sender of the transaction.
   * @param depth - Whether to payout rewards for all eras or just the current era.
   * @returns A promise that resolves when the rewards have been paid out.
   */
  async payoutRewards(validators: Validator[], sender, depth: boolean = false): Promise<void> {
    for (const validator of validators) {
      if (await this.needIncrement(validator.address)) {
        await this.incrementDelegatorRewards(validator.address, sender);
      }

      if (await this.needClaim(validator.address)) {
        await this.claimRewards(validator.address, sender);
      }
    }
  }

  /**
   * Increments the rewards for a given validator.
   * @param validator - The validator to increment rewards for.
   * @param sender - The sender of the transaction.
   * @returns A promise that resolves when the rewards have been incremented.
   */
  private async incrementDelegatorRewards(validator: string, sender: any): Promise<void> {
    const incrementDelegatorRewards = this.api.tx.parachainStaking.incrementDelegatorRewards();
    const proxyIncrementTransact = this.api.tx.proxy.proxy(
      validator,
      'ParachainStaking' as 'Any',
      incrementDelegatorRewards,
    );
    await sendTransaction(proxyIncrementTransact, sender, this.api);
  }

  /**
   * Checks if increment is needed for a given validator.
   * @param validator - The validator to check.
   * @returns A promise that resolves with a boolean indicating if increment is needed.
   */
  private async needIncrement(validator: string): Promise<boolean> {
    console.log(`Checking if increment is needed for validator: ${validator}`);

    const delegatorState = await this.retryApiCall(() => this.api.query.parachainStaking.delegatorState(validator));

    const delegatorStateJson = delegatorState.toJSON();
    const owner = (delegatorStateJson as { [index: string]: AnyJson }).owner;
    console.log(`Owner for validator ${validator}: ${owner}`);

    const blockRewarded = await this.retryApiCall(() => this.api.query.parachainStaking.blocksRewarded(owner));
    console.log(`Blocks rewarded for owner ${owner}: ${blockRewarded}`);

    const blockAuthored = await this.retryApiCall(() => this.api.query.parachainStaking.blocksAuthored(owner));
    console.log(`Blocks authored for owner ${owner}: ${blockAuthored}`);

    return Number(blockAuthored) - Number(blockRewarded) > 0;
  }

  /**
   * Checks if claim is needed for a given validator.
   * @param validator - The validator to check.
   * @returns A promise that resolves with a boolean indicating if claim is needed.
   */
  private async needClaim(validator: string): Promise<boolean> {
    console.log(`Checking if claim is needed for validator: ${validator}`);

    const rewardsToClaim = await this.retryApiCall(() => this.api.query.parachainStaking.rewards(validator));

    return Number(rewardsToClaim) > 0;
  }

  /**
   * Claims the rewards for a given validator.
   * @param validator - The validator to claim rewards for.
   * @param sender - The sender of the transaction.
   * @returns A promise that resolves when the rewards have been claimed.
   */
  private async claimRewards(validator: string, sender: any): Promise<void> {
    const claimReward = this.api.tx.parachainStaking.claimRewards();
    const proxyclaimTransact = this.api.tx.proxy.proxy(validator, 'ParachainStaking' as 'Any', claimReward);
    await sendTransaction(proxyclaimTransact, sender, this.api);
  }
}
