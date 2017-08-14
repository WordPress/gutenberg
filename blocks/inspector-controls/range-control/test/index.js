/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import RangeControl from '../';

describe( 'RangeControl', () => {
	describe( '#render()', () => {
		it( 'triggers change callback with numeric value', () => {
			// Mount: With shallow, cannot find input child of BaseControl
			const onChange = jest.fn();
			const wrapper = mount( <RangeControl onChange={ onChange } /> );

			wrapper.find( 'input.blocks-range-control__slider' ).simulate( 'change', { target: { value: '5' } } );

			expect( onChange ).toHaveBeenCalledWith( 5 );
		} );
	} );
} );
