import { SubmittableExtrinsic } from '@polkadot/api/types';
import { Validator } from '../../config/conf';
import { sendTransaction } from '../../utils';
import { PayoutHelper } from '../PayoutHelper';

/***
 * New logic to handle payouts if erasStakersOverview exists.
 */
export class NewRelaychainPayoutLogic extends PayoutHelper {
  /**
   * New method to handle payouts if erasStakersOverview exists.
   * @param validators - The validators to payout rewards for.
   * @param sender - The sender of the transaction.
   * @param depth - Whether to check the history for unclaimed rewards.
   */
  async payoutRewards(validators: Validator[], sender, depth: boolean = false): Promise<void> {
    const activeEra = await this.getActiveEraNumber();
    const lastClaimableEra = Math.max(activeEra - 1, 0);
    const historyDepth = this.getHistoryDepth();
    const startEra = Math.max(lastClaimableEra - historyDepth, 0);
    const transactions: Array<SubmittableExtrinsic<any, any>> = [];

    const payoutPlan = await this.collectTransactionsForUnclaimedRewards(
      startEra,
      lastClaimableEra,
      validators,
      transactions,
    );
    this.logPayoutPlan(payoutPlan);
    await this.executeTransactionsInBatches(transactions, sender, 2);
  }

  /**
   * Collects transactions for unclaimed rewards for validators within a specified era range.
   * Exposure is paged (up to MaxExposurePageSize nominators per page) and every page has to be
   * claimed separately, so a transaction is added for each page that is not yet claimed.
   * @param startEra The starting era from which to collect unclaimed rewards.
   * @param lastClaimableEra The last era eligible for payout.
   * @param validators An array of validators for whom to check unclaimed rewards.
   * @param transactions An array to which the payout transactions will be added.
   * @returns Unclaimed pages per era for every validator.
   */
  private async collectTransactionsForUnclaimedRewards(
    startEra: number,
    lastClaimableEra: number,
    validators: Validator[],
    transactions: Array<SubmittableExtrinsic<any, any>>,
  ): Promise<Map<string, Map<number, number[]>>> {
    const payoutPlan = new Map<string, Map<number, number[]>>();

    for (const validator of validators) {
      payoutPlan.set(validator.address, new Map());
    }

    for (let era = startEra; era <= lastClaimableEra; era++) {
      for (const validator of validators) {
        const eraStakersOverview = await this.api.query.staking.erasStakersOverview(era, validator.address);
        if (eraStakersOverview.isNone) continue;

        const pageCount = eraStakersOverview.unwrap().pageCount.toNumber();
        const claimedPages = new Set(
          (await this.api.query.staking.claimedRewards(era, validator.address)).map(page => page.toNumber()),
        );

        const unclaimedPages: number[] = [];
        for (let page = 0; page < pageCount; page++) {
          if (claimedPages.has(page)) continue;
          unclaimedPages.push(page);
          transactions.push(this.api.tx.staking.payoutStakersByPage(validator.address, era, page));
        }

        if (unclaimedPages.length > 0) {
          payoutPlan.get(validator.address)!.set(era, unclaimedPages);
        }
      }
    }

    return payoutPlan;
  }

  private logPayoutPlan(payoutPlan: Map<string, Map<number, number[]>>): void {
    for (const [validator, eras] of payoutPlan) {
      if (eras.size === 0) {
        console.log(`Payout plan for validator ${validator}: no unclaimed eras`);
        continue;
      }
      const eraList = Array.from(eras, ([era, pages]) => `${era} (pages ${pages.join(', ')})`);
      console.log(`Payout plan for validator ${validator}: eras ${eraList.join('; ')}`);
    }
  }

  /**
   * Executes transactions in batches of a specified size.
   * @param transactions An array of transactions to be executed.
   * @param sender The sender of the transactions.
   * @param size The number of transactions to include in each batch. Defaults to 4.
   */
  private async executeTransactionsInBatches(
    transactions: Array<SubmittableExtrinsic<any, any>>,
    sender,
    size: number = 4,
  ): Promise<void> {
    for (let i = 0; i < transactions.length; i += size) {
      const batchTransactions = transactions.slice(i, i + size);
      const batchTransaction = this.api.tx.utility.forceBatch(batchTransactions);
      await sendTransaction(batchTransaction, sender, this.api);
    }
  }

  /**
   * Retrieves the current era number from the blockchain.
   * @returns {Promise<number>} The current era as a number.
   */
  private async getActiveEraNumber(): Promise<number> {
    const activeEra = await this.api.query.staking.activeEra();
    if (activeEra.isSome) {
      const value = activeEra.unwrapOrDefault();
      return value.index.toNumber() ?? 0;
    }

    const currentEra = await this.api.query.staking.currentEra();
    if (currentEra.isSome) {
      const value = currentEra.unwrapOrDefault();
      return value.toNumber() ?? 0;
    }

    return 0;
  }

  /**
   * Fetches the history depth value from the blockchain constants.
   * @returns {number} The history depth as a number.
   */
  private getHistoryDepth(): number {
    return this.api.consts.staking.historyDepth.toNumber();
  }
}
