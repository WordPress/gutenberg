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
import * as sources from '../source';

describe( 'sources', () => {
	it( 'should generate sources which apply internal flag', () => {
		for ( const sourceFn in sources ) {
			expect( sources[ sourceFn ]()._wpBlocksKnownSource ).toBe( true );
		}
	} );

	describe( 'children()', () => {
		it( 'should return a source function', () => {
			const source = sources.children();

			expect( typeof source ).toBe( 'function' );
		} );

		it( 'should return HTML equivalent WPElement of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and WPElement representation
			const html = '<blockquote><p>A delicious sundae dessert</p></blockquote>';
			const match = parse( html, sources.children() );

			expect( renderToString( match ) ).toBe( html );
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
			const html = '<blockquote><p>A delicious sundae dessert</p></blockquote>';
			const match = parse( html, sources.node() );

			expect( renderToString( match ) ).toBe( `<body>${ html }</body>` );
		} );
	} );
} );
