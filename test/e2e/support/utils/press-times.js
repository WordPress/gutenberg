/**
 * External dependencies
 */
import { times } from 'lodash';

/**
 * Internal dependencies
 */
import { promiseSequence } from './promise-sequence';

/**
 * Presses the given keyboard key a number of times in sequence.
 *
 * @param {string} key   Key to press.
 * @param {number} count Number of times to press.
 *
 * @return {Promise} Promise resolving when key presses complete.
 */
export async function pressTimes( key, count ) {
	return promiseSequence( times( count, () => () => page.keyboard.press( key ) ) );
}
