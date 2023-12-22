import { BaseNetworkConfig, RelaychainConfig, AstarConfig } from "../config/conf";
import { SubstrateConnection } from "../connection";
import { PayoutHelper } from "./PayoutHelper";
import { AstarPayoutHelper, RelychainPayoutHelper } from "./payouters";

export function getPayoutHelper(config: BaseNetworkConfig, connection: SubstrateConnection): PayoutHelper {
    if (config instanceof RelaychainConfig) {
        return new RelychainPayoutHelper(connection);
    } else if (config instanceof AstarConfig) {
        return new AstarPayoutHelper(connection);
    } else {
        throw new Error(`Unsupported network: ${config.name}`);
    }
}
