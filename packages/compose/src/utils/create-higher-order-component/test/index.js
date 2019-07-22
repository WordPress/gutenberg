/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../';

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
