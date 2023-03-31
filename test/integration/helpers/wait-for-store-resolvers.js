/**
 * External dependencies
 */
import { act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { withFakeTimers } from './with-fake-timers';

/**
 * Executes a function that triggers store resolvers and waits for them to be finished.
 *
 * Asynchronous store resolvers leverage `setTimeout` to run at the end of
 * the current JavaScript block execution. In order to prevent "act" warnings
 * triggered by updates to the React tree, we manually tick fake timers and
 * await the resolution of the current block execution before proceeding.
 *
 * @param {Function} fn Function that to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function waitForStoreResolvers( fn ) {
	return withFakeTimers( async () => {
		const result = fn();

		// Advance all timers allowing store resolvers to resolve.
		act( () => jest.runAllTimers() );

		// The store resolvers perform several API fetches during editor
		// initialization. The most straightforward approach to ensure all of them
		// resolve before we consider the editor initialized is to flush micro tasks,
		// similar to the approach found in `@testing-library/react`.
		// https://github.com/callstack/react-native-testing-library/blob/a010ffdbca906615279ecc3abee423525e528101/src/flushMicroTasks.js#L15-L23.
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act( async () => {} );

		return result;
	} );
}
