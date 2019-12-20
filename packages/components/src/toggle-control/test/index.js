/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import ToggleControl from '../';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

// this is needed because TestUtils does not accept a stateless component.
// anything run through a HOC ends up as a stateless component.
const getTestComponent = ( WrappedComponent, props ) => {
	class TestComponent extends Component {
		render() {
			return <WrappedComponent { ...this.props } />;
		}
	}
	return <TestComponent { ...props } />;
};

describe( 'ToggleControl', () => {
	it( 'triggers change callback with numeric value', () => {
		// Mount: With shallow, cannot find input child of BaseControl
		const onChange = jest.fn();
		const wrapper = renderer.create(
			getTestComponent( ToggleControl, { onChange } )
		);
		wrapper.root.findByType( 'input' ).props.onChange( { target: { checked: true } } );

		expect( onChange ).toHaveBeenCalledWith( true );
	} );

	describe( 'help', () => {
		it( 'does not render input with describedby if no help prop', () => {
			// Mount: With shallow, cannot find input child of BaseControl
			const onChange = jest.fn();
			const wrapper = renderer.create(
				getTestComponent( ToggleControl, { onChange } )
			);

			const input = wrapper.root.findByType( 'input' );

			expect( input.props[ 'aria-describedby' ] ).toBeUndefined();
		} );

		it( 'renders input with describedby if help prop', () => {
			// Mount: With shallow, cannot find input child of BaseControl
			const onChange = jest.fn();
			const wrapper = renderer.create(
				getTestComponent( ToggleControl, { help: true, onChange } )
			);

			const input = wrapper.root.findByType( 'input' );

			expect( input.props[ 'aria-describedby' ] ).toMatch( /^inspector-toggle-control-.*__help$/ );
		} );
	} );
} );
