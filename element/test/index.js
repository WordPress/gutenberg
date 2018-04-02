/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import {
	Component,
	createElement,
	concatChildren,
	renderToString,
	switchChildrenNodeName,
	getWrapperDisplayName,
	RawHTML,
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

		it( 'should escape attributes and html', () => {
			const result = renderToString( createElement( 'a', {
				href: '/index.php?foo=bar&qux=<"scary">',
				style: {
					backgroundColor: 'red',
				},
			}, '&copy (sic) &#169; &copy; 2018 <"WordPress" & Friends>' ) );

			expect( result ).toBe(
				'<a href="/index.php?foo=bar&amp;qux=<&quot;scary&quot;>" style="background-color:red">' +
				'&amp;copy (sic) &#169; &copy; 2018 &lt;"WordPress" &amp; Friends>' +
				'</a>'
			);
		} );

		it( 'strips raw html wrapper', () => {
			const html = '<p>So scary!</p>';

			expect( renderToString(
				<RawHTML>{ html }</RawHTML>,
			) ).toBe( html );
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
			const children = switchChildrenNodeName( [
				createElement( 'strong', { align: 'left' }, 'Courgette' ),
				createElement( 'strong', {}, 'Concombre' ),
			], 'em' );
			expect( children ).toHaveLength( 2 );
			expect( children[ 0 ].type ).toBe( 'em' );
			expect( children[ 0 ].props.children ).toBe( 'Courgette' );
			expect( children[ 0 ].props.align ).toBe( 'left' );
			expect( children[ 1 ].type ).toBe( 'em' );
			expect( children[ 1 ].props.children ).toBe( 'Concombre' );
		} );
	} );

	describe( 'getWrapperDisplayName()', () => {
		it( 'should use default name for anonymous function', () => {
			expect( getWrapperDisplayName( () => <div />, 'test' ) ).toBe( 'Test(Component)' );
		} );

		it( 'should use camel case starting with upper for wrapper prefix ', () => {
			expect( getWrapperDisplayName( () => <div />, 'one-two_threeFOUR' ) ).toBe( 'OneTwoThreeFour(Component)' );
		} );

		it( 'should use function name', () => {
			function SomeComponent() {
				return <div />;
			}

			expect( getWrapperDisplayName( SomeComponent, 'test' ) ).toBe( 'Test(SomeComponent)' );
		} );

		it( 'should use component class name', () => {
			class SomeComponent extends Component {
				render() {
					return <div />;
				}
			}

			expect( getWrapperDisplayName( SomeComponent, 'test' ) ).toBe( 'Test(SomeComponent)' );
		} );

		it( 'should use displayName property', () => {
			class SomeComponent extends Component {
				render() {
					return <div />;
				}
			}
			SomeComponent.displayName = 'CustomDisplayName';

			expect( getWrapperDisplayName( SomeComponent, 'test' ) ).toBe( 'Test(CustomDisplayName)' );
		} );
	} );

	describe( 'RawHTML', () => {
		it( 'is dangerous', () => {
			const html = '<p>So scary!</p>';
			const element = shallow(
				<RawHTML>
					{ html }
				</RawHTML>
			);

			expect( element.type() ).toBe( 'wp-raw-html' );
			expect( element.prop( 'dangerouslySetInnerHTML' ).__html ).toBe( html );
			expect( element.prop( 'children' ) ).toBe( undefined );
		} );

		it( 'creates wrapper if assigned other props', () => {
			const html = '<p>So scary!</p>';
			const element = shallow(
				<RawHTML className="foo">
					{ html }
				</RawHTML>
			);

			expect( element.type() ).toBe( 'div' );
			expect( element.prop( 'className' ) ).toBe( 'foo' );
			expect( element.prop( 'dangerouslySetInnerHTML' ).__html ).toBe( html );
			expect( element.prop( 'children' ) ).toBe( undefined );
		} );
	} );
} );
