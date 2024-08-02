/**
 * Internal dependencies
 */
import createAsyncDebouncer from '../create-async-debouncer';

// See https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function.
// Jest fake timers and async functions don't mix too well, since queued up
// promises can prevent jest from calling timeouts.
// This function flushes promises in the queue.
function flushPromises() {
	return new Promise( jest.requireActual( 'timers' ).setImmediate );
}

// Promisify a timeout for use with jest.fn.
function timeout( milliseconds ) {
	return new Promise( ( resolve ) => setTimeout( resolve, milliseconds ) );
}

describe( 'debounceAsync', () => {
	it( 'uses a trailing debounce by default, the first call happens after delayMS', async () => {
		jest.useFakeTimers();
		const fn = jest.fn( async () => {} );
		const debounce = createAsyncDebouncer();
		debounce( () => fn(), { delayMS: 20 } );

		// It isn't called immediately.
		expect( fn ).not.toHaveBeenCalled();

		await flushPromises();
		jest.advanceTimersByTime( 19 );

		// It isn't called before `delayMS`.
		expect( fn ).not.toHaveBeenCalled();

		await flushPromises();
		jest.advanceTimersByTime( 2 );

		// It is called after `delayMS`.
		expect( fn ).toHaveBeenCalledTimes( 1 );

		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'calls the function on the trailing edge only once when there are multiple trailing edge calls', async () => {
		jest.useFakeTimers();
		const fn = jest.fn( async () => {} );
		const debounce = createAsyncDebouncer();

		debounce( () => fn( 'A' ), { delayMS: 20 } );
		debounce( () => fn( 'B' ), { delayMS: 20 } );
		debounce( () => fn( 'C' ), { delayMS: 20 } );
		debounce( () => fn( 'D' ), { delayMS: 20 } );

		await flushPromises();
		jest.runAllTimers();

		expect( fn ).toHaveBeenCalledTimes( 1 );
		expect( fn ).toHaveBeenCalledWith( 'D' );

		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'supports variable delay for each invocation of the debounce', async () => {
		jest.useFakeTimers();
		const fn = jest.fn( async () => {} );
		const debounce = createAsyncDebouncer();

		debounce( () => fn(), { delayMS: 5 } );

		// Advance to just before the first delay.
		await flushPromises();
		jest.advanceTimersByTime( 4 );

		expect( fn ).toHaveBeenCalledTimes( 0 );

		// Trigger a second shorter debounce
		debounce( () => fn(), { delayMS: 2 } );

		// Advance to just after the second delay.
		await flushPromises();
		jest.advanceTimersByTime( 3 );

		expect( fn ).toHaveBeenCalledTimes( 1 );

		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'waits for promise resolution in the callback before debouncing again', async () => {
		jest.useFakeTimers();

		// The callback takes 10ms to resolve.
		const fn = jest.fn( async () => timeout( 10 ) );
		const debounce = createAsyncDebouncer();

		debounce( () => fn(), { delayMS: 20 } );

		// Advance to just after delayMS, but before the callback has resolved.
		await flushPromises();
		jest.advanceTimersByTime( 25 );

		// The callback has started invoking but hasn't finished resolution
		expect( fn ).toHaveBeenCalledTimes( 1 );

		// Trigger another call.
		debounce( () => fn(), { delayMS: 20 } );

		// Advanced by enough to resolve the first timeout.
		await flushPromises();
		jest.advanceTimersByTime( 10 );

		expect( fn ).toHaveBeenCalledTimes( 1 );

		// Then advance by enough to invoke the second timeout.
		await flushPromises();
		jest.advanceTimersByTime( 20 );

		// The second callback should have started but now be resolving.
		expect( fn ).toHaveBeenCalledTimes( 2 );

		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'invokes the callback when the maxWaitMS is reached, even when delayMS is still yet to elapse', async () => {
		jest.useFakeTimers();
		const fn = jest.fn( async () => {} );
		const debounce = createAsyncDebouncer( { maxWaitMS: 8 } );

		// The first call has been triggered, but will take 4ms to resolve.
		debounce( () => fn(), { delayMS: 4 } );

		// Advance by less than the delayMS (total time: 3ms).
		await flushPromises();
		jest.advanceTimersByTime( 3 );
		expect( fn ).toHaveBeenCalledTimes( 0 );

		// Trigger the debounce a second time, extending the delay
		debounce( () => fn(), { delayMS: 4 } );

		// Advance again by less than the delayMS (total time: 6ms).
		await flushPromises();
		jest.advanceTimersByTime( 3 );
		expect( fn ).toHaveBeenCalledTimes( 0 );

		// Trigger the debounce a third time, extending the delay
		debounce( () => fn(), { delayMS: 4 } );

		// Advance again by less than the delayMS, but this time the maxWait should
		// cause an invocation of the callback. (total time: 9ms, max wait: 8ms).
		await flushPromises();
		jest.advanceTimersByTime( 3 );
		expect( fn ).toHaveBeenCalledTimes( 1 );

		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'is thenable, returning any data from promise resolution of the debounced function', async () => {
		expect.assertions( 2 );
		const fn = async () => 'test';
		const debounce = createAsyncDebouncer();

		// Test the return value via awaiting.
		const returnValue = await debounce( () => fn(), {
			delayMS: 1,
		} );
		expect( returnValue ).toBe( 'test' );

		// Test then-ing.
		await debounce( () => fn(), {
			delayMS: 1,
		} ).then( ( thenValue ) => expect( thenValue ).toBe( 'test' ) );
	} );

	it( 'is catchable', async () => {
		expect.assertions( 2 );
		const expectedError = new Error( 'test' );
		const fn = async () => {
			throw expectedError;
		};

		const debounce = createAsyncDebouncer();

		// Test traditional try/catch.
		try {
			await debounce( () => fn(), {
				delayMS: 1,
			} );
		} catch ( error ) {
			// Disable reason - the test uses `expect.assertions` to ensure
			// conditional assertions are called.
			// eslint-disable-next-line jest/no-conditional-expect
			expect( error ).toBe( expectedError );
		}

		// Test chained .catch().
		await await debounce( () => fn(), {
			delayMS: 1,
		} ).catch( ( error ) => {
			// Disable reason - the test uses `expect.assertions` to ensure
			// conditional assertions are called.
			// eslint-disable-next-line jest/no-conditional-expect
			expect( error ).toBe( expectedError );
		} );
	} );
} );
