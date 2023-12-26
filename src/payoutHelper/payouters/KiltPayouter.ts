import { sendTransaction } from "../../utils";
import { PayoutHelper } from "../PayoutHelper";

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
    async payoutRewards(validators: string[], sender, depth: boolean = false): Promise<void> {
        for (const validator of validators) {
            await this.incrementCollatorRewards(validator, sender);
            await this.claimRewards(validator, sender);
        }
    }

    /**
     * Increments the rewards for a given validator.
     * @param validator - The validator to increment rewards for.
     * @param sender - The sender of the transaction.
     * @returns A promise that resolves when the rewards have been incremented.
     */
    private async incrementCollatorRewards(validator: string, sender: any): Promise<void> {
        const incrementCollatorRewards = this.api.tx.parachainStaking.incrementCollatorRewards();
        const proxyIncrementTransact = this.api.tx.proxy.proxy(
            validator,
            'ParachainStaking',
            incrementCollatorRewards
        );
        await sendTransaction(proxyIncrementTransact, sender, this.api);
    }

    /**
     * Claims the rewards for a given validator.
     * @param validator - The validator to claim rewards for.
     * @param sender - The sender of the transaction.
     * @returns A promise that resolves when the rewards have been claimed.
     */
    private async claimRewards(validator: string, sender: any): Promise<void> {
        const claimReward = this.api.tx.parachainStaking.claimRewards();
        const proxyclaimTransact = this.api.tx.proxy.proxy(
            validator,
            'ParachainStaking',
            claimReward,
        );
        await sendTransaction(proxyclaimTransact, sender, this.api);
    }
}
