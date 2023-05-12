type NetworkConfig = {
    name: string;
    endpoint: string;
    validators: string[];
};

type Config = {
    networks: NetworkConfig[];
    payoutAccount: string | undefined;
};

export const config: Config = {
    networks: [
        {
            name: 'Kusama',
            endpoint: 'wss://kusama-rpc.polkadot.io',
            validators: [
                '127zarPDhVzmCXVQ7Kfr1yyaa9wsMuJ74GJW9Q7ezHfQEgh6'
            ]
        },
        {
            name: 'Polkadot',
            endpoint: 'wss://rpc.polkadot.io',
            validators: [
                'DhK6qU2U5kDWeJKvPRtmnWRs8ETUGZ9S9QmNmQFuzrNoKm4'
            ]
        },
    ],
    payoutAccount: process.env.PAYOUTS_ACCOUNT_MNEMONIC
};
