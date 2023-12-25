import { RelaychainConfig, AstarConfig, Config } from './conf'

/**
 * Function to manage the configuration of the network.
 * @param {string} networkType - The type of the network.
 * @param {Config} config - The configuration object.
 * @returns {Array} - Returns an array of filtered networks based on the network type.
 * @throws {Error} - Throws an error if no networks are found for the given type.
 */
export function configManager(networkType: string, config: Config) {
    const filteredNetworks = config.networks.filter(network => 
        (networkType === 'Relaychain' && network instanceof RelaychainConfig) ||
        (networkType === 'Astar' && network instanceof AstarConfig)
    );

    if (filteredNetworks.length === 0) {
        throw new Error(`No networks found for type: ${networkType}`);
    }

    return filteredNetworks;
}