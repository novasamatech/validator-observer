import { Validator } from "../../config/conf";
import { sendTransaction } from "../../utils";
import { PayoutHelper } from "../PayoutHelper";

/**
 * AstarPayoutHelper is a class that extends PayoutHelper and provides methods to handle payouts on the Astar network.
 */
export class AstarPayoutHelper extends PayoutHelper {
  /**
   * Creates an AstarPrimitivesDappStakingSmartContract type with the given validator address.
   * @param dappAddress - The dapp address.
   * @returns The AstarPrimitivesDappStakingSmartContract type.
   */
  private astarRuntimeSmartContract(dappAddress: string) {
    return this.api.createType("AstarPrimitivesDappStakingSmartContract", {
      Evm: dappAddress,
    });
  }

  /**
   * Payouts rewards to the given validators.
   * @param validators - The validators to payout rewards to.
   * @param sender - The sender of the transaction.
   * @param depth - Whether to payout rewards for all eras or just the current era.
   * @returns A promise that resolves when the rewards have been paid out.
   */
  async payoutRewards(
    validators: Validator[],
    sender,
    depth: boolean = false,
  ): Promise<void> {
    for (const validator of validators) {
      const dappAddress = await this.getDAPPAddress(validator.address);
      if (dappAddress) {
        const erasToPayout = await this.getErasToReward(dappAddress);
        if (erasToPayout.length === 0) {
          console.log(
            `Payout plan for validator ${validator.address}: no unclaimed eras`,
          );
        } else {
          console.log(
            `Payout plan for validator ${validator.address}: eras ${erasToPayout.join(", ")}`,
          );
        }
        await this.processPayout(dappAddress, erasToPayout, sender);
      }
    }
  }

  /**
   * Gets the DAPP address for the given validator address.
   * @param validatorAddress - The validator address.
   * @returns A promise that resolves with the DAPP address or undefined if it doesn't exist.
   */
  private async getDAPPAddress(
    validatorAddress: string,
  ): Promise<string | undefined> {
    const dappAccounts = await this.retryApiCall(() =>
      this.api.query.dappStaking.integratedDApps.entries(),
    );
    for (const [key, value] of dappAccounts) {
      const onchainValidatorAddress = value.toJSON() as { owner?: string };
      if (onchainValidatorAddress.owner === validatorAddress) {
        const serializedData = key.toHuman() as [{ Evm?: string }];
        if ("Evm" in serializedData[0]) {
          return serializedData[0].Evm;
        }
      }
    }
    throw new Error("Unexpected data type");
  }

  /**
   * Gets the eras to reward for the given dapp.
   * @param dappAddress - The dapp address.
   * @returns A promise that resolves with an array of eras to reward.
   */
  private async getErasToReward(dappAddress: string): Promise<Array<number>> {
    const rewardEras: Array<number> = [];
    const dappInfo = await this.api.query.dappStaking.integratedDApps({
      Evm: dappAddress,
    });
    const ourDappId = (dappInfo as any).unwrap().id.toNumber();

    const rewardsByEra = await this.api.query.dappStaking.dAppTiers.entries();

    rewardsByEra.forEach(([era, tierRewards]) => {
      if ((tierRewards as any).isNone) return;

      const tierDapps = (tierRewards as any).unwrap().dapps;
      const dapps: Array<{ dappId: number; tierId: number }> = [];
      tierDapps.forEach((value, key) => {
        dapps.push({
          dappId: key.toNumber(),
          tierId: value.toNumber(),
        });
      });

      const ourUnclaimedTier = dapps.find(({ dappId }) => dappId === ourDappId);
      if (ourUnclaimedTier) {
        const eraNumber = (era.args[0] as any).toNumber();
        rewardEras.push(eraNumber);
      }
    });

    return rewardEras;
  }

  /**
   * Processes the payout for the given dapp address and reward eras.
   * @param dappAddress - The dapp address.
   * @param rewardEras - The reward eras.
   * @param sender - The sender of the transaction.
   * @param batch_size - The size of the batch of transactions to send.
   * @returns A promise that resolves when the payout has been processed.
   */
  private async processPayout(
    dappAddress: string,
    rewardEras: Array<number>,
    sender: any,
    batch_size: number = 20,
  ) {
    const transactions: any = [];
    rewardEras = rewardEras.reverse();

    for (let i = 0; i < rewardEras.length; i += batch_size) {
      const batch = rewardEras
        .slice(i, i + batch_size)
        .map((era) =>
          this.api.tx.dappStaking.claimDappReward(
            this.astarRuntimeSmartContract(dappAddress),
            this.api.createType("u32", era),
          ),
        );
      transactions.push(this.api.tx.utility.batch(batch));
    }

    for (const transaction of transactions) {
      await sendTransaction(transaction, sender, this.api);
    }
  }
}
