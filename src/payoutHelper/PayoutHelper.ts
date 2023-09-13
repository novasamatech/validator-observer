import { ApiPromise } from '@polkadot/api';
import { SubstrateConnection } from '../connection';
import { sendTransaction } from '../utils';


export class PayoutHelper {
    private api: ApiPromise;

    constructor(connection: SubstrateConnection) {
        this.api = connection.getApi();
    }

    async payoutRewards(validators: string[], sender, depth: boolean = false): Promise<void> {

        for (const validator of validators) {
            const unclaimedPayouts = await this.checkPayouts(validator, depth);

            for (const payout of unclaimedPayouts) {
                await this.payout(validator, payout, sender);
            }
        }
    }

    async payout(validatorAddress: string, era: number, sender): Promise<void> {

        const transaction = this.api.tx.staking.payoutStakers(validatorAddress, era)
        await sendTransaction(transaction, sender, this.api)
    }

    public async checkPayouts(validatorAddress: string, depth): Promise<number[]> {

        // @ts-ignore
        const currentEra = (await this.api.query.staking.activeEra()).unwrapOr(null);

        const lastReward = await this.getLastReward(validatorAddress, depth)

        const numOfPotentialUnclaimedPayouts = currentEra.index - lastReward - 1;
        const unclaimedPayouts: number[] = []
        for (let i = 1; i <= numOfPotentialUnclaimedPayouts; i++) {

            const idx = lastReward + i;
            const exposure = (await this.api.query.staking.erasStakers(idx, validatorAddress)).toJSON();
            if (Number(exposure!['total']) > 0) {
                unclaimedPayouts.push(idx)
            }
        }

        return unclaimedPayouts
    }

    private async getLastReward(validatorAddress: string, isHistoryCheckForced = false): Promise<number> {

        const ledger = (await this.api.derive.staking.account(validatorAddress)).stakingLedger

        let lastReward: number;
        if (isHistoryCheckForced || ledger.claimedRewards.length == 0) {
            // @ts-ignore
            lastReward = this.api.consts.staking.historyDepth.toNumber();
        } else {
            lastReward = ledger.claimedRewards.pop().toNumber();
        }

        return lastReward
    }

}
