/**
 * Performs a leading edge debounce of async functions.
 *
 * If three functions are throttled at the same time:
 * - The first happens immediately.
 * - The second is never called.
 * - The third happens `delayMS` milliseconds after the first has resolved.
 *
 * This is distinct from `{ debounce } from @wordpress/compose` in that it
 * waits for promise resolution.
 *
 * @return {Function} A function that debounces the async function passed to it
 *                    in the first parameter by the time passed in the second
 *                    options parameter.
 */
export default function createAsyncDebouncer() {
	let timeoutId;
	let activePromise;

	return async function debounced( func, { delayMS, isTrailing = false } ) {
		// This is a leading edge debounce. If there's no promise or timeout
		// in progress, call the debounced function immediately.
		if ( ! isTrailing && ! activePromise && ! timeoutId ) {
			return new Promise( ( resolve, reject ) => {
				// Keep a reference to the promise.
				activePromise = func()
					.then( ( ...thenArgs ) => {
						resolve( ...thenArgs );
					} )
					.catch( ( error ) => {
						reject( error );
					} )
					.finally( () => {
						// As soon this promise is complete, clear the way for the
						// next one to happen immediately.
						activePromise = null;
					} );
			} );
		}

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
						// next one to happen immediately.
						activePromise = null;
						timeoutId = null;
					} );
			}, delayMS );
		} );
	};
}
