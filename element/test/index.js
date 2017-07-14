/**
 * Internal dependencies
 */
import { createElement, renderToString, switchChildrenNodeName } from '../';

describe( 'element', () => {
	describe( 'renderToString', () => {
		it( 'should return an empty string for a falsey value', () => {
			expect( renderToString() ).toBe( '' );
			expect( renderToString( false ) ).toBe( '' );
			expect( renderToString( null ) ).toBe( '' );
			expect( renderToString( 0 ) ).toBe( '' );
		} );

		it( 'should return a string verbatim', () => {
			expect( renderToString( 'Zucchini' ) ).toBe( 'Zucchini' );
		} );

		it( 'should return a string from an array', () => {
			expect( renderToString( [
				'Zucchini ',
				createElement( 'em', null, 'is a' ),
				' summer squash',
			] ) ).toBe( 'Zucchini <em>is a</em> summer squash' );
		} );

		it( 'should return a string from an element', () => {
			expect( renderToString(
				createElement( 'strong', null, 'Courgette' )
			) ).toBe( '<strong>Courgette</strong>' );
		} );
	} );

	describe( 'switchChildrenNodeName', () => {
		it( 'should return undefined for undefined children', () => {
			expect( switchChildrenNodeName() ).toBeUndefined();
		} );

		it( 'should switch strings', () => {
			const children = switchChildrenNodeName( [ 'a', 'b' ], 'strong' );
			expect( children.length ).toBe( 2 );
			expect( children[ 0 ].type ).toBe( 'strong' );
			expect( children[ 0 ].props.children ).toBe( 'a' );
			expect( children[ 1 ].type ).toBe( 'strong' );
			expect( children[ 1 ].props.children ).toBe( 'b' );
		} );

		it( 'should switch elements', () => {
			const children = switchChildrenNodeName( [
				createElement( 'strong', { align: 'left' }, 'Courgette' ),
				createElement( 'strong', {}, 'Concombre' ),
			], 'em' );
			expect( children.length ).toBe( 2 );
			expect( children[ 0 ].type ).toBe( 'em' );
			expect( children[ 0 ].props.children ).toBe( 'Courgette' );
			expect( children[ 0 ].props.align ).toBe( 'left' );
			expect( children[ 1 ].type ).toBe( 'em' );
			expect( children[ 1 ].props.children ).toBe( 'Concombre' );
		} );
	} );
} );
