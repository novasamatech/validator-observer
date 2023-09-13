export async function sendTransaction(transaction: any, sender: any, api: any): Promise<void> {
    await new Promise(async (unsub) => {
        transaction.signAndSend(sender, ({ status, events }) => {
            console.log(`Current status is $.status}`);

            if (status.isInBlock) {
                console.log(`Transaction included at blockHash ${status.asInBlock}`);
                events.filter(({ event }) =>
                    api.events.system.ExtrinsicFailed.is(event)
                )
                    .forEach(({ event: { data: [error, info] } }) => {
                        if (error.isModule) {
                            // for module errors, we have the section indexed, lookup
                            const decoded = api.registry.findMetaError(error.asModule);
                            const { docs, method, section } = decoded;

                            console.log(`${section}.${method}: ${docs.join(' ')}`);
                            unsub(info)
                        } else {
                            // Other, CannotLookup, BadOrigin, no extra info
                            console.log(error.toString());
                            unsub(error)
                        }
                    });
            } else if (status.isFinalized) {
                console.log(`Transaction finalized at blockHash ${status.asFinalized}`);
                unsub(status);
            }
            else {
                console.log(`Waiting for status update... Current status is: ${status}`);
            }
        });
    })
}