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
import Editable from '../../editable';
import * as matchers from '../matchers';

describe( 'matchers', () => {
	const html = '<blockquote><p>A delicious <b>sundae</b> dessert.</p><p>I want it!</p><footer>The Cook</footer></blockquote>';

	describe( 'children()', () => {
		it( 'should return a source function', () => {
			const source = matchers.children();

			expect( typeof source ).toBe( 'function' );
		} );

		it( 'should return HTML equivalent WPElement of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and WPElement representation
			const match = parse( html, matchers.children() );

			expect(
				renderToString( <Editable.Value value={ match } /> )
			).toBe( html );
		} );
	} );

	describe( 'node()', () => {
		it( 'should return a source function', () => {
			const source = matchers.node();

			expect( typeof source ).toBe( 'function' );
		} );

		it( 'should return HTML equivalent WPElement of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and WPElement representation
			const match = parse( html, matchers.node() );

			expect(
				renderToString( <Editable.Value value={ [ match ] } /> )
			).toBe(
				`<body>${ html }</body>`
			);
		} );
	} );
} );
