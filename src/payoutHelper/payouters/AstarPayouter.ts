import { Validator } from "../../config/conf";
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
     * Creates an AstarPrimitivesDappStakingSmartContract type with the given validator address.
     * @param dappAddress - The validator address.
     * @returns The AstarPrimitivesDappStakingSmartContract type.
     */
    private astarRuntimeSmartContract(dappAddress: string) {
        return this.api.createType('AstarPrimitivesDappStakingSmartContract', {'Evm': dappAddress});
    }

    /**
     * Payouts rewards to the given validators.
     * @param validators - The validators to payout rewards to.
     * @param sender - The sender of the transaction.
     * @param depth - Whether to payout rewards for all eras or just the current era.
     * @returns A promise that resolves when the rewards have been paid out.
     */
    async payoutRewards(validators: Validator[], sender, depth: boolean = false): Promise<void> {
        for (const validator of validators) {
            const dappAddress = await this.getDAPPAddress(validator.address)
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
        const dappAccounts = await this.retryApiCall(() => 
            this.api.query.dappStaking.integratedDApps.entries()
        );
        for (const [key, value] of dappAccounts) {
            const onchainValidatorAddress = value.toJSON();
            if (typeof onchainValidatorAddress === 'object' && onchainValidatorAddress !== null && 'owner' in onchainValidatorAddress && onchainValidatorAddress.owner === validatorAddress) {
                const serializedData = key.toHuman();
                if (serializedData && typeof serializedData[0] === 'object' && serializedData[0] !== null && 'Evm' in serializedData[0]) {
                    return serializedData[0].Evm?.toString();
                }
            }
        }
        throw new Error('Unexpected data type');
    }

    /**
     * Gets the current era.
     * @returns A promise that resolves with the current era.
     */
    private async getCurrentEra(): Promise<string> {
        const eraInfo = await this.retryApiCall(() => this.api.query.dappStaking.currentEraInfo());
        const eraInfoJson = eraInfo.toJSON() as { currentStakeAmount?: { era?: string } };

        if (eraInfoJson.currentStakeAmount && eraInfoJson.currentStakeAmount.era) {
            return eraInfoJson.currentStakeAmount.era.toString();
        } else {
            throw new Error('Invalid era information');
        }
    }

    /**
     * Gets the eras to reward for the given validator address and current era.
     * @param dappAddress - The validator address.
     * @param currentEra - The current era.
     * @returns A promise that resolves with an array of eras to reward.
     */
    private async getErasToReward(dappAddress: string, currentEra: string): Promise<Array<string>> {
        const rewardEras: Array<string> = [];
        const dappInfo = await this.api.query.dappStaking.integratedDApps({ Evm: dappAddress })
        const ourDappId = (dappInfo as any).unwrap().id.toNumber()
        
        const rewardsByEra = await this.api.query.dappStaking.dAppTiers.entries()
        
        console.log("Dapp eras to claim:")
        rewardsByEra.forEach(([era, tierRewards]) => {
        if ((tierRewards as any).isNone) return
            
            const tierDapps = (tierRewards as any).unwrap().dapps
            const dapps: Array<{dappId: number, tierId: number}> = [];
                tierDapps.forEach((value: any, key: any) =>
                dapps.push({
                    dappId: key.toNumber(),
                    tierId: value.toNumber(),
                })
                );
            
            const ourUnclaimedTier = dapps.find(({dappId, tierId}) => dappId == ourDappId)
            if (ourUnclaimedTier != undefined) {
                rewardEras.push((era.toHuman() as string)[0])
                console.log(`${era.toHuman()}`)
            }
        })
    
        return rewardEras;
    }

    /**
     * Processes the payout for the given validator address and reward eras.
     * @param dappAddress - The validator address.
     * @param rewardEras - The reward eras.
     * @param sender - The sender of the transaction.
     * @param batch_size - The size of the batch of transactions to send.
     * @returns A promise that resolves when the payout has been processed.
     */
    private async processPayout(dappAddress: string, rewardEras: Array<string>, sender: any, batch_size: number = 20) {
        const transactions: any = [];
        console.log(sender.address.toString())
        rewardEras = rewardEras.reverse();
    
        for (let i = 0; i < rewardEras.length; i += batch_size) {
            const batch = rewardEras.slice(i, i + batch_size).map(era => 
                this.api.tx.dappStaking.claimDappReward(
                    this.astarRuntimeSmartContract(dappAddress),
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
