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
import { valueToElement } from '../../editable';

describe( 'matchers', () => {
	describe( 'children()', () => {
		it( 'should return a source function', () => {
			const source = sources.children();

			expect( typeof source ).toBe( 'function' );
		} );

		it( 'should return HTML equivalent WPElement of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and WPElement representation
			const html = '<blockquote><p>A delicious <b>sundae</b> dessert.</p><p>I want it!</p></blockquote>';
			const match = parse( html, sources.children() );

			expect( renderToString( valueToElement( match ) ) ).toBe( html );
		} );
	} );

	describe( 'node()', () => {
		it( 'should return a source function', () => {
			const source = sources.node();

			expect( typeof source ).toBe( 'function' );
		} );

		it( 'should return HTML equivalent WPElement of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and WPElement representation
			const html = '<blockquote><p>A delicious <b>sundae</b> dessert.</p></blockquote>';
			const match = parse( html, sources.node() );

			expect( renderToString( valueToElement( [ match ] ) ) ).toBe( `<body>${ html }</body>` );
		} );
	} );
} );
