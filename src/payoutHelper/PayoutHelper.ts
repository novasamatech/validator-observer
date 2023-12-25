import { ApiPromise } from '@polkadot/api';
import { SubstrateConnection } from '../connection';


export abstract class PayoutHelper {
    protected api: ApiPromise;

    constructor(connection: SubstrateConnection) {
        this.api = connection.getApi();
    }

    abstract payoutRewards(validators: string[], sender, depth: boolean): Promise<void>;

    async retryApiCall<T>(apiCall: () => Promise<T>, maxRetries: number = 3, retry_timeout: number = 2000): Promise<T> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await apiCall();
            } catch (error) {
                console.error(`Attempt ${i+1} failed with error: ${error}`);
                await this.api.connect();
                await new Promise(resolve => setTimeout(resolve, retry_timeout));
                if (i === maxRetries - 1) {
                    throw new Error(`Failed after ${maxRetries} attempts: ${error}`);
                }
            }
        }
        throw new Error('All retries failed');
    }
}
