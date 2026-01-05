import { ApiPromise, WsProvider } from '@polkadot/api';

export class SubstrateConnection {
  private api!: ApiPromise;

  constructor(endpoint: string) {
    this.initialize(endpoint);
  }

  private async initialize(endpoint: string): Promise<void> {
    const provider = new WsProvider(endpoint);
    this.api = new ApiPromise({ provider: provider });
  }

  async connect(): Promise<void> {
    await this.api.isReady;
    console.log(`Connected to ${(await this.api.rpc.system.chain()).toHuman()} node`);
  }

  getApi(): ApiPromise {
    return this.api;
  }

  async disconnect(): Promise<void> {
    await this.api.disconnect();
  }
}
