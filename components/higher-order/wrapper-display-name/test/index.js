/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import wrapperDisplayName from '../';

describe( 'wrapperDisplayName()', () => {
	it( 'should use default name for anonymous function', () => {
		expect( wrapperDisplayName( 'test', () => <div /> ) ).toBe( 'Test(Component)' );
	} );

	it( 'should use function name', () => {
		function SomeComponent() {
			return <div />;
		}

		expect( wrapperDisplayName( 'test', SomeComponent ) ).toBe( 'Test(SomeComponent)' );
	} );

	it( 'should use component class name', () => {
		class SomeComponent extends Component {
			render() {
				return <div />;
			}
		}

		expect( wrapperDisplayName( 'test', SomeComponent ) ).toBe( 'Test(SomeComponent)' );
	} );

	it( 'should use displayName property', () => {
		class SomeComponent extends Component {
			render() {
				return <div />;
			}
		}
		SomeComponent.displayName = 'CustomDisplayName';

		expect( wrapperDisplayName( 'test', SomeComponent ) ).toBe( 'Test(CustomDisplayName)' );
	} );
} );
