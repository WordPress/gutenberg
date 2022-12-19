/**
 * External dependencies
 */
import { act } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { FRAME_TIME } from './constants';
import { withFakeTimers } from './with-fake-timers';

/**
 * Prepare timers for executing a function that uses the Reanimated APIs.
 *
 * NOTE: This code is based on a similar function provided by the Reanimated library.
 * Reference: https://github.com/software-mansion/react-native-reanimated/blob/b4ee4ea9a1f246c461dd1819c6f3d48440a25756/src/reanimated2/jestUtils.ts#L170-L174
 *
 * @param {Function} fn Function to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function withReanimatedTimer( fn ) {
	return withFakeTimers( async () => {
		global.requestAnimationFrame = ( callback ) =>
			setTimeout( callback, FRAME_TIME );

		const result = await fn();

		// As part of the clean up, we run all pending timers that might have been derived from animations.
		act( () => jest.runOnlyPendingTimers() );

		return result;
	} );
}
