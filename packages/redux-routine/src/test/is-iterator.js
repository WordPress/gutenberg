/**
 * Internal dependencies
 */
import isIterator from '../is-iterator';

describe( 'isIterator', () => {
	test.each( [
		[ undefined ],
		[ null ],
		[ 10 ],
		[ 'foo' ],
		[ [ 0, 1, 2, 3 ] ],
		[ function() {} ],
		[ function*() {} ],
	] )( 'should return false if %o', ( value ) => {
		expect( isIterator( value ) ).toBe( false );
	} );

	it( 'should return false if an imposter!', () => {
		const value = { next() {} };

		expect( isIterator( value ) ).toBe( false );
	} );

	it( 'should return false if an async generator', () => {
		const value = ( async function*() {}() );

		expect( isIterator( value ) ).toBe( false );
	} );

	it( 'should return true if a generator', () => {
		const value = ( function*() {}() );

		expect( isIterator( value ) ).toBe( true );
	} );
} );
