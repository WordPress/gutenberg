/**
 * External dependencies
 */
import { times } from 'lodash';

/**
 * Given an array of functions, each returning a promise, performs all
 * promises in sequence (waterfall) order.
 *
 * @param {Function[]} sequence Array of promise creators.
 *
 * @return {Promise} Promise resolving once all in the sequence complete.
 */
async function promiseSequence( sequence ) {
	return sequence.reduce(
		( current, next ) => current.then( next ),
		Promise.resolve()
	);
}

/**
 * Presses the given keyboard key a number of times in sequence.
 *
 * @param {string} key   Key to press.
 * @param {number} count Number of times to press.
 *
 * @return {Promise} Promise resolving when key presses complete.
 */
export async function pressKeyTimes( key, count ) {
	return promiseSequence( times( count, () => () => page.keyboard.press( key ) ) );
}
