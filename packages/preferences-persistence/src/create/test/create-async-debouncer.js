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
	it( 'uses a leading debounce by default, the first call happens immediately', () => {
		const fn = jest.fn( async () => {} );
		const debounce = createAsyncDebouncer();
		debounce( () => fn(), { delayMS: 20 } );
		expect( fn ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls the function on the leading edge and then once on the trailing edge when there are multiple leading edge calls', async () => {
		jest.useFakeTimers();
		const fn = jest.fn( async () => {} );
		const debounce = createAsyncDebouncer();

		debounce( () => fn( 'A' ), { delayMS: 20 } );

		expect( fn ).toHaveBeenCalledTimes( 1 );

		debounce( () => fn( 'B' ), { delayMS: 20 } );
		debounce( () => fn( 'C' ), { delayMS: 20 } );
		debounce( () => fn( 'D' ), { delayMS: 20 } );

		await flushPromises();
		jest.runAllTimers();

		expect( fn ).toHaveBeenCalledTimes( 2 );
		expect( fn ).toHaveBeenCalledWith( 'A' );
		expect( fn ).toHaveBeenCalledWith( 'D' );

		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'can be configured to use a trailing edge debounce, the first call happens after the delay', () => {
		jest.useFakeTimers();
		const fn = jest.fn( async () => {} );
		const debounce = createAsyncDebouncer();
		debounce( () => fn(), { delayMS: 20, isTrailing: true } );

		// The function isn't called immediately.
		expect( fn ).toHaveBeenCalledTimes( 0 );

		// After the delay, the function is called.
		jest.advanceTimersByTime( 20 );
		expect( fn ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls the function on the trailing edge only once when there are multiple trailing edge calls', async () => {
		jest.useFakeTimers();
		const fn = jest.fn( async () => {} );
		const debounce = createAsyncDebouncer();

		debounce( () => fn( 'A' ), { delayMS: 20, isTrailing: true } );
		debounce( () => fn( 'B' ), { delayMS: 20, isTrailing: true } );
		debounce( () => fn( 'C' ), { delayMS: 20, isTrailing: true } );
		debounce( () => fn( 'D' ), { delayMS: 20, isTrailing: true } );

		await flushPromises();
		jest.runAllTimers();

		expect( fn ).toHaveBeenCalledTimes( 1 );
		expect( fn ).toHaveBeenCalledWith( 'D' );

		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'ensures the delay has elapsed between calls', async () => {
		jest.useFakeTimers();
		const fn = jest.fn( async () => timeout( 10 ) );
		const debounce = createAsyncDebouncer();

		// The first call has been triggered, but will take 10ms to resolve.
		debounce( () => fn(), { delayMS: 20 } );
		debounce( () => fn(), { delayMS: 20 } );
		debounce( () => fn(), { delayMS: 20 } );
		debounce( () => fn(), { delayMS: 20 } );
		expect( fn ).toHaveBeenCalledTimes( 1 );

		// The first call has resolved. The delay period has started but has yet to finish.
		await flushPromises();
		jest.advanceTimersByTime( 11 );
		expect( fn ).toHaveBeenCalledTimes( 1 );

		// The second call is about to commence, but hasn't yet.
		await flushPromises();
		jest.advanceTimersByTime( 18 );
		expect( fn ).toHaveBeenCalledTimes( 1 );

		// The second call has now commenced.
		await flushPromises();
		jest.advanceTimersByTime( 2 );
		expect( fn ).toHaveBeenCalledTimes( 2 );

		// No more calls happen.
		await flushPromises();
		jest.runAllTimers();
		expect( fn ).toHaveBeenCalledTimes( 2 );

		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'is thenable, returning any data from promise resolution of the debounced function', async () => {
		expect.assertions( 2 );
		const fn = async () => 'test';
		const debounce = createAsyncDebouncer();

		// Test the return value via awaiting.
		const returnValue = await debounce( () => fn(), {
			delayMS: 20,
		} );
		expect( returnValue ).toBe( 'test' );

		// Test then-ing.
		await debounce( () => fn(), {
			delayMS: 20,
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
				delayMS: 20,
			} );
		} catch ( error ) {
			// Disable reason - the test uses `expect.assertions` to ensure
			// conditional assertions are called.
			// eslint-disable-next-line jest/no-conditional-expect
			expect( error ).toBe( expectedError );
		}

		// Test chained .catch().
		await await debounce( () => fn(), {
			delayMS: 20,
		} ).catch( ( error ) => {
			// Disable reason - the test uses `expect.assertions` to ensure
			// conditional assertions are called.
			// eslint-disable-next-line jest/no-conditional-expect
			expect( error ).toBe( expectedError );
		} );
	} );
} );
