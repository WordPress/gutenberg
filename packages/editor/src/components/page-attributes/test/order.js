/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { PageAttributesOrder } from '../order';

describe( 'PageAttributesOrder', () => {
	it( 'should reject invalid input', () => {
		const onUpdateOrder = jest.fn();
		const wrapper = mount(
			<PageAttributesOrder onUpdateOrder={ onUpdateOrder } />
		);

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: 'bad',
			},
		} );

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: '----+++',
			},
		} );

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: '-',
			},
		} );

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: '+',
			},
		} );

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: '',
			},
		} );

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: ' ',
			},
		} );

		expect( onUpdateOrder ).not.toHaveBeenCalled();
	} );

	it( 'should update with zero input', () => {
		const onUpdateOrder = jest.fn();
		const wrapper = mount(
			<PageAttributesOrder onUpdateOrder={ onUpdateOrder } />
		);

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: 0,
			},
		} );

		expect( onUpdateOrder ).toHaveBeenCalledWith( 0 );
	} );

	it( 'should update with valid positive input', () => {
		const onUpdateOrder = jest.fn();
		const wrapper = mount(
			<PageAttributesOrder onUpdateOrder={ onUpdateOrder } />
		);

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: '4',
			},
		} );

		expect( onUpdateOrder ).toHaveBeenCalledWith( 4 );
	} );

	it( 'should update with valid negative input', () => {
		const onUpdateOrder = jest.fn();
		const wrapper = mount(
			<PageAttributesOrder onUpdateOrder={ onUpdateOrder } />
		);

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: '-1',
			},
		} );

		expect( onUpdateOrder ).toHaveBeenCalledWith( -1 );
	} );
} );
