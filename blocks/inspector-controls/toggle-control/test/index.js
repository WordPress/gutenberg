/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import ToggleControl from '../';

describe( 'ToggleControl', () => {
	it( 'triggers change callback with numeric value', () => {
		// Mount: With shallow, cannot find input child of BaseControl
		const onChange = jest.fn();
		const wrapper = mount( <ToggleControl onChange={ onChange } /> );

		wrapper.find( 'input' ).simulate( 'change', { target: { checked: true } } );

		expect( onChange ).toHaveBeenCalledWith( true );
	} );
} );
