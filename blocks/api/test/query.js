/**
 * External dependencies
 */
import { expect } from 'chai';
import { parse } from 'hpq';

/**
 * WordPress dependencies
 */
import { renderToString } from 'element';

/**
 * Internal dependencies
 */
import * as query from '../query';

describe( 'query', () => {
	it( 'should generate matchers which apply internal flag', () => {
		for ( const matcherFn in query ) {
			expect( query[ matcherFn ]()._wpBlocksKnownMatcher ).to.be.true();
		}
	} );

	describe( 'children()', () => {
		it( 'should return a matcher function', () => {
			const matcher = query.children();

			expect( matcher ).to.be.a( 'function' );
		} );

		it( 'should return HTML equivalent WPElement of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and WPElement representation
			const html = '<blockquote><p>A delicious sundae dessert</p></blockquote>';
			const match = parse( html, query.children() );

			expect( renderToString( match ) ).to.equal( html );
		} );
	} );
} );
