/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { createElement, renderToString } from '../';

describe( 'element', () => {
	describe( 'renderToString', () => {
		it( 'should return an empty string for a falsey value', () => {
			expect( renderToString() ).to.equal( '' );
			expect( renderToString( false ) ).to.equal( '' );
			expect( renderToString( null ) ).to.equal( '' );
			expect( renderToString( 0 ) ).to.equal( '' );
		} );

		it( 'should return a string verbatim', () => {
			expect( renderToString( 'Zucchini' ) ).to.equal( 'Zucchini' );
		} );

		it( 'should return a string from an array', () => {
			expect( renderToString( [
				'Zucchini ',
				createElement( 'em', null, 'is a' ),
				' summer squash'
			] ) ).to.equal( 'Zucchini <em>is a</em> summer squash' );
		} );

		it( 'should return a string from an element', () => {
			expect( renderToString(
				createElement( 'strong', null, 'Courgette' )
			) ).to.equal( '<strong>Courgette</strong>' );
		} );
	} );
} );
