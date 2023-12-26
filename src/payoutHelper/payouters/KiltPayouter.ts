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
            const incrementCollatorRewards = this.api.tx.parachainStaking.incrementCollatorRewards()
            const proxyIncrementTransact = this.api.tx.proxy.proxy(
                validator,
                'ParachainStaking',
                incrementCollatorRewards
            )
            await sendTransaction(proxyIncrementTransact, sender, this.api)
            const claimReward = this.api.tx.parachainStaking.claimRewards()
            const proxyclaimTransact = this.api.tx.proxy.proxy(
                validator,
                'ParachainStaking',
                claimReward,
            )
            await sendTransaction(proxyclaimTransact, sender, this.api)
        }
    }
}
