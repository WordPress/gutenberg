/**
 * Internal dependencies
 */
import anchorReducer from '../anchor-reducer';
import { deepFilterHTML } from '../utils';

describe( 'anchorReducer', () => {
	it( 'should normalise the rel attribute', () => {
		const input =
			'<a href="https://wordpress.org" target="_blank">WordPress</a>';
		const output =
			'<a href="https://wordpress.org" target="_blank" rel="noreferrer noopener">WordPress</a>';
		expect( deepFilterHTML( input, [ anchorReducer ], {} ) ).toEqual(
			output
		);
	} );

	it( 'should only allow target="_blank"', () => {
		const input =
			'<a href="https://wordpress.org" target="_self">WordPress</a>';
		const output = '<a href="https://wordpress.org">WordPress</a>';
		expect( deepFilterHTML( input, [ anchorReducer ], {} ) ).toEqual(
			output
		);
	} );

	it( 'should remove the rel attribute when target is not set', () => {
		const input =
			'<a href="https://wordpress.org" rel="noopener">WordPress</a>';
		const output = '<a href="https://wordpress.org">WordPress</a>';
		expect( deepFilterHTML( input, [ anchorReducer ], {} ) ).toEqual(
			output
		);
	} );
} );
