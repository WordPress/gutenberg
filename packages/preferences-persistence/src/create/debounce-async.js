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
 * @param {Function} func    A function that returns a promise.
 * @param {number}   delayMS A delay in milliseconds.
 *
 * @return {Function} A function that debounce whatever function is passed
 *                    to it.
 */
export default function debounceAsync( func, delayMS ) {
	let timeoutId;
	let activePromise;

	return async function debounced( ...args ) {
		// This is a leading edge debounce. If there's no promise or timeout
		// in progress, call the debounced function immediately.
		if ( ! activePromise && ! timeoutId ) {
			return new Promise( ( resolve, reject ) => {
				// Keep a reference to the promise.
				activePromise = func( ...args )
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
				activePromise = func( ...args )
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
