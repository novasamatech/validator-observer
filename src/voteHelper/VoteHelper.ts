import { ApiPromise } from '@polkadot/api';
import { SubstrateConnection } from '../connection/SubstrateConnection';
import { RelaychainConfig, Validator } from '../config/conf';
import { sendTransaction } from '../utils';
import { Referendum } from './referendum';
import { AbstainVote, StandardVote, TrackVotes, Vote } from './votes';

export class VoteHelper {
    private api: ApiPromise;

    constructor(connection: SubstrateConnection) {
        this.api = connection.getApi();
    }

    async checkVotes(network: RelaychainConfig, sender): Promise<void> {
        const ongoingReferena = await this.getOngoingReferenda();

        for (const validator of network.validators) {
            if (!validator.voteEnabled) continue;
            
            const potentialVotes = await this.getPotentialVotes(validator, ongoingReferena);
            const newVotes = await this.decideHowToVote(validator.address, potentialVotes);

            for (const vote of newVotes) {
                await this.voteForReferenda(vote, sender, validator.address, validator.voteAmount);
            }
        }
    }

    async getOngoingReferenda(): Promise<Referendum[]> {
        const referendums = await this.api.query.referenda.referendumInfoFor.entries();
        const castedReferendums = referendums.map(([key, value]) => new Referendum(key, value));
        return castedReferendums.filter(referendum => referendum.data.ongoing);
    }

    async getAccountVotes(accountAddress: string): Promise<Vote[]> {
        const referendaTracks = this.api.consts.referenda.tracks;
        const trackArray = (referendaTracks as any).map(([key, value]) => new TrackVotes(key, value));
        const accountVotes: Vote[] = [];

        for (const track of trackArray) {
            const votesInTrack = await this.api.query.convictionVoting.votingFor(accountAddress, track.trackNumber);
            (votesInTrack as any).asCasting.votes.map((voteData) => {
                const vote = Vote.createVote(voteData);
                accountVotes.push(vote);
            });
        }

        return accountVotes;
    }

    async getPotentialVotes(validator: Validator, referendums: Referendum[]): Promise<Vote[]> {
        const uniqueVotes = new Set<number>();
        const newVoteForReferenda: Vote[] = [];
        const abstainVotes: Vote[] = [];
        const referendaNumbers = new Set(referendums.map(referendum => referendum.number));

        for (const account of validator.votersAccounts) {
            const voterVotes = await this.getAccountVotes(account);
            const relevantVotes = voterVotes.filter(vote => referendaNumbers.has(vote.referendaNumber));

            for (const vote of relevantVotes) {
                if (!uniqueVotes.has(vote.referendaNumber)) {
                    uniqueVotes.add(vote.referendaNumber);
                    newVoteForReferenda.push(vote);
                }
            }
        }

        for (const referenda of referendums) {
            if (!uniqueVotes.has(referenda.number)) {
                // Create an abstain vote for the referenda
                const abstainVote = new AbstainVote({
                    referendaNumber: referenda.number, data: {
                        SplitAbstain: {
                            aye: "0",
                            nay: "0",
                            abstain: validator.voteAmount,
                        },
                    }
                });
                abstainVotes.push(abstainVote);
            }
        }

        // Combine the new votes and abstain votes
        const combinedVotes = [...newVoteForReferenda, ...abstainVotes];

        return combinedVotes;
    }

    async decideHowToVote(validator: string, potentialVotes: Vote[]): Promise<Vote[]> {
        const validatorVotes = await this.getAccountVotes(validator);
        return potentialVotes.filter(potentialVote => {
            const validatorVote = validatorVotes.find(v => v.referendaNumber == potentialVote.referendaNumber);
            return this.shouldChangeVote(validatorVote, potentialVote);
        });
    }

    shouldChangeVote(validatorVote: Vote | undefined, potentialVote: Vote): boolean {
        if (validatorVote == undefined) return true;
        if (validatorVote instanceof AbstainVote && potentialVote instanceof AbstainVote) return false;
        if (validatorVote instanceof StandardVote && potentialVote instanceof StandardVote) return validatorVote.direction != potentialVote.direction;
        return true;
    }

    async voteForReferenda(vote: Vote, sender, validator: string, balance: number): Promise<void> {
        const constructedVote = vote.createPayload(this.api, balance);
        const voteTransaction = this.api.tx.convictionVoting.vote(vote.referendaNumber, constructedVote);
        const proxyTransaction = this.api.tx.proxy.proxy(validator, 'Governance', voteTransaction);
        await sendTransaction(proxyTransaction, sender, this.api);
    }
}
