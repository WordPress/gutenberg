/**
 * Internal dependencies
 */
import {
	Component,
	createElement,
	createHigherOrderComponent,
	concatChildren,
	switchChildrenNodeName,
} from '../';

describe( 'element', () => {
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

	describe( 'createHigherOrderComponent', () => {
		it( 'should use default name for anonymous function', () => {
			const TestComponent = createHigherOrderComponent(
				( OriginalComponent ) => OriginalComponent,
				'withTest'
			)( () => <div /> );

			expect( TestComponent.displayName ).toBe( 'WithTest(Component)' );
		} );

		it( 'should use camel case starting with upper for wrapper prefix ', () => {
			const TestComponent = createHigherOrderComponent(
				( OriginalComponent ) => OriginalComponent,
				'with-one-two_threeFOUR'
			)( () => <div /> );

			expect( TestComponent.displayName ).toBe( 'WithOneTwoThreeFour(Component)' );
		} );

		it( 'should use function name', () => {
			function SomeComponent() {
				return <div />;
			}
			const TestComponent = createHigherOrderComponent(
				( OriginalComponent ) => OriginalComponent,
				'withTest'
			)( SomeComponent );

			expect( TestComponent.displayName ).toBe( 'WithTest(SomeComponent)' );
		} );

		it( 'should use component class name', () => {
			class SomeAnotherComponent extends Component {
				render() {
					return <div />;
				}
			}
			const TestComponent = createHigherOrderComponent(
				( OriginalComponent ) => OriginalComponent,
				'withTest'
			)( SomeAnotherComponent );

			expect( TestComponent.displayName ).toBe( 'WithTest(SomeAnotherComponent)' );
		} );

		it( 'should use displayName property', () => {
			class SomeYetAnotherComponent extends Component {
				render() {
					return <div />;
				}
			}
			SomeYetAnotherComponent.displayName = 'CustomDisplayName';
			const TestComponent = createHigherOrderComponent(
				( OriginalComponent ) => OriginalComponent,
				'withTest'
			)( SomeYetAnotherComponent );

			expect( TestComponent.displayName ).toBe( 'WithTest(CustomDisplayName)' );
		} );
	} );
} );
