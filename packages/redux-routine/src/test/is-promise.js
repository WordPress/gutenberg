/**
 * Internal dependencies
 */
import { isPromise } from '../is-promise';

describe( 'isPromise', () => {
	test.each( [
		[ undefined ],
		[ null ],
		[ 0 ],
		[ -42 ],
		[ '' ],
		[ 'then' ],
		[ false ],
		[ true ],
		[ {} ],
		[ { then: true } ],
		[ [] ],
		[ [ true ] ],
		[ () => {} ],
	] )( 'should return false for %p', ( value ) => {
		expect( isPromise( value ) ).toBe( false );
	} );

	it( 'should return true for data', () => {
		const promise = { then: function() {} };

		expect( isPromise( promise ) ).toBe( true );
	} );

	it( 'should return true for function', () => {
		const fn = () => {};
		fn.then = () => {};

		expect( isPromise( fn ) ).toBe( true );
	} );
} );
