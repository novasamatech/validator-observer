import { SubstrateConnection } from './connection/SubstrateConnection';
import { config } from './config/conf';
import { Sender } from './Sender';
import { PayoutHelper } from './PayoutHelper';

interface Connections {
    [network: string]: SubstrateConnection;
}

async function main(): Promise<void> {
    let connections: Connections = {}
    if (!config.payoutAccount) {
        throw new Error('Payout Account does not set, please provide PAYOUTS_ACCOUNT_MNEMONIC variable')
    }

    const sender = new Sender(config.payoutAccount)

    for (const network of config.networks) {
        // Create connection
        const connection = new SubstrateConnection(network.endpoint);
        await connection.connect();
        connections[network.name] = connection
        console.log(`Connected to ${network.name} network`);

        // Payout rewards
        const payout = new PayoutHelper(connections[network.name])
        await payout.payoutRewards(network.validators, sender.generateKeyringPair(), false)

        // Close connection
        await connection.disconnect();
    }
}

main().catch((err) => console.error(err));
