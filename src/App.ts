import { SubstrateConnection } from './connection';
import { RelaychainConfig, config } from './config/conf';
import { Sender } from './utils';
import { getPayoutHelper } from './payoutHelper/PayoutFabric';
import { VoteHelper } from './voteHelper';
import { configManager } from './config/ConfigManager';
import { encodeAddress } from '@polkadot/util-crypto';
import { formatBalance } from '@polkadot/util';

interface Connections {
  [network: string]: SubstrateConnection;
}

async function main(): Promise<void> {
  const networkType = process.argv[2];

  let connections: Connections = {};
  if (!config.payoutAccount) {
    throw new Error('Payout Account does not set, please provide PAYOUTS_ACCOUNT_MNEMONIC variable');
  }

  const sender = new Sender(config.payoutAccount);

  const filteredNetworks = configManager(networkType, config);

  for (const network of filteredNetworks) {
    // Create connection
    const connection = new SubstrateConnection(network.endpoint);
    await connection.connect();
    connections[network.name] = connection;
    console.log(`Connected to ${network.name} network`);

    const api = connections[network.name].getApi();
    const keypair = sender.generateKeyringPair();
    const registry = api.registry as any;
    const ss58Prefix = registry.chainSS58 ?? Number(api.consts?.system?.ss58Prefix?.toString?.() ?? 42);
    const payoutAddress = encodeAddress(keypair.publicKey, ss58Prefix ?? 42);
    const accountInfo = (await api.query.system.account(payoutAddress)).toJSON() as {
      data?: { free?: string | number };
    };
    const freeBalance = accountInfo?.data?.free ?? '0';
    const chainDecimals = api.registry.chainDecimals?.[0] ?? 0;
    const chainToken = api.registry.chainTokens?.[0] ?? '';
    const balance = formatBalance(freeBalance, {
      decimals: chainDecimals,
      withSi: true,
      withUnit: chainToken,
    });
    console.log(`Payout account for ${network.name}: ${payoutAddress}`);
    console.log(`Payout account balance: ${balance}`);

    // Payout rewards
    const payout = getPayoutHelper(network, connections[network.name]);
    await payout.payoutRewards(network.validators, keypair, false);

    // OpenGov voting
    if (network instanceof RelaychainConfig) {
      const voter = new VoteHelper(connections[network.name]);
      await voter.checkVotes(network, keypair);
    }

    // Close connection
    await connection.disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
