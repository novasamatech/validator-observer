import { BaseNetworkConfig, RelaychainConfig, AstarConfig } from "../config/conf";
import { SubstrateConnection } from "../connection";
import { PayoutHelper } from "./PayoutHelper";
import { AstarPayoutHelper, RelychainPayoutHelper } from "./payouters";

/**
 * Function to get the appropriate PayoutHelper based on the network configuration.
 * @param config - The network configuration.
 * @param connection - The connection to the Substrate node.
 * @returns A PayoutHelper instance for the specified network.
 * @throws {Error} If the network is not supported.
 */
export function getPayoutHelper(config: BaseNetworkConfig, connection: SubstrateConnection): PayoutHelper {
    if (config instanceof RelaychainConfig) {
        return new RelychainPayoutHelper(connection);
    } else if (config instanceof AstarConfig) {
        return new AstarPayoutHelper(connection);
    } else {
        throw new Error(`Unsupported network: ${config.name}`);
    }
}
