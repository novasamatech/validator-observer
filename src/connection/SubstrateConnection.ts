import { ApiPromise, WsProvider } from '@polkadot/api';

const DEFAULT_CONNECT_TIMEOUT_MS = 60_000;

export class SubstrateConnection {
  private readonly api: ApiPromise;
  private readonly endpoints: string[];

  /**
   * @param endpoints - One or more WebSocket endpoints. WsProvider rotates through the list
   * on every failed connection attempt, so the order defines the failover priority.
   */
  constructor(endpoints: string | string[]) {
    this.endpoints = Array.isArray(endpoints) ? endpoints : [endpoints];
    this.api = new ApiPromise({ provider: new WsProvider(this.endpoints) });
  }

  /**
   * Waits until the API is ready.
   * Socket errors are only logged so that WsProvider can fail over to the next endpoint;
   * if no endpoint becomes ready within the timeout, a descriptive error is thrown.
   */
  async connect(timeoutMs: number = DEFAULT_CONNECT_TIMEOUT_MS): Promise<void> {
    // `isReadyOrError` rejects on the first socket error. Nobody awaits it, so without this
    // handler a dead endpoint kills the process with ERR_UNHANDLED_REJECTION before failover kicks in.
    this.api.isReadyOrError.catch(() => {});
    this.api.on('error', error => {
      console.warn(`Connection error: ${describeError(error)}`);
    });

    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Failed to connect to any of [${this.endpoints.join(', ')}] within ${timeoutMs} ms`)),
        timeoutMs,
      );
    });

    try {
      await Promise.race([this.api.isReady, timeout]);
    } catch (error) {
      // Stop the reconnect loop so the failure does not keep the process alive.
      await this.api.disconnect().catch(() => {});
      throw error;
    } finally {
      clearTimeout(timer);
    }

    console.log(`Connected to ${(await this.api.rpc.system.chain()).toHuman()} node`);
  }

  getApi(): ApiPromise {
    return this.api;
  }

  async disconnect(): Promise<void> {
    await this.api.disconnect();
  }
}

/** Extracts a readable message from an Error or a WebSocket ErrorEvent (which wraps the cause in `error`). */
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  const event = error as { message?: unknown; error?: unknown; type?: unknown } | undefined;
  if (typeof event?.message === 'string' && event.message.length > 0) return event.message;
  if (event?.error instanceof Error && event.error.message.length > 0) return event.error.message;
  return typeof event?.type === 'string' ? `websocket ${event.type} event` : String(error);
}
