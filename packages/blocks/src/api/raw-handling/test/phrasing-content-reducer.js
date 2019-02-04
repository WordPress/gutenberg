/**
 * Internal dependencies
 */
import phrasingContentReducer from '../phrasing-content-reducer';
import { deepFilterHTML } from '../utils';

describe( 'phrasingContentReducer', () => {
	it( 'should transform font weight', () => {
		expect( deepFilterHTML( '<span style="font-weight:bold">test</span>', [ phrasingContentReducer ], {} ) ).toEqual( '<strong><span style="font-weight:bold">test</span></strong>' );
	} );

	it( 'should transform numeric font weight', () => {
		expect( deepFilterHTML( '<span style="font-weight:700">test</span>', [ phrasingContentReducer ], {} ) ).toEqual( '<strong><span style="font-weight:700">test</span></strong>' );
	} );

	it( 'should transform font style', () => {
		expect( deepFilterHTML( '<span style="font-style:italic">test</span>', [ phrasingContentReducer ], {} ) ).toEqual( '<em><span style="font-style:italic">test</span></em>' );
	} );

	it( 'should transform nested formatting', () => {
		expect( deepFilterHTML( '<span style="font-style:italic;font-weight:bold">test</span>', [ phrasingContentReducer ], {} ) ).toEqual( '<strong><em><span style="font-style:italic;font-weight:bold">test</span></em></strong>' );
	} );

	it( 'should normalise the rel attribute', () => {
		const input = '<a href="https://wordpress.org" target="_blank">WordPress</a>';
		const output = '<a href="https://wordpress.org" target="_blank" rel="noreferrer noopener">WordPress</a>';
		expect( deepFilterHTML( input, [ phrasingContentReducer ], {} ) ).toEqual( output );
	} );

	it( 'should only allow target="_blank"', () => {
		const input = '<a href="https://wordpress.org" target="_self">WordPress</a>';
		const output = '<a href="https://wordpress.org">WordPress</a>';
		expect( deepFilterHTML( input, [ phrasingContentReducer ], {} ) ).toEqual( output );
	} );

	it( 'should remove the rel attribute when target is not set', () => {
		const input = '<a href="https://wordpress.org" rel="noopener">WordPress</a>';
		const output = '<a href="https://wordpress.org">WordPress</a>';
		expect( deepFilterHTML( input, [ phrasingContentReducer ], {} ) ).toEqual( output );
	} );
} );
