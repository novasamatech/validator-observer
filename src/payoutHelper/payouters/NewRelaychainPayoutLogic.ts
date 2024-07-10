import { SubmittableExtrinsic } from "@polkadot/api/types";
import { Validator } from "../../config/conf";
import { sendTransaction } from "../../utils";
import { PayoutHelper } from "../PayoutHelper";

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
        const currentEra = await this.getCurrentEraNumber();
        const eraToReward = currentEra - 1
        const historyDepth = this.getHistoryDepth();
        const startEra = Math.max(eraToReward - historyDepth, 0);
        const transactions: Array<SubmittableExtrinsic<any, any>> = [];

        await this.collectTransactionsForUnclaimedRewards(startEra, currentEra, validators, transactions);
        await this.executeTransactionsInBatches(transactions, sender, 2);
    }

    /**
     * Collects transactions for unclaimed rewards for validators within a specified era range.
     * @param startEra The starting era from which to collect unclaimed rewards.
     * @param currentEra The current era up to which to check for unclaimed rewards.
     * @param validators An array of validators for whom to check unclaimed rewards.
     * @param transactions An array to which the payout transactions will be added.
     */
    private async collectTransactionsForUnclaimedRewards(startEra: number, currentEra: number, validators: Validator[], transactions: Array<SubmittableExtrinsic<any, any>>): Promise<void> {
        for (let era = startEra; era < currentEra; era++) {
            for (const validator of validators) {
                const eraStakersOverview = (await this.api.query.staking.erasStakersOverview(era, validator.address)).toJSON() || {};
                if (Object.keys(eraStakersOverview).length === 0) continue;

                const claimedPages = (await this.api.query.staking.claimedRewards(era, validator.address)).toJSON();
                // @ts-ignore
                if (!claimedPages || claimedPages.length === 0) {
                    const transaction = this.api.tx.staking.payoutStakers(validator.address, era);
                    transactions.push(transaction);
                }
            }
        }
    }

    /**
     * Executes transactions in batches of a specified size.
     * @param transactions An array of transactions to be executed.
     * @param sender The sender of the transactions.
     * @param size The number of transactions to include in each batch. Defaults to 4.
     */
    private async executeTransactionsInBatches(transactions: Array<SubmittableExtrinsic<any, any>>, sender, size: number = 4): Promise<void> {
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
    private async getCurrentEraNumber(): Promise<number> {
        const currentEra = await this.api.query.staking.currentEra();
        // @ts-ignore
        return currentEra.unwrap().toNumber();
    }

    /**
     * Fetches the history depth value from the blockchain constants.
     * @returns {number} The history depth as a number.
     */
    private getHistoryDepth(): number {
        return Number(this.api.consts.staking.historyDepth.toString());
    }
}
