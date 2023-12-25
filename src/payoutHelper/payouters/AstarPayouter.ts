import { sendTransaction } from "../../utils";
import { PayoutHelper } from "../PayoutHelper";

/**
 * AstarPayoutHelper is a class that extends PayoutHelper and provides methods to handle payouts on the Astar network.
 */
export class AstarPayoutHelper extends PayoutHelper {
    
    /**
     * Converts an era number to a u32 type.
     * @param era - The era number.
     * @returns The era number as a u32 type.
     */
    private eraIndex(era: number) {
        return this.api.createType('u32', era);
    }

    /**
     * Creates an AstarRuntimeSmartContract type with the given validator address.
     * @param validatorAddress - The validator address.
     * @returns The AstarRuntimeSmartContract type.
     */
    private astarRuntimeSmartContract(validatorAddress: string) {
        return this.api.createType('AstarRuntimeSmartContract', {'Evm': validatorAddress, 'Wasm': ''});
    }

    /**
     * Payouts rewards to the given validators.
     * @param validators - The validators to payout rewards to.
     * @param sender - The sender of the transaction.
     * @param depth - Whether to payout rewards for all eras or just the current era.
     * @returns A promise that resolves when the rewards have been paid out.
     */
    async payoutRewards(validators: string[], sender, depth: boolean = false): Promise<void> {
        for (const validator of validators) {
            const dappAddress = await this.getDAPPAddress(validator)
            const currentEra = await this.getCurrentEra()
            if (dappAddress){
                const erasToPayout = await this.getErasToReward(dappAddress, currentEra)
                await this.processPayout(dappAddress, erasToPayout, sender)
            }
        }
    }

    /**
     * Gets the DAPP address for the given validator address.
     * @param validatorAddress - The validator address.
     * @returns A promise that resolves with the DAPP address or undefined if it doesn't exist.
     */
    private async getDAPPAddress(validatorAddress: string): Promise<string | undefined> {
        const dappAccount = await this.retryApiCall(() => 
            this.api.query.dappsStaking.registeredDevelopers(validatorAddress)
        );
        const data = dappAccount.toJSON();
        if (typeof data === 'object' && data !== null && 'evm' in data) {
            return data.evm?.toString();
        }
        throw new Error('Unexpected data type');
    }

    /**
     * Gets the current era.
     * @returns A promise that resolves with the current era.
     */
    private async getCurrentEra(): Promise<string> {
        return (await this.retryApiCall(() => this.api.query.dappsStaking.currentEra())).toString()
    }

    /**
     * Gets the eras to reward for the given validator address and current era.
     * @param validatorAddress - The validator address.
     * @param currentEra - The current era.
     * @returns A promise that resolves with an array of eras to reward.
     */
    private async getErasToReward(validatorAddress: string, currentEra: string): Promise<Array<string>> {
        const rewardEras: Array<string> = [];
        let era = Number(currentEra) - 1; // in order to not get from currentEra
    
        for (; era >= 0; era--) {
            const contractEraStake = await this.retryApiCall(() => 
                this.api.query.dappsStaking.contractEraStake(
                    this.astarRuntimeSmartContract(validatorAddress),
                    this.eraIndex(era)
                )
            );
            const data = contractEraStake.toJSON();
    
            if (typeof data === 'object' && data !== null && 'contractRewardClaimed' in data) {
                if (data.contractRewardClaimed === false) {
                    rewardEras.push(era.toString());
                } else if (data.contractRewardClaimed === true) {
                    break;
                }
            }
        }
    
        return rewardEras;
    }

    /**
     * Processes the payout for the given validator address and reward eras.
     * @param validatorAddress - The validator address.
     * @param rewardEras - The reward eras.
     * @param sender - The sender of the transaction.
     * @param batch_size - The size of the batch of transactions to send.
     * @returns A promise that resolves when the payout has been processed.
     */
    private async processPayout(validatorAddress: string, rewardEras: Array<string>, sender: any, batch_size: number = 20) {
        const transactions: any = [];
        rewardEras = rewardEras.reverse();
    
        for (let i = 0; i < rewardEras.length; i += batch_size) {
            const batch = rewardEras.slice(i, i + batch_size).map(era => 
                this.api.tx.dappsStaking.claimDapp(
                    this.astarRuntimeSmartContract(validatorAddress),
                    this.eraIndex(Number(era))
                )
            )
            transactions.push(this.api.tx.utility.batch(batch));
        }
    
        for (const transaction of transactions) {
            await sendTransaction(transaction, sender, this.api);
        }
    }
}
