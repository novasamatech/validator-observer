import { PayoutHelper } from "../PayoutHelper";

export class AstarPayoutHelper extends PayoutHelper {
    async payoutRewards(validators: string[], sender, depth: boolean = false): Promise<void> {
        // implement Astar specific logic here
    }

    // other methods here
}