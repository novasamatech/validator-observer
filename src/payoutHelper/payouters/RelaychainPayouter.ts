import { SubmittableExtrinsic } from "@polkadot/api/types";
import { Validator } from "../../config/conf";
import { sendTransaction } from "../../utils";
import { PayoutHelper } from "../PayoutHelper";

/**
 * RelychainPayoutHelper is a class that extends PayoutHelper and provides methods to handle payouts on the Relychain network.
 */
export class RelychainPayoutHelper extends PayoutHelper {

    /**
     * Payout rewards for the given validators.
     * @param validators - The validators to payout rewards for.
     * @param sender - The sender of the transaction.
     * @param depth - Whether to check the history for unclaimed rewards.
     * @returns A promise that resolves when the rewards have been paid out.
     */
    async payoutRewards(validators: Validator[], sender, depth: boolean = false): Promise<void> {
        if (this.api.query.staking.erasStakersOverview) {
            await this.newPayoutRewards(validators, sender, depth);
        } else {
            for (const validator of validators) {
                const unclaimedPayouts = await this.checkPayouts(validator.address, depth);
                for (const payout of unclaimedPayouts) {
                    await this.payout(validator.address, payout, sender);
                }
            }
        }
    }

    /**
     * New method to handle payouts if eraStakersOverview exists.
     * @param validators - The validators to payout rewards for.
     * @param sender - The sender of the transaction.
     * @param depth - Whether to check the history for unclaimed rewards.
     */
    async newPayoutRewards(validators: Validator[], sender, depth: boolean): Promise<void> {
        const currentEra = await this.getCurrentEraNumber();
        const historyDepth = this.getHistoryDepth();
        const startEra = Math.max(currentEra - historyDepth, 0);
        const transactions: Array<SubmittableExtrinsic<any, any>> = [];
    
        for (let era = startEra; era < currentEra; era++) {
            for (const validator of validators) {
                const eraStakersOverview = (await this.api.query.staking.erasStakersOverview(era, validator.address)).toJSON() || {};
                if (Object.keys(eraStakersOverview).length === 0) continue; // Skip if erasStakersOverview is empty

                const claimedPages = (await this.api.query.staking.claimedRewards(era, validator.address)).toJSON();
                // @ts-ignore
                if (claimedPages!.length == 0) {
                    const transaction = this.api.tx.staking.payoutStakers(validator.address, era);
                    transactions.push(transaction);
                }
            }
        }
    
        const batchSize = 4;
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batchTransactions = transactions.slice(i, i + batchSize);
            const batchTransaction = this.api.tx.utility.batch(batchTransactions);
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
        const depth = this.api.consts.staking.historyDepth.toString();
        return Number(depth);
    }

    /**
     * Payout the rewards for a given validator and era.
     * @param validatorAddress - The address of the validator.
     * @param era - The era to payout rewards for.
     * @param sender - The sender of the transaction.
     * @returns A promise that resolves when the rewards have been paid out.
     */
    private async payout(validatorAddress: string, era: number, sender): Promise<void> {
        const transaction = this.api.tx.staking.payoutStakers(validatorAddress, era);
        await sendTransaction(transaction, sender, this.api);
    }

    /**
     * Check for unclaimed payouts for a given validator.
     * @param validatorAddress - The address of the validator.
     * @param depth - Whether to check the history for unclaimed rewards.
     * @returns A promise that resolves with an array of unclaimed payout eras.
     */
    private async checkPayouts(validatorAddress: string, depth): Promise<number[]> {

        // @ts-ignore
        const currentEra = (await this.api.query.staking.activeEra()).unwrapOr(null);
        const lastReward = await this.getLastReward(validatorAddress, depth);
        const numOfPotentialUnclaimedPayouts = currentEra.index - lastReward - 1;
        const unclaimedPayouts: number[] = [];

        for (let i = 1; i <= numOfPotentialUnclaimedPayouts; i++) {
            const idx = lastReward + i;
            const exposure = (await this.api.query.staking.erasStakers(idx, validatorAddress)).toJSON();
            if (Number(exposure!['total']) > 0) {
                unclaimedPayouts.push(idx);
            }
        }
        return unclaimedPayouts;
    }

    /**
     * Get the last reward era for a given validator.
     * @param validatorAddress - The address of the validator.
     * @param isHistoryCheckForced - Whether to force a check of the history for unclaimed rewards.
     * @returns A promise that resolves with the era of the last reward.
     */
    private async getLastReward(validatorAddress: string, isHistoryCheckForced = false): Promise<number> {
        const ledger = (await this.api.derive.staking.account(validatorAddress)).stakingLedger;
        let lastReward: number;
        const rewards = ledger.claimedRewards || ledger.legacyClaimedRewards; // Workaround for the Kusama upgrade
        // TODO: Remove the workaround and check the logic for reward payout

        if (isHistoryCheckForced || rewards.length == 0) {
            // @ts-ignore
            lastReward = this.api.consts.staking.historyDepth.toNumber();
        } else {
            lastReward = rewards.pop().toNumber();
        }
        return lastReward;
    }
}
