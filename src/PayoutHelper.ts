import { ApiPromise } from '@polkadot/api';
import { SubstrateConnection } from './connection/SubstrateConnection';


export class PayoutHelper {
	private api: ApiPromise;

	constructor(connection: SubstrateConnection) {
		this.api = connection.getApi();
	}

	async payoutRewards(validators: string[], sender, depth: boolean = false): Promise<void> {

		for (const validator of validators) {
			const unclaimedPayouts = await this.checkPayouts(validator, depth);

			for (const payout of unclaimedPayouts) {
				await this.payout(validator, payout, sender);
			}
		}
	}

	async payout(validatorAddress: string, era: number, sender): Promise<void> {

		const transaction = this.api.tx.staking.payoutStakers(validatorAddress, era)
		await this.sendTransaction(transaction, sender)
	}

	public async checkPayouts(validatorAddress: string, depth): Promise<number[]> {

		// @ts-ignore
		const currentEra = (await this.api.query.staking.activeEra()).unwrapOr(null);

		const lastReward = await this.getLastReward(validatorAddress, depth)

		const numOfPotentialUnclaimedPayouts = currentEra.index - lastReward - 1;
		const unclaimedPayouts: number[] = []
		for (let i = 1; i <= numOfPotentialUnclaimedPayouts; i++) {

			const idx = lastReward + i;
			const exposure = (await this.api.query.staking.erasStakers(idx, validatorAddress)).toJSON();
			if (Number(exposure!['total']) > 0) {
				unclaimedPayouts.push(idx)
			}
		}

		return unclaimedPayouts
	}

	private async getLastReward(validatorAddress: string, isHistoryCheckForced = false): Promise<number> {

		const ledger = (await this.api.derive.staking.account(validatorAddress)).stakingLedger

		let lastReward: number;
		if (isHistoryCheckForced || ledger.claimedRewards.length == 0) {
			// @ts-ignore
			lastReward = this.api.consts.staking.historyDepth.toNumber();
		} else {
			lastReward = ledger.claimedRewards.pop().toNumber();
		}

		return lastReward
	}

	private async sendTransaction(transaction: any, sender: any): Promise<void> {
		await new Promise(async (resolve) => {
			console.log(sender.address)
			transaction.signAndSend(sender, ({ status, events }) => {
				if (status.isInBlock || status.isFinalized) {
					events
						// find/filter for failed events
						.filter(({ event }) =>
							this.api.events.system.ExtrinsicFailed.is(event)
						)
						// we know that data for system.ExtrinsicFailed is
						// (DispatchError, DispatchInfo)
						.forEach(({ event: { data: [error, info] } }) => {
							if (error.isModule) {
								// for module errors, we have the section indexed, lookup
								const decoded = this.api.registry.findMetaError(error.asModule);
								const { docs, method, section } = decoded;

								console.log(`${section}.${method}: ${docs.join(' ')}`);
								resolve(info)
							} else {
								// Other, CannotLookup, BadOrigin, no extra info
								console.log(error.toString());
								resolve(error)
							}
						});
				}
				else {
					resolve(status)
				}
			});
		})
	}
}
