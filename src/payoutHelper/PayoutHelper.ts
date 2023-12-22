import { ApiPromise } from '@polkadot/api';
import { SubstrateConnection } from '../connection';


export abstract class PayoutHelper {
    protected api: ApiPromise;

    constructor(connection: SubstrateConnection) {
        this.api = connection.getApi();
    }

    abstract payoutRewards(validators: string[], sender, depth: boolean): Promise<void>;
}
