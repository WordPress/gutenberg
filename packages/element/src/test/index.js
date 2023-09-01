/* eslint-disable testing-library/render-result-naming-convention */

/**
 * Internal dependencies
 */
import {
	concatChildren,
	createElement,
	RawHTML,
	renderToString,
	switchChildrenNodeName,
} from '../';

describe( 'element', () => {
	describe( 'renderToString', () => {
		it( 'should return an empty string for booleans/null/undefined values', () => {
			expect( renderToString() ).toBe( '' );
			expect( renderToString( false ) ).toBe( '' );
			expect( renderToString( true ) ).toBe( '' );
			expect( renderToString( null ) ).toBe( '' );
		} );

		it( 'should return a string 0', () => {
			expect( renderToString( 0 ) ).toBe( '0' );
		} );

		it( 'should return a string 12345', () => {
			expect( renderToString( 12345 ) ).toBe( '12345' );
		} );

		it( 'should return a string verbatim', () => {
			expect( renderToString( 'Zucchini' ) ).toBe( 'Zucchini' );
		} );

		it( 'should return a string from an array', () => {
			expect(
				renderToString( [
					'Zucchini ',
					createElement( 'em', null, 'is a' ),
					' summer squash',
				] )
			).toBe( 'Zucchini <em>is a</em> summer squash' );
		} );

		it( 'should return a string from an element', () => {
			expect(
				renderToString( createElement( 'strong', null, 'Courgette' ) )
			).toBe( '<strong>Courgette</strong>' );
		} );

		it( 'should escape attributes and html', () => {
			const result = renderToString(
				createElement(
					'a',
					{
						href: '/index.php?foo=bar&qux=<"scary">',
						style: {
							backgroundColor: 'red',
						},
					},
					'<"WordPress" & Friends>'
				)
			);

			expect( result ).toBe(
				'<a href="/index.php?foo=bar&amp;qux=<&quot;scary&quot;&gt;" style="background-color:red">' +
					'&lt;"WordPress" &amp; Friends>' +
					'</a>'
			);
		} );

		it( 'strips raw html wrapper', () => {
			const html = '<p>So scary!</p>';

			expect( renderToString( <RawHTML>{ html }</RawHTML> ) ).toBe(
				html
			);
		} );
	} );

	describe( 'concatChildren', () => {
		it( 'should return an empty array for undefined children', () => {
			expect( concatChildren() ).toEqual( [] );
		} );

		it( 'should concat the string arrays', () => {
			expect( concatChildren( [ 'a' ], 'b' ) ).toEqual( [ 'a', 'b' ] );
		} );

		it( 'should concat the object arrays and rewrite keys', () => {
			const concat = concatChildren(
				[ createElement( 'strong', {}, 'Courgette' ) ],
				createElement( 'strong', {}, 'Concombre' )
			);
			expect( concat ).toHaveLength( 2 );
			expect( concat[ 0 ].key ).toBe( '0,0' );
			expect( concat[ 1 ].key ).toBe( '1,0' );
		} );
	} );

	describe( 'switchChildrenNodeName', () => {
		it( 'should return undefined for undefined children', () => {
			expect( switchChildrenNodeName() ).toBeUndefined();
		} );

		it( 'should switch strings', () => {
			const children = switchChildrenNodeName( [ 'a', 'b' ], 'strong' );
			expect( children ).toHaveLength( 2 );
			expect( children[ 0 ].type ).toBe( 'strong' );
			expect( children[ 0 ].props.children ).toBe( 'a' );
			expect( children[ 1 ].type ).toBe( 'strong' );
			expect( children[ 1 ].props.children ).toBe( 'b' );
		} );

		it( 'should switch elements', () => {
			const children = switchChildrenNodeName(
				[
					createElement( 'strong', { align: 'left' }, 'Courgette' ),
					createElement( 'strong', {}, 'Concombre' ),
				],
				'em'
			);
			expect( children ).toHaveLength( 2 );
			expect( children[ 0 ].type ).toBe( 'em' );
			expect( children[ 0 ].props.children ).toBe( 'Courgette' );
			expect( children[ 0 ].props.align ).toBe( 'left' );
			expect( children[ 1 ].type ).toBe( 'em' );
			expect( children[ 1 ].props.children ).toBe( 'Concombre' );
		} );
	} );
} );

/* eslint-enable testing-library/render-result-naming-convention */
