import { setImmediate as setImmediateCallback } from 'node:timers';
import { describe, expect, it, vi } from 'vitest';
import debounceAsync from '../debounce-async';

// Let promise callbacks settle without advancing the faked timeout clock.
function flushPromises() {
	return new Promise( setImmediateCallback );
}

// Promisify a timeout for use with vi.fn.
function timeout( milliseconds ) {
	return new Promise( ( resolve ) => setTimeout( resolve, milliseconds ) );
}

describe( 'debounceAsync', () => {
	it( 'uses a leading debounce, the first call happens immediately', () => {
		const fn = vi.fn( async () => {} );
		const debounced = debounceAsync( fn, 20 );
		debounced();
		expect( fn ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls the function on the leading edge and then once on the trailing edge when there are multiple calls', async () => {
		vi.useFakeTimers( { toFake: [ 'setTimeout', 'clearTimeout' ] } );
		try {
			const fn = vi.fn( async () => {} );
			const debounced = debounceAsync( fn, 20 );

			debounced( 'A' );

			expect( fn ).toHaveBeenCalledTimes( 1 );

			debounced( 'B' );
			debounced( 'C' );
			debounced( 'D' );

			await flushPromises();
			vi.runAllTimers();

			expect( fn ).toHaveBeenCalledTimes( 2 );
			expect( fn ).toHaveBeenCalledWith( 'A' );
			expect( fn ).toHaveBeenCalledWith( 'D' );
		} finally {
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	} );

	it( 'ensures the delay has elapsed between calls', async () => {
		vi.useFakeTimers( { toFake: [ 'setTimeout', 'clearTimeout' ] } );
		try {
			const fn = vi.fn( async () => timeout( 10 ) );
			const debounced = debounceAsync( fn, 20 );

			// The first call has been triggered, but will take 10ms to resolve.
			debounced();
			debounced();
			debounced();
			debounced();
			expect( fn ).toHaveBeenCalledTimes( 1 );

			// The first call has resolved. The delay period has started but has yet to finish.
			await flushPromises();
			vi.advanceTimersByTime( 11 );
			expect( fn ).toHaveBeenCalledTimes( 1 );

			// The second call is about to commence, but hasn't yet.
			await flushPromises();
			vi.advanceTimersByTime( 18 );
			expect( fn ).toHaveBeenCalledTimes( 1 );

			// The second call has now commenced.
			await flushPromises();
			vi.advanceTimersByTime( 2 );
			expect( fn ).toHaveBeenCalledTimes( 2 );

			// No more calls happen.
			await flushPromises();
			vi.runAllTimers();
			expect( fn ).toHaveBeenCalledTimes( 2 );
		} finally {
			vi.clearAllTimers();
			vi.useRealTimers();
		}
	} );

	it( 'is thenable, returning any data from promise resolution of the debounced function', async () => {
		expect.assertions( 2 );
		const fn = async () => 'test';
		const debounced = debounceAsync( fn, 20 );

		// Test the return value via awaiting.
		const returnValue = await debounced();
		expect( returnValue ).toBe( 'test' );

		// Test then-ing.
		await debounced().then( ( thenValue ) =>
			expect( thenValue ).toBe( 'test' )
		);
	} );

	it( 'is catchable', async () => {
		expect.assertions( 2 );
		const expectedError = new Error( 'test' );
		const fn = async () => {
			throw expectedError;
		};

		const debounced = debounceAsync( fn, 20 );

		// Test awaiting a rejection.
		await expect( debounced() ).rejects.toBe( expectedError );

		// Test chained .catch().
		await debounced().catch( ( error ) => {
			expect( error ).toBe( expectedError );
		} );
	} );
} );
