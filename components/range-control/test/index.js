/**
 * External dependencies
 */
import TestUtils from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import RangeControl from '../';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';

describe( 'RangeControl', () => {
	class TestWrapper extends Component {
		render() {
			return <RangeControl { ...this.props } />;
		}
	}

	const getWrapper = ( props = {} ) => TestUtils.renderIntoDocument(
		<TestWrapper { ...props } />
	);

	describe( '#render()', () => {
		it( 'triggers change callback with numeric value', () => {
			// Mount: With shallow, cannot find input child of BaseControl
			const onChange = jest.fn();
			const wrapper = getWrapper( { onChange } );

			const rangeInputElement = () => TestUtils.findRenderedDOMComponentWithClass(
				wrapper,
				'components-range-control__slider'
			);
			const numberInputElement = () => TestUtils.findRenderedDOMComponentWithClass(
				wrapper,
				'components-range-control__number'
			);
			TestUtils.Simulate.change(
				rangeInputElement(),
				{
					target: { value: '5' },
				}
			);
			TestUtils.Simulate.change(
				numberInputElement(),
				{
					target: { value: '10' },
				}
			);

			expect( onChange ).toHaveBeenCalledWith( 5 );
			expect( onChange ).toHaveBeenCalledWith( 10 );
		} );

		it( 'renders with icons', () => {
			let wrapper, icons;
			const iconElements = ( component ) => TestUtils
				.scryRenderedComponentsWithType( component, Dashicon );
			wrapper = getWrapper();
			icons = iconElements( wrapper );
			expect( icons ).toHaveLength( 0 );

			wrapper = getWrapper( { beforeIcon: 'format-image' } );
			icons = iconElements( wrapper );
			expect( icons ).toHaveLength( 1 );
			expect( icons[ 0 ].props.icon ).toBe( 'format-image' );

			wrapper = getWrapper(
				{
					beforeIcon: 'format-image',
					afterIcon: 'format-video',
				}
			);
			icons = iconElements( wrapper );
			expect( icons ).toHaveLength( 2 );
			expect( icons[ 0 ].props.icon ).toBe( 'format-image' );
			expect( icons[ 1 ].props.icon ).toBe( 'format-video' );
		} );
	} );
} );
