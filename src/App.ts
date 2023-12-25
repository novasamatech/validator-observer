import { SubstrateConnection } from './connection';
import { RelaychainConfig, config } from './config/conf';
import { Sender } from './utils';
import { getPayoutHelper } from './payoutHelper/PayoutFabric';
import { VoteHelper } from './voteHelper';
import { configManager } from './config/ConfigManager';

interface Connections {
    [network: string]: SubstrateConnection;
}

async function main(): Promise<void> {
    const networkType = process.argv[2];

    let connections: Connections = {}
    if (!config.payoutAccount) {
        throw new Error('Payout Account does not set, please provide PAYOUTS_ACCOUNT_MNEMONIC variable')
    }

    const sender = new Sender(config.payoutAccount)

    const filteredNetworks = configManager(networkType, config)

    for (const network of filteredNetworks) {
        // Create connection
        const connection = new SubstrateConnection(network.endpoint);
        await connection.connect();
        connections[network.name] = connection
        console.log(`Connected to ${network.name} network`);

        // Payout rewards
        const payout = getPayoutHelper(network, connections[network.name]);
        await payout.payoutRewards(network.validators, sender.generateKeyringPair(), false)

        // OpenGov voting
        if (network instanceof RelaychainConfig) {
            const voter = new VoteHelper(connections[network.name]);
            await voter.checkVotes(network, sender.generateKeyringPair())
        }

        // Close connection
        await connection.disconnect();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
