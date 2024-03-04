/**
 * Internal dependencies
 */
import getNestedValue from '../get-nested-value';

describe( 'getNestedValue', () => {
	it( 'should return the same object unmodified if path is an empty array', () => {
		const input = { x: 'y' };
		const result = getNestedValue( input, [] );
		expect( result ).toEqual( input );
	} );

	it( 'should return the nested value', () => {
		const input = { x: { y: { z: 123 } } };
		const result = getNestedValue( input, [ 'x', 'y', 'z' ] );

		expect( result ).toEqual( 123 );
	} );

	it( 'should return the nested value if the path is a string', () => {
		const input = { x: { y: { z: 123 } } };
		const result = getNestedValue( input, 'x.y.z' );

		expect( result ).toEqual( 123 );
	} );

	it( 'should return the shallow value', () => {
		const input = { x: { y: { z: 123 } } };
		const result = getNestedValue( input, 'x' );

		expect( result ).toEqual( { y: { z: 123 } } );
	} );

	it( 'should return the default value if the nested value is undefined', () => {
		const input = { x: { y: { z: undefined } } };
		const result = getNestedValue( input, [ 'x', 'y', 'z' ], 456 );

		expect( result ).toEqual( 456 );
	} );

	it( 'should return the nested value if it is different to undefined', () => {
		const input = { x: { y: { z: null } } };
		const result = getNestedValue( input, 'x.y.z', 456 );

		expect( result ).toBeNull();
	} );

	it( 'should return the default value if the nested value does not exist', () => {
		const input = { x: { y: { z: 123 } } };
		const result = getNestedValue( input, [ 'x', 'y', 'z1' ], 456 );

		expect( result ).toEqual( 456 );
	} );

	it( 'should return undefined if the nested value does not exist', () => {
		const input = { x: { y: { z: 123 } } };
		const result = getNestedValue( input, [ 'x', 'y', 'z1' ] );

		expect( result ).toBeUndefined();
	} );
} );
