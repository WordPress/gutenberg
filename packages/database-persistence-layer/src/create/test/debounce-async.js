/**
 * Internal dependencies
 */
import debounceAsync from '../debounce-async';

describe( 'debounceAsync', () => {
	function timeout( milliseconds ) {
		return new Promise( ( resolve ) =>
			window.setTimeout( resolve, milliseconds )
		);
	}

	beforeAll( () => {
		jest.useRealTimers();
	} );

	afterAll( () => {
		jest.useFakeTimers();
	} );

	it( 'uses a leading debounce, the first call happens immediately', () => {
		const fn = jest.fn( async () => {} );
		const debounced = debounceAsync( fn, 20 );
		debounced();
		expect( fn ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls the function on the leading edge and then once on the trailing edge when there are multiple calls', async () => {
		const fn = jest.fn( async () => timeout( 10 ) );
		const debounced = debounceAsync( fn, 20 );

		debounced( 'A' );
		debounced( 'B' );
		debounced( 'C' );
		debounced( 'D' );

		// We can't wait for `debounced`, so wait a suitable time (resolution time + delay + 10)
		// for everything to have resolved.
		await timeout( 40 );

		expect( fn ).toHaveBeenCalledTimes( 2 );
		expect( fn ).toHaveBeenCalledWith( 'A' );
		expect( fn ).toHaveBeenCalledWith( 'D' );
	} );

	it( 'ensures the delay has elapsed between calls', async () => {
		const fn = jest.fn( async () => timeout( 10 ) );
		const debounced = debounceAsync( fn, 20 );

		// The first call has been triggered, but will take 10ms to resolve.
		debounced();
		debounced();
		expect( fn ).toHaveBeenCalledTimes( 1 );

		// The first call has resolved. The delay period has started but has yet to resolve.
		await timeout( 15 );
		expect( fn ).toHaveBeenCalledTimes( 1 );

		// The second call has now commenced.
		await timeout( 20 );
		expect( fn ).toHaveBeenCalledTimes( 2 );
	} );
} );
