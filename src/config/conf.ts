/**
 * Base class for network configuration.
 */
export class BaseNetworkConfig {
    name: string;
    endpoint: string;

    /**
     * @param {string} name - The name of the network.
     * @param {string} endpoint - The endpoint of the network.
     */
    constructor(name: string, endpoint: string) {
        this.name = name;
        this.endpoint = endpoint;
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
};

/**
 * Class for Relaychain network configuration.
 */
export class RelaychainConfig extends BaseNetworkConfig {
    validators: Validator[];

    /**
     * @param {string} name - The name of the network.
     * @param {string} endpoint - The endpoint of the network.
     * @param {Validator[]} validators - The validators of the network.
     */
    constructor(name: string, endpoint: string, validators: Validator[]) {
        super(name, endpoint);
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
     * @param {string} endpoint - The endpoint of the network.
     * @param {Validator[]} validators - The validators of the network.
     */
    constructor(name: string, endpoint: string, validators: Validator[]) {
        super(name, endpoint);
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
     * @param {string} endpoint - The endpoint of the network.
     * @param {string[]} validators - The validators of the network.
     */
    constructor(name: string, endpoint: string, validators: Validator[]) {
        super(name, endpoint);
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
export const config = new Config([
    new RelaychainConfig(
        'Kusama',
        'wss://rpc-kusama-1.novasama-tech.org',
        [
            {
                address: 'DhK6qU2U5kDWeJKvPRtmnWRs8ETUGZ9S9QmNmQFuzrNoKm4',
                votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
                voteAmount: 110_000_000_000_000,
                voteEnabled: true
            },
            {
                address: 'EtETk1FbrDg7FoAfkREuXT7xHxCjbEf28sBvWf6zfB5wFyV',
                votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
                voteAmount: 10_000_000_000_000,
                voteEnabled: true
            },
            {
                address: 'HYqFHkWAXTdYKYRU49VurZ5YnuT58gX7sVdL9weWi7XeczQ',
                votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
                voteAmount: 10_000_000_000_000,
                voteEnabled: false
            },
            {
                address: 'HuehfUJoctKux1gmMaN2d62SMSZEA3cjKfX2zmJkJEaRxwo',
                votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
                voteAmount: 10_000_000_000_000,
                voteEnabled: false
            },
            {
                address: 'Gb7iC1jnAJtSaNDoyvmr6aqbcthfhVMocCWiszbQynS6BDi',
                votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
                voteAmount: 10_000_000_000_000,
                voteEnabled: false
            },
            {
                address: 'D991k2qmiWrVZzkehGP2QYSLdGH3s2gBvHZzpxQrzX4KSvn',
                votersAccounts: ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ'],
                voteAmount: 10_000_000_000_000,
                voteEnabled: false
            }
        ]
    ),
    new RelaychainConfig(
        'Polkadot',
        'wss://rpc-polkadot-1.novasama-tech.org',
        [
            {
                address: '127zarPDhVzmCXVQ7Kfr1yyaa9wsMuJ74GJW9Q7ezHfQEgh6',
                votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
                voteAmount: 50_000_000_000_000,
                voteEnabled: true
            },
            {
                address: '13JuwkvSqGUDo8zErgfC9ivGfKfcdDyceFkvh9NW4wz7NbuF',
                votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
                voteAmount: 1,
                voteEnabled: false
            },
            {
                address: '15yWjJfhPwiBECjVezPTA42EFpcrxmRUjzPN6nf3azvZ5wDX',
                votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
                voteAmount: 1,
                voteEnabled: false
            },
            {
                address: '151oCCvw1aZS8TZHzvAj6J3zJec7ZLEKRj6FVWhzVGbTXTG1',
                votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
                voteAmount: 1,
                voteEnabled: false
            },
            {
                address: '15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu',
                votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
                voteAmount: 1,
                voteEnabled: false
            },
            {
                address: '16LLBgPW338sbqCkxHpKGpZB9P9y7nnaMSZFodUhpb3bs1H3',
                votersAccounts: ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu'],
                voteAmount: 1,
                voteEnabled: false
            }
        ]
    ),
    new AstarConfig(
        'Astar',
        'wss://astar.api.onfinality.io/ws?apikey=8422f83b-f495-4e4b-b3f5-1d1c88a3f940',
        [
            {
                address: 'X4Hsp6EcxNPypWidz4xuVJhoafLdpShzy5ADpLAJZdqeKwz',
                votersAccounts: [],
                voteAmount: 0,
                voteEnabled: false
            }
        ]
    ),
    new KiltConfig(
        'Kilt',
        'wss://kilt-rpc.dwellir.com',
        [
            {
                address: '4sPMk6DgLbaYHaDKWpwFJQVBv3GupqHJRFWngHeALUrv37x9',
                votersAccounts: [],
                voteAmount: 0,
                voteEnabled: false
            }
        ]
    )
], process.env.PAYOUTS_ACCOUNT_MNEMONIC);

