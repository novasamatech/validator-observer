import { ApiPromise } from '@polkadot/api';
import { SubstrateConnection } from '../connection';

/**
 * Abstract class BumpHelper that provides a structure for handling bumps.
 */
export abstract class BumpHelper {
    protected api: ApiPromise;

    /**
     * Constructor for the BumpHelper class.
     * @param connection - The connection to the Substrate node.
     */
    constructor(connection: SubstrateConnection) {
        this.api = connection.getApi();
    }

    /**
     * Abstract method to bump members.
     * @param sender - The sender of the transaction.
     * @returns A promise that resolves when members are bumped.
     */
    public abstract bumpMembers(sender): Promise<void>;

    /**
     * Abstract method to bump salary cycle.
     * @param sender - The sender of the transaction.
     * @returns A promise that resolves when salary cycle is bumped.
     */
    public abstract bumpSalaryCycle(sender): Promise<void>;


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