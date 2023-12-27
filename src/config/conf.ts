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
 * Class for Relaychain network configuration.
 */
export class RelaychainConfig extends BaseNetworkConfig {
    validators: string[];
    votersAccounts: string[];
    voteAmount: number;

    /**
     * @param {string} name - The name of the network.
     * @param {string} endpoint - The endpoint of the network.
     * @param {string[]} validators - The validators of the network.
     * @param {string[]} votersAccounts - The voters accounts of the network.
     * @param {number} voteAmount - The vote amount of the network.
     */
    constructor(name: string, endpoint: string, validators: string[], votersAccounts: string[], voteAmount: number) {
        super(name, endpoint);
        this.validators = validators;
        this.votersAccounts = votersAccounts;
        this.voteAmount = voteAmount;
    }
}

/**
 * Class for Astar network configuration.
 */
export class AstarConfig extends BaseNetworkConfig {
    validators: string[];

    /**
     * @param {string} name - The name of the network.
     * @param {string} endpoint - The endpoint of the network.
     * @param {string[]} validators - The validators of the network.
     */
    constructor(name: string, endpoint: string, validators: string[]) {
        super(name, endpoint);
        this.validators = validators;
    }
}

/**
 * Class for Kilt network configuration.
 */
export class KiltConfig extends BaseNetworkConfig {
    validators: string[];

    /**
     * @param {string} name - The name of the network.
     * @param {string} endpoint - The endpoint of the network.
     * @param {string[]} validators - The validators of the network.
     */
    constructor(name: string, endpoint: string, validators: string[]) {
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
        'wss://kusama-rpc.polkadot.io',
        ['DhK6qU2U5kDWeJKvPRtmnWRs8ETUGZ9S9QmNmQFuzrNoKm4'],
        ['Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ', 'DCZyhphXsRLcW84G9WmWEXtAA8DKGtVGSFZLJYty8Ajjyfa'],
        110_000_000_000_000
    ),
    new RelaychainConfig(
        'Polkadot',
        'wss://rpc.polkadot.io',
        ['127zarPDhVzmCXVQ7Kfr1yyaa9wsMuJ74GJW9Q7ezHfQEgh6'],
        ['15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu', '13EyMuuDHwtq5RD6w3psCJ9WvJFZzDDion6Fd2FVAqxz1g7K'],
        50_000_000_000_000
    ),
    new AstarConfig(
        'Astar',
        'wss://astar.api.onfinality.io/ws?apikey=8422f83b-f495-4e4b-b3f5-1d1c88a3f940',
        ['X4Hsp6EcxNPypWidz4xuVJhoafLdpShzy5ADpLAJZdqeKwz']
    ),
    new KiltConfig(
        'Kilt',
        'wss://kilt-rpc.dwellir.com',
        ['4sPMk6DgLbaYHaDKWpwFJQVBv3GupqHJRFWngHeALUrv37x9']
    )
], process.env.PAYOUTS_ACCOUNT_MNEMONIC);