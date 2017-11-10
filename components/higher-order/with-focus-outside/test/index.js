/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFocusOutside from '../';

jest.useFakeTimers();

describe( 'withFocusOutside', () => {
	const EnhancedComponent = withFocusOutside(
		class extends Component {
			handleFocusOutside() {
				this.props.onFocusOutside();
			}

			render() {
				return (
					<div>
						<input />
						<input />
					</div>
				);
			}
		}
	);

	it( 'should not call handler if focus shifts to element within component', () => {
		const callback = jest.fn();
		const wrapper = mount( <EnhancedComponent onFocusOutside={ callback } /> );

		wrapper.find( 'input' ).at( 0 ).simulate( 'focus' );
		wrapper.find( 'input' ).at( 0 ).simulate( 'blur' );
		wrapper.find( 'input' ).at( 1 ).simulate( 'focus' );

		jest.runAllTimers();

		expect( callback ).not.toHaveBeenCalled();
	} );

	it( 'should call handler if focus doesn\'t shift to element within component', () => {
		const callback = jest.fn();
		const wrapper = mount( <EnhancedComponent onFocusOutside={ callback } /> );

		wrapper.find( 'input' ).at( 0 ).simulate( 'focus' );
		wrapper.find( 'input' ).at( 0 ).simulate( 'blur' );

		jest.runAllTimers();

		expect( callback ).toHaveBeenCalled();
	} );

	it( 'should cancel check when unmounting while queued', () => {
		const callback = jest.fn();
		const wrapper = mount( <EnhancedComponent onFocusOutside={ callback } /> );

		wrapper.find( 'input' ).at( 0 ).simulate( 'focus' );
		wrapper.find( 'input' ).at( 0 ).simulate( 'blur' );
		wrapper.unmount();

		jest.runAllTimers();

		expect( callback ).not.toHaveBeenCalled();
	} );
} );
