/**
 * Internal dependencies
 */
import setNestedValue from '../set-nested-value';

describe( 'setNestedValue', () => {
	it( 'should return the same object unmodified if path is an empty array', () => {
		const input = { x: 'y' };
		const result = setNestedValue( input, [], 123 );

		expect( result ).toBe( input );
		expect( result ).toEqual( { x: 'y' } );
	} );

	it( 'should set values at deep level', () => {
		const input = { x: { y: { z: 123 } } };
		const result = setNestedValue( input, [ 'x', 'y', 'z' ], 456 );

		expect( result ).toEqual( { x: { y: { z: 456 } } } );
	} );

	it( 'should set values at deep level having a string as path', () => {
		const input = { x: { y: { z: 123 } } };
		const result = setNestedValue( input, 'x.y.z', 456 );

		expect( result ).toEqual( { x: { y: { z: 456 } } } );
	} );

	it( 'should create nested objects if necessary', () => {
		const result = setNestedValue( {}, [ 'x', 'y', 'z' ], 123 );

		expect( result ).toEqual( { x: { y: { z: 123 } } } );
	} );

	it( 'should create nested arrays when keys are numeric', () => {
		const result = setNestedValue( {}, [ 'x', 0, 'z' ], 123 );

		expect( result ).toEqual( { x: [ { z: 123 } ] } );
	} );

	it( 'should also work with arrays', () => {
		const result = setNestedValue( [], [ 0, 1, 2 ], 123 );

		expect( result ).toEqual( [ [ , [ , , 123 ] ] ] );
	} );

	it( 'should keep remaining properties unaffected', () => {
		const input = { x: { y: { z: 123, z1: 'z1' }, y1: 'y1' }, x1: 'x1' };
		const result = setNestedValue( input, [ 'x', 'y', 'z' ], 456 );

		expect( result ).toEqual( {
			x: { y: { z: 456, z1: 'z1' }, y1: 'y1' },
			x1: 'x1',
		} );
	} );

	it( 'should intentionally mutate the original object', () => {
		const input = { x: 'y' };
		const result = setNestedValue( input, [ 'x' ], 'z' );

		expect( result ).toBe( input );
		expect( result ).toEqual( { x: 'z' } );
	} );

	it.each( [
		undefined,
		null,
		0,
		5,
		NaN,
		Infinity,
		'test',
		false,
		true,
		Symbol( 'foo' ),
	] )( 'should return the original input if it is %s', ( value ) => {
		expect( setNestedValue( value, [ 'x' ], 123 ) ).toBe( value );
	} );
} );
