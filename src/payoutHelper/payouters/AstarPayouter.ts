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
            console.log(dappAddress)
            const currentEra = await this.getCurrentEra()
            if (dappAddress){
                const erasToPayout = await this.grabErasToReward(dappAddress, currentEra)
                console.log(erasToPayout)
                await this.makePayout(dappAddress, erasToPayout, sender)
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

    private async grabErasToReward(validatorAddress: string, currentEra: string): Promise<Array<string>> {
        const returnArray: Array<string> = [];
        // Decrease current era in order to not call for the current era
        let era = Number(currentEra) - 1;
    
        while (era >= 0) {
            const contractEraStake = await this.retryApiCall(() => 
                this.api.query.dappsStaking.contractEraStake(
                    this.astarRuntimeSmartContract(validatorAddress),
                    this.eraIndex(era)
                )
            );
            const data = contractEraStake.toJSON();
    
            if (typeof data === 'object' && data !== null && 'contractRewardClaimed' in data) {
                if (data.contractRewardClaimed === false) {
                    returnArray.push(era.toString());
                } else {
                    console.log(`Found era with paid out rewards: ${era}`)
                    break;
                }
            }
            era--;
        }
    
        return returnArray;
    }

    private async makePayout(validatorAddress: string, reward_eras: Array<string>, sender: any) {
        const transactions: any = [];
        
        // Reverse the order of reward_eras
        reward_eras = reward_eras.reverse();
    
        for (let i = 0; i < reward_eras.length; i += 10) {
            const batch = reward_eras.slice(i, i + 10).map(era => 
                this.api.tx.dappsStaking.claimDapp(
                    this.astarRuntimeSmartContract(validatorAddress),
                    this.eraIndex(Number(era))
                )
            )
            transactions.push(this.api.tx.utility.batch(batch));
        }
    
        for (const transaction of transactions) {
            console.log(sender.address)
            await sendTransaction(transaction, sender, this.api);
        }
    }
}
