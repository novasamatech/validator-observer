import { ApiPromise } from '@polkadot/api';
import { SubstrateConnection } from '../connection';
import { Validator } from '../config/conf';

/**
 * Abstract class PayoutHelper that provides a structure for handling payouts.
 */
export abstract class PayoutHelper {
    protected api: ApiPromise;

    /**
     * Constructor for the PayoutHelper class.
     * @param connection - The connection to the Substrate node.
     */
    constructor(connection: SubstrateConnection) {
        this.api = connection.getApi();
    }

    /**
     * Abstract method to payout rewards for the given validators.
     * @param validators - The validators to payout rewards for.
     * @param sender - The sender of the transaction.
     * @param depth - Whether to check the history for unclaimed rewards.
     * @returns A promise that resolves when the rewards have been paid out.
     */
    public abstract payoutRewards(validators: Validator[], sender, depth: boolean): Promise<void>;

    /**
     * Method to retry API calls in case of failure.
     * @param apiCall - The API call to retry.
     * @param maxRetries - The maximum number of retries.
     * @param retry_timeout - The timeout between retries.
     * @returns A promise that resolves with the result of the API call.
     */
    public async retryApiCall<T>(apiCall: () => Promise<T>, maxRetries: number = 3, retry_timeout: number = 2000): Promise<T> {
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
