/**
 * Base class for network configuration.
 */
export class BaseNetworkConfig {
  name: string;
  endpoints: string[];

  /**
   * @param {string} name - The name of the network.
   * @param {string[]} endpoints - The endpoints of the network in failover priority order.
   */
  constructor(name: string, endpoints: string[]) {
    this.name = name;
    this.endpoints = endpoints;
  }
}

/**
 * Type for Validator configuration.
 */
export type Validator = {
  address: string;
  votersAccounts: string[];
  voteAmount: number;
  voteEnabled: boolean;
  identity?: string;
};

/**
 * Class for Relaychain network configuration.
 */
export class RelaychainConfig extends BaseNetworkConfig {
  validators: Validator[];

  /**
   * @param {string} name - The name of the network.
   * @param {string[]} endpoints - The endpoints of the network in failover priority order.
   * @param {Validator[]} validators - The validators of the network.
   */
  constructor(name: string, endpoints: string[], validators: Validator[]) {
    super(name, endpoints);
    this.validators = validators;
  }
}

/**
 * Class for Astar network configuration.
 */
export class AstarConfig extends BaseNetworkConfig {
  validators: Validator[];

  /**
   * @param {string} name - The name of the network.
   * @param {string[]} endpoints - The endpoints of the network in failover priority order.
   * @param {Validator[]} validators - The validators of the network.
   */
  constructor(name: string, endpoints: string[], validators: Validator[]) {
    super(name, endpoints);
    this.validators = validators;
  }
}

/**
 * Class for Kilt network configuration.
 */
export class KiltConfig extends BaseNetworkConfig {
  validators: Validator[];

  /**
   * @param {string} name - The name of the network.
   * @param {string[]} endpoints - The endpoints of the network in failover priority order.
   * @param {Validator[]} validators - The validators of the network.
   */
  constructor(name: string, endpoints: string[], validators: Validator[]) {
    super(name, endpoints);
    this.validators = validators;
  }
}

/**
 * Type for Network configuration.
 */
export type NetworkConfig = RelaychainConfig | AstarConfig;

/**
 * Class for the main configuration.
 */
export class Config {
  networks: NetworkConfig[];
  payoutAccount: string | undefined;

  /**
   * @param {NetworkConfig[]} networks - The networks of the configuration.
   * @param {string | undefined} payoutAccount - The payout account of the configuration.
   */
  constructor(networks: NetworkConfig[], payoutAccount: string | undefined) {
    this.networks = networks;
    this.payoutAccount = payoutAccount;
  }
}

/**
 * The main configuration object.
 */
export const config = new Config(
  [
    // Node lists are taken from nova-utils (chains/v22/chains.json).
    new RelaychainConfig(
      'Kusama Asset Hub',
      [
        'wss://asset-hub-kusama-rpc.n.dwellir.com',
        'wss://rpc-asset-hub-kusama.luckyfriday.io',
        'wss://kusama-asset-hub-rpc.polkadot.io',
        'wss://asset-hub-kusama.rotko.net',
      ],
      [
        {
          address: 'DhK6qU2U5kDWeJKvPRtmnWRs8ETUGZ9S9QmNmQFuzrNoKm4',
          votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
          voteAmount: 110_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Clausius',
        },
        {
          address: 'EtETk1FbrDg7FoAfkREuXT7xHxCjbEf28sBvWf6zfB5wFyV',
          votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
          voteAmount: 10_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Einstein',
        },
        {
          address: 'HYqFHkWAXTdYKYRU49VurZ5YnuT58gX7sVdL9weWi7XeczQ',
          votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
          voteAmount: 10_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Hawking',
        },
        {
          address: 'HuehfUJoctKux1gmMaN2d62SMSZEA3cjKfX2zmJkJEaRxwo',
          votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
          voteAmount: 10_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Kolmogorov',
        },
        {
          address: 'Gb7iC1jnAJtSaNDoyvmr6aqbcthfhVMocCWiszbQynS6BDi',
          votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
          voteAmount: 10_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Darwin',
        },
        {
          address: 'D991k2qmiWrVZzkehGP2QYSLdGH3s2gBvHZzpxQrzX4KSvn',
          votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
          voteAmount: 10_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Newton',
        },
        {
          address: 'FcGa3ubu75NT62hDxHEgHyehmgXB26rXHz2ig7HuVe7beVn',
          votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
          voteAmount: 10_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Knuth',
        },
        {
          address: 'FzzhonMmAyy3GdmgMewwD66mdtc9oAJ4DSrT3bocw3fBgdw',
          votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
          voteAmount: 10_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Gauss',
        },
      ],
    ),
    new RelaychainConfig(
      'Polkadot Asset Hub',
      [
        'wss://asset-hub-polkadot-rpc.n.dwellir.com',
        'wss://asset-hub-polkadot.rotko.net',
        'wss://polkadot-asset-hub-rpc.polkadot.io',
        'wss://rpc-asset-hub-polkadot.stakeworld.io',
        'wss://rpc-asset-hub-polkadot.luckyfriday.io',
      ],
      [
        {
          address: '127zarPDhVzmCXVQ7Kfr1yyaa9wsMuJ74GJW9Q7ezHfQEgh6',
          votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
          voteAmount: 50_000_000_000_000,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Nash',
        },
        {
          address: '13JuwkvSqGUDo8zErgfC9ivGfKfcdDyceFkvh9NW4wz7NbuF',
          votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
          voteAmount: 1,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Shannon',
        },
        {
          address: '15yWjJfhPwiBECjVezPTA42EFpcrxmRUjzPN6nf3azvZ5wDX',
          votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
          voteAmount: 1,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Dijkstra',
        },
        {
          address: '151oCCvw1aZS8TZHzvAj6J3zJec7ZLEKRj6FVWhzVGbTXTG1',
          votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
          voteAmount: 1,
          voteEnabled: false,
          identity: '🌌Novasama🌌/Turing',
        },
        {
          address: '15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu',
          votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
          voteAmount: 1,
          voteEnabled: false,
          identity: '🌌Novasama🌌/✨👍✨ Day7 ✨👍✨',
        },
        {
          address: '16LLBgPW338sbqCkxHpKGpZB9P9y7nnaMSZFodUhpb3bs1H3',
          votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
          voteAmount: 1,
          voteEnabled: false,
          identity: '🌌Novasama🌌/von Neumann',
        },
      ],
    ),
    new AstarConfig(
      'Astar',
      ['wss://astar.api.onfinality.io/ws?apikey=8422f83b-f495-4e4b-b3f5-1d1c88a3f940'],
      [
        {
          address: 'X4Hsp6EcxNPypWidz4xuVJhoafLdpShzy5ADpLAJZdqeKwz',
          votersAccounts: [],
          voteAmount: 0,
          voteEnabled: false,
        },
      ],
    ),
    new KiltConfig(
      'Kilt',
      ['wss://spiritnet.kilt.io'],
      [
        {
          address: '4sPMk6DgLbaYHaDKWpwFJQVBv3GupqHJRFWngHeALUrv37x9',
          votersAccounts: [],
          voteAmount: 0,
          voteEnabled: false,
        },
      ],
    ),
  ],
  process.env.PAYOUTS_ACCOUNT_MNEMONIC,
);
