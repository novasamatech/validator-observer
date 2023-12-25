import { sendTransaction } from "../../utils";
import { PayoutHelper } from "../PayoutHelper";

export class AstarPayoutHelper extends PayoutHelper {
    
    private eraIndex(era: number) {
        return this.api.createType('u32', era);
    }

    private astarRuntimeSmartContract(validatorAddress: string) {
        return this.api.createType('AstarRuntimeSmartContract', {'Evm': validatorAddress, 'Wasm': ''});
    }

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

    private async getCurrentEra(): Promise<string> {
        return (await this.retryApiCall(() => this.api.query.dappsStaking.currentEra())).toString()
    }

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

    private async processPayout(validatorAddress: string, rewardEras: Array<string>, sender: any) {
        const transactions: any = [];
        rewardEras = rewardEras.reverse();
    
        for (let i = 0; i < rewardEras.length; i += 10) {
            const batch = rewardEras.slice(i, i + 10).map(era => 
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
