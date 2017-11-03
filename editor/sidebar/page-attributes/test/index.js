/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PageAttributes } from '../';

describe( 'PageAttributes', () => {
	const postType = {
		data: {
			supports: {
				'page-attributes': true,
			},
		},
	};

	it( 'should not render anything if unknown page attributes support', () => {
		const wrapper = shallow( <PageAttributes postType={ {} } /> );

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should not render anything if no page attributes support', () => {
		const wrapper = shallow( <PageAttributes postType={ {
			data: {
				supports: {
					'page-attributes': false,
				},
			},
		} } /> );

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should render input if page attributes support', () => {
		const wrapper = shallow( <PageAttributes postType={ postType } /> );
		wrapper.setState( { supportsPageAttributes: true } );

		expect( wrapper.type() ).not.toBe( null );
	} );

	it( 'should reject invalid input', () => {
		const onUpdateOrder = jest.fn();
		const wrapper = shallow(
			<PageAttributes postType={ postType } onUpdateOrder={ onUpdateOrder } />
		);
		wrapper.setState( { supportsPageAttributes: true } );

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: -1,
			},
		} );

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: 'bad',
			},
		} );

		expect( onUpdateOrder ).not.toHaveBeenCalled();
	} );

	it( 'should update with valid input', () => {
		const onUpdateOrder = jest.fn();
		const wrapper = shallow(
			<PageAttributes postType={ postType } onUpdateOrder={ onUpdateOrder } />
		);
		wrapper.setState( { supportsPageAttributes: true } );

		wrapper.find( 'input' ).simulate( 'change', {
			target: {
				value: 4,
			},
		} );

		expect( onUpdateOrder ).toHaveBeenCalledWith( 4 );
	} );
} );
