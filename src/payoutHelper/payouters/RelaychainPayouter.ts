import { Validator } from "../../config/conf";
import { sendTransaction } from "../../utils";
import { PayoutHelper } from "../PayoutHelper";
import { NewRelaychainPayoutLogic } from "./NewRelaychainPayoutLogic";
import { SubstrateConnection } from "../../connection";

/**
 * RelychainPayoutHelper is a class that extends PayoutHelper and provides methods to handle payouts on the Relychain network.
 */
export class RelychainPayoutHelper extends PayoutHelper {
    private newPayoutLogic: NewRelaychainPayoutLogic;

    constructor(api: SubstrateConnection) {
        super(api);
        this.newPayoutLogic = new NewRelaychainPayoutLogic(api);
    }
    /**
     * Payout rewards for the given validators.
     * @param validators - The validators to payout rewards for.
     * @param sender - The sender of the transaction.
     * @param depth - Whether to check the history for unclaimed rewards.
     * @returns A promise that resolves when the rewards have been paid out.
     */
    async payoutRewards(validators: Validator[], sender, depth: boolean = false): Promise<void> {
        if (this.api.query.staking.erasStakersOverview) {
            await this.newPayoutLogic.payoutRewards(validators, sender, depth);
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
