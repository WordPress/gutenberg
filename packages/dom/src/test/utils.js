/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

describe( 'assertIsDefined', () => {
	it( 'should throw if the variable is null', () => {
		expect( () => assertIsDefined( null ) ).toThrow(
			"Expected 'val' to be defined, but received null"
		);
	} );

	it( 'should throw if the variable is undefined', () => {
		expect( () => assertIsDefined( undefined ) ).toThrow(
			"Expected 'val' to be defined, but received undefined"
		);
	} );

	it.each( [ 0, '', NaN, -0, 1, new String(), {}, [], false, Infinity ] )(
		'should not throw if the value is %s',
		( val ) => {
			expect( () => assertIsDefined( val ) ).not.toThrow();
		}
	);
} );
