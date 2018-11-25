/**
 * Given an array of functions, each returning a promise, performs all
 * promises in sequence (waterfall) order.
 *
 * @param {Function[]} sequence Array of promise creators.
 *
 * @return {Promise} Promise resolving once all in the sequence complete.
 */
export async function promiseSequence( sequence ) {
	return sequence.reduce(
		( current, next ) => current.then( next ),
		Promise.resolve()
	);
}
