/**
 * Internal dependencies
 */
import { selectorArgsToStateKey } from '../utils';

describe( 'selectorArgsToStateKey', () => {
	it( 'should default to an empty array', () => {
		expect( selectorArgsToStateKey( undefined ) ).toEqual( [] );
	} );

	it( 'should remove trailing undefined values', () => {
		expect( selectorArgsToStateKey( [ 1, 2, undefined ] ) ).toEqual( [
			1, 2,
		] );
		expect(
			selectorArgsToStateKey( [ 1, 2, undefined, undefined ] )
		).toEqual( [ 1, 2 ] );
	} );

	it( 'should leave non-trailing undefined values alone', () => {
		expect(
			selectorArgsToStateKey( [ 1, undefined, 2, undefined ] )
		).toEqual( [ 1, undefined, 2 ] );
	} );

	it( 'should return already normalized array unchanged', () => {
		const args = [ 1, 2, 3 ];
		expect( selectorArgsToStateKey( args ) ).toBe( args );
	} );
} );
