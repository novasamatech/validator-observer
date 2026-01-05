export async function sendTransaction(transaction: any, sender: any, api: any): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let unsubscribe: (() => void) | null = null;
    let finished = false;

    const finalize = (error?: Error) => {
      if (finished) return;
      finished = true;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (unsubError) {
          console.warn('Failed to unsubscribe from transaction updates', unsubError);
        }
      }
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const formatDispatchError = (dispatchError: any): string => {
      if (dispatchError?.isModule && api?.registry) {
        const decoded = api.registry.findMetaError(dispatchError.asModule);
        const { docs, method, section } = decoded;
        return `${section}.${method}: ${docs.join(' ')}`;
      }
      return dispatchError?.toString?.() ?? 'Unknown dispatch error';
    };

    const formatResultDetails = (result: any): string => {
      if (!result) return '';
      const parts: string[] = [];
      const dispatchError = result.dispatchError;
      const internalError = result.internalError;

      if (dispatchError) {
        parts.push(`dispatchError=${formatDispatchError(dispatchError)}`);
      }

      if (internalError) {
        const message =
          typeof internalError === 'string'
            ? internalError
            : internalError?.message
              ? internalError.message.toString()
              : (internalError.toString?.() ?? String(internalError));
        parts.push(`internalError=${message}`);
      }

      if (result.txHash) {
        parts.push(`txHash=${result.txHash.toString()}`);
      }

      return parts.join('; ');
    };

    const logError = (message: string, result?: any) => {
      console.error(message);
      const details = formatResultDetails(result);
      if (details) {
        console.error(`Transaction error details: ${details}`);
      }
    };

    transaction
      .signAndSend(sender, { era: 256 }, (result: any) => {
        const { status, events } = result;
        console.log(`Current status is ${status}`);

        if (status.isInBlock) {
          console.log(`Transaction included at blockHash ${status.asInBlock}`);
          const failedEvent = events?.find(({ event }) => api.events.system.ExtrinsicFailed.is(event));

          if (failedEvent) {
            const {
              event: {
                data: [error],
              },
            } = failedEvent;
            const message = error.isModule ? formatDispatchError(error) : error.toString();
            logError(message, result);
            finalize(new Error(message));
            return;
          }

          const utility = api.events?.utility;
          const utilityError =
            utility &&
            events?.find(
              ({ event }) =>
                (utility.ItemFailed && utility.ItemFailed.is(event)) ||
                (utility.BatchInterrupted && utility.BatchInterrupted.is(event)) ||
                (utility.BatchCompletedWithErrors && utility.BatchCompletedWithErrors.is(event)),
            );
          if (utilityError) {
            logError(`Utility ${utilityError.event.section}.${utilityError.event.method}`, result);
            finalize(new Error('Utility batch error'));
          }
        } else if (status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${status.asFinalized}`);
          finalize();
        } else if (status.isInvalid || status.isDropped || status.isUsurped || status.isRetracted) {
          const message = `Transaction ${status.type || status.toString()}`;
          logError(message, result);
          finalize(new Error(message));
        } else {
          console.log(`Waiting for status update... Current status is: ${status}`);
        }
      })
      .then(unsub => {
        unsubscribe = unsub;
        if (finished) {
          unsub();
        }
      })
      .catch(error => {
        finalize(error);
      });
  });
}
