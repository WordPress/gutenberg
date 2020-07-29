/**
 * Internal dependencies
 */
const md5 = require( '../lib/md5' );

describe( 'md5', () => {
	it( 'creates a hash of a string', () => {
		const result = md5( 'hello' );
		expect( result ).toMatchSnapshot();
	} );
	it( 'creates a hash of a object', () => {
		const result = md5( { foo: 'xyz', test: { anotherFoo: 123 } } );
		expect( result ).toMatchSnapshot();
	} );
	it( 'creates a hash of a number', () => {
		const result = md5( 123789 );
		expect( result ).toMatchSnapshot();
	} );
	it( 'creates a hash of null', () => {
		const result = md5( null );
		expect( result ).toMatchSnapshot();
	} );
	it( 'uses the same hash for the same values', () => {
		const testObj = {
			test: 1,
			otherTest: {
				foo: 'hello',
			},
		};
		const result1 = md5( testObj );
		const result2 = md5( { ...testObj } );
		expect( result1 ).toBe( result2 );
	} );
} );
