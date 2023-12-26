export type NetworkConfig = {
    name: string;
    endpoint: string;
    validators: string[];
    votersAccounts: string[];
    voteAmount: number;
};

export type Config = {
    networks: NetworkConfig[];
    payoutAccount: string | undefined;
};

export const config: Config = {
    networks: [
        {
            name: 'Kusama',
            endpoint: 'wss://kusama-rpc.polkadot.io',
            validators: [
                'DhK6qU2U5kDWeJKvPRtmnWRs8ETUGZ9S9QmNmQFuzrNoKm4',
                'EtETk1FbrDg7FoAfkREuXT7xHxCjbEf28sBvWf6zfB5wFyV'
            ],
            votersAccounts: [
                'Day71GSJAxUUiFic8bVaWoAczR3Ue3jNonBZthVHp2BKzyJ', // Day_7
                'DCZyhphXsRLcW84G9WmWEXtAA8DKGtVGSFZLJYty8Ajjyfa', // ChaosDao
            ],
            voteAmount: 110_000_000_000_000 // 110 KSM
        },
        {
            name: 'Polkadot',
            endpoint: 'wss://rpc.polkadot.io',
            validators: [
                '127zarPDhVzmCXVQ7Kfr1yyaa9wsMuJ74GJW9Q7ezHfQEgh6'
            ],
            votersAccounts: [
                '15cfSaBcTxNr8rV59cbhdMNCRagFr3GE6B3zZRsCp4QHHKPu', // Day_7
                '13EyMuuDHwtq5RD6w3psCJ9WvJFZzDDion6Fd2FVAqxz1g7K', // ChaosDao
            ],
            voteAmount: 50_000_000_000_000 // 5_000 DOT
        },
    ],
    payoutAccount: process.env.PAYOUTS_ACCOUNT_MNEMONIC
};
