import { RelaychainConfig, AstarConfig, Config } from './conf'

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