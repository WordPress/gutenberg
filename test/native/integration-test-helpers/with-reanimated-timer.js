/**
 * External dependencies
 */
import { act } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
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
		// Reanimated uses a custom `now` function to advance animations. In order to be able to use
		// Jest timer functions to advance animations we need to set the fake timers' internal clock.
		// Reference: https://t.ly/0S__f
		const reanimatedNowMockCopy = global.ReanimatedDataMock.now;
		global.ReanimatedDataMock.now = jest.now;

		const result = await fn();

		// As part of the clean up, we run all pending timers that might have been derived from animations.
		act( () => jest.runOnlyPendingTimers() );

		global.ReanimatedDataMock.now = reanimatedNowMockCopy;

		return result;
	} );
}
