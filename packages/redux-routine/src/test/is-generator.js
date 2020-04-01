/**
 * Internal dependencies
 */
import isGenerator from '../is-generator';

describe( 'isGenerator', () => {
	test.each( [
		[ undefined ],
		[ null ],
		[ 10 ],
		[ 'foo' ],
		[ [ 0, 1, 2, 3 ] ],
		[ function func() {} ],
		[ function* generatorFunc() {} ],
	] )( 'should return false for %p', ( value ) => {
		expect( isGenerator( value ) ).toBe( false );
	} );

	it( 'should return false if an imposter!', () => {
		const value = { next() {} };

		expect( isGenerator( value ) ).toBe( false );
	} );

	it( 'should return false if an async generator', () => {
		const value = ( async function*() {} )();

		expect( isGenerator( value ) ).toBe( false );
	} );

	it( 'should return true if a generator', () => {
		const value = ( function*() {} )();

		expect( isGenerator( value ) ).toBe( true );
	} );
} );
