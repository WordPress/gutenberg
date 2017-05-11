/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { createElement, renderToString, concatChildren, switchChildrenNodeName } from '../';

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
				' summer squash',
			] ) ).to.equal( 'Zucchini <em>is a</em> summer squash' );
		} );

		it( 'should return a string from an element', () => {
			expect( renderToString(
				createElement( 'strong', null, 'Courgette' )
			) ).to.equal( '<strong>Courgette</strong>' );
		} );
	} );

	describe( 'concatChildren', () => {
		it( 'should return an empty array for undefined children', () => {
			expect( concatChildren() ).to.eql( [] );
		} );

		it( 'should concat the string arrays', () => {
			expect( concatChildren( [ 'a' ], 'b' ) ).to.eql( [ 'a', 'b' ] );
		} );

		it( 'should concat the object arrays and rewrite keys', () => {
			const concat = concatChildren(
				[ createElement( 'strong', {}, 'Courgette' ) ],
				createElement( 'strong', {}, 'Concombre' )
			);
			expect( concat.length ).to.equal( 2 );
			expect( concat[ 0 ].key ).to.equal( '0,0' );
			expect( concat[ 1 ].key ).to.equal( '1,0' );
		} );
	} );

	describe( 'switchChildrenNodeName', () => {
		it( 'should return undefined for undefined children', () => {
			expect( switchChildrenNodeName() ).to.be.undefined();
		} );

		it( 'should switch strings', () => {
			const children = switchChildrenNodeName( [ 'a', 'b' ], 'strong' );
			expect( children.length ).to.equal( 2 );
			expect( children[ 0 ].type ).to.equal( 'strong' );
			expect( children[ 0 ].props.children ).to.equal( 'a' );
			expect( children[ 1 ].type ).to.equal( 'strong' );
			expect( children[ 1 ].props.children ).to.equal( 'b' );
		} );

		it( 'should switch elements', () => {
			const children = switchChildrenNodeName( [
				createElement( 'strong', { align: 'left' }, 'Courgette' ),
				createElement( 'strong', {}, 'Concombre' )
			], 'em' );
			expect( children.length ).to.equal( 2 );
			expect( children[ 0 ].type ).to.equal( 'em' );
			expect( children[ 0 ].props.children ).to.equal( 'Courgette' );
			expect( children[ 0 ].props.align ).to.equal( 'left' );
			expect( children[ 1 ].type ).to.equal( 'em' );
			expect( children[ 1 ].props.children ).to.equal( 'Concombre' );
		} );
	} );
} );
