import { describe, expect, it } from 'vitest';
import getNormalizedCommaSeparable from '../get-normalized-comma-separable';

describe( 'getNormalizedCommaSeparable', () => {
	it( 'returns a given array verbatim', () => {
		const result = getNormalizedCommaSeparable( [ 'a', 'b' ] );

		expect( result ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'preserves the element type of a given array', () => {
		const result: Array< number > = getNormalizedCommaSeparable( [ 1, 2 ] );

		expect( result ).toEqual( [ 1, 2 ] );
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
