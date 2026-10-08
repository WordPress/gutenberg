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
 * @param func    A function that returns a promise.
 * @param delayMS A delay in milliseconds.
 *
 * @return A function that debounce whatever function is passed
 *         to it.
 */
export default function debounceAsync< Args extends unknown[], Result >(
	func: ( ...args: Args ) => Promise< Result >,
	delayMS: number
): ( ...args: Args ) => Promise< Result > {
	let timeoutId: ReturnType< typeof setTimeout > | null | undefined;
	let activePromise: Promise< void > | null | undefined;

	return async function debounced( ...args: Args ) {
		// This is a leading edge debounce. If there's no promise or timeout
		// in progress, call the debounced function immediately.
		if ( ! activePromise && ! timeoutId ) {
			return new Promise< Result >( ( resolve, reject ) => {
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
		return new Promise< Result >( ( resolve, reject ) => {
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
