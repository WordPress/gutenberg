/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { parse, children } from '../query';

describe( 'query', () => {
	describe( 'children()', () => {
		it( 'should return a matcher function', () => {
			const matcher = children();

			expect( matcher ).to.be.a( 'function' );
		} );

		it( 'should return HTML equivalent WPElement of matched element', () => {
			// Assumption here is that we can cleanly convert back and forth
			// between a string and WPElement representation
			const html = '<blockquote><p>A delicious sundae dessert</p></blockquote>';
			const match = parse( html, children() );

			expect( wp.element.renderToString( match ) ).to.equal( html );
		} );
	} );
} );
