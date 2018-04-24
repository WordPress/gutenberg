/**
 * Internal dependencies
 */
import withWeakMapCache from '../with-weak-map-cache';

describe( 'withWeakMapCache', () => {
	it( 'calls and returns from the original function', () => {
		const cachedFn = withWeakMapCache( () => 'Called' );
		const result = cachedFn();

		expect( result ).toBe( 'Called' );
	} );

	it( 'caches by weak reference', () => {
		const a = {};
		const b = {};
		const fn = jest.fn().mockReturnValue( 'Called' );
		const cachedFn = withWeakMapCache( fn );

		cachedFn( a );
		cachedFn( a );
		expect( fn ).toHaveBeenCalledTimes( 1 );

		cachedFn( b );
		expect( fn ).toHaveBeenCalledTimes( 2 );
	} );
} );
