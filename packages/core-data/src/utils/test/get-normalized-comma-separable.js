/**
 * Internal dependencies
 */
import getNormalizedCommaSeparable from '../get-normalized-comma-separable';

describe( 'getNormalizedCommaSeparable', () => {
	it( 'returns a given array verbatim', () => {
		const result = getNormalizedCommaSeparable( [ 'a', 'b' ] );

		expect( result ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'returns a given string as an array of comma-separated parts', () => {
		const result = getNormalizedCommaSeparable( 'a,b' );

		expect( result ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'returns null if not an array or comma-separated string', () => {
		const result = getNormalizedCommaSeparable( 10 );

		expect( result ).toBe( null );
	} );
} );
