/**
 * Performs a trailing edge debounce of async functions.
 *
 * If the debounce is called twice at the same time:
 * - the first is queued via a timeout on the first call.
 * - the first timeout is cancelled and the second is queued on the second call.
 *
 * If the second call begins a promise resolution and a third call is made,
 * the third call awaits resolution before queuing a third timeout.
 *
 * This is distinct from `{ debounce } from @wordpress/compose` in that it
 * waits for promise resolution and is supports each debounce invocation
 * having a variable delay.
 *
 * @param {Object} options
 * @param {number} options.maxWaitMS
 * @return {Function} A function that debounces the async function passed to it
 *                    in the first parameter by the time passed in the second
 *                    options parameter.
 */
export default function createAsyncDebouncer( { maxWaitMS } = {} ) {
	let timeoutId;
	let activePromise;
	let firstRequestTime;

	return async function debounced( func, { delayMS } ) {
		if ( activePromise ) {
			// Let any active promises finish before queuing the next request.
			await activePromise;
		}

		// Clear any active timeouts, abandoning any requests that have
		// been queued but not been made.
		if ( timeoutId ) {
			clearTimeout( timeoutId );
			timeoutId = null;
		}

		// Trigger any trailing edge calls to the function.
		return new Promise( ( resolve, reject ) => {
			let maxedDelay = delayMS;
			if ( maxWaitMS !== undefined ) {
				if ( firstRequestTime ) {
					const elapsed = Date.now() - firstRequestTime;
					// Ensure wait is less than the maxWait.
					maxedDelay = Math.max( 0, maxWaitMS - elapsed );
					// But also not longer than `delayMS`.
					maxedDelay = Math.min( delayMS, maxedDelay );
				} else {
					firstRequestTime = Date.now();
				}
			}

			// Schedule the next request but with a delay.
			timeoutId = setTimeout( () => {
				activePromise = func()
					.then( ( ...thenArgs ) => {
						resolve( ...thenArgs );
					} )
					.catch( ( error ) => {
						reject( error );
					} )
					.finally( () => {
						// As soon this promise is complete, clear the way for the
						// next function to be queued.
						activePromise = null;
						timeoutId = null;
						firstRequestTime = null;
					} );
			}, maxedDelay );
		} );
	};
}
