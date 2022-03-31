/**
 * Performs a leading edge throttle of async functions.
 *
 * If three functions are throttled at the same time:
 * - The first happens immediately.
 * - The second is never called.
 * - The third happens `delayMS` milliseconds after the first has resolved.
 *
 * @param {number} delayMS A delay in milliseconds.
 * @return {Function} A function that throttle whatever function is passed
 *                    to it.
 */
export default function createAsyncThrottle( delayMS ) {
	let timeoutId;
	let activePromise;

	return async function throttle( func ) {
		// This is a leading edge throttle. If there's no promise or timeout
		// in progress,
		if ( ! activePromise && ! timeoutId ) {
			// Keep a reference to the promise.
			activePromise = func().finally( () => {
				// As soon this promise is complete, clear the way for the
				// next one to happen immediately.
				activePromise = null;
			} );
			return;
		}

		if ( activePromise ) {
			// Let any active promises finish before queuing the next request.
			await activePromise;
		}

		// Clear any active timeouts, abandoning any requests that have
		// been queued but not been made.
		if ( timeoutId ) {
			window.clearTimeout( timeoutId );
			timeoutId = null;
		}

		// Schedule the next request but with a delay.
		timeoutId = setTimeout( () => {
			activePromise = func().finally( () => {
				// As soon this promise is complete, clear the way for the
				// next one to happen immediately.
				activePromise = null;
				timeoutId = null;
			} );
		}, delayMS );
	};
}
