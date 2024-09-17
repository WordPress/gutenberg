/**
 * External dependencies
 */
import { parse } from 'hpq';

/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as sources from '../matchers';

describe( 'matchers', () => {
	describe( 'children()', () => {
		it( 'should return a source function', () => {
			const source = sources.children();

			expect( console ).toHaveWarned();
			expect( typeof source ).toBe( 'function' );
		} );

		it( 'should return HTML equivalent React Element of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and React Element representation.
			const html =
				'<blockquote><p>A delicious sundae dessert</p></blockquote>';
			const match = parse( html, sources.children() );

			expect( console ).toHaveWarned();
			expect( renderToString( match ) ).toBe( html );
		} );
	} );

	describe( 'node()', () => {
		it( 'should return a source function', () => {
			const source = sources.node();

			expect( console ).toHaveWarned();
			expect( typeof source ).toBe( 'function' );
		} );

		it( 'should return HTML equivalent React Element of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and React Element representation.
			const html =
				'<blockquote><p>A delicious sundae dessert</p></blockquote>';
			const match = parse( html, sources.node() );

			expect( renderToString( match ) ).toBe( `<body>${ html }</body>` );
		} );
	} );
} );
