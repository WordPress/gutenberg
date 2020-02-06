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

describe( 'RangeControl', () => {
	class TestWrapper extends Component {
		render() {
			return <RangeControl { ...this.props } />;
		}
	}

	const getWrapper = ( props = {} ) =>
		TestUtils.renderIntoDocument( <TestWrapper { ...props } /> );

	describe( '#render()', () => {
		it( 'triggers change callback with numeric value', () => {
			// Mount: With shallow, cannot find input child of BaseControl
			const onChange = jest.fn();
			const wrapper = getWrapper( { onChange } );

			const rangeInputElement = () =>
				TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-range-control__slider'
				);
			const numberInputElement = () =>
				TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-range-control__number'
				);
			TestUtils.Simulate.change( rangeInputElement(), {
				target: {
					value: '5',
					checkValidity() {
						return true;
					},
				},
			} );
			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '10',
					checkValidity() {
						return true;
					},
				},
			} );

			expect( onChange ).toHaveBeenCalledWith( 5 );
			expect( onChange ).toHaveBeenCalledWith( 10 );
		} );

		it( 'renders with icons', () => {
			let wrapper, icons;
			const iconElements = ( component ) =>
				TestUtils.scryRenderedDOMComponentsWithTag( component, 'svg' );
			wrapper = getWrapper();
			icons = iconElements( wrapper );
			expect( icons ).toHaveLength( 0 );

			wrapper = getWrapper( { beforeIcon: 'image' } );
			icons = iconElements( wrapper );
			expect( icons ).toHaveLength( 1 );

			wrapper = getWrapper( {
				beforeIcon: 'image',
				afterIcon: 'video',
			} );
			icons = iconElements( wrapper );
			expect( icons ).toHaveLength( 2 );
		} );
	} );

	describe( 'validation', () => {
		it( 'does not calls onChange if the new value is lower than minimum', () => {
			// Mount: With shallow, cannot find input child of BaseControl
			const onChange = jest.fn();
			const wrapper = getWrapper( { onChange, min: 11, value: 12 } );

			const numberInputElement = () =>
				TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-range-control__number'
				);

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '10',
					checkValidity() {
						return false;
					},
				},
			} );

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'does not calls onChange if the new value is greater than maximum', () => {
			// Mount: With shallow, cannot find input child of BaseControl
			const onChange = jest.fn();
			const wrapper = getWrapper( { onChange, max: 20, value: 12 } );

			const numberInputElement = () =>
				TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-range-control__number'
				);

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '21',
					checkValidity() {
						return false;
					},
				},
			} );

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'calls onChange after invalid inputs if the new input is valid', () => {
			// Mount: With shallow, cannot find input child of BaseControl
			const onChange = jest.fn();
			const wrapper = getWrapper( {
				onChange,
				min: 11,
				max: 20,
				value: 12,
			} );

			const numberInputElement = () =>
				TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-range-control__number'
				);

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '10',
					checkValidity() {
						return false;
					},
				},
			} );

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '21',
					checkValidity() {
						return false;
					},
				},
			} );

			expect( onChange ).not.toHaveBeenCalled();

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '14',
					checkValidity() {
						return true;
					},
				},
			} );

			expect( onChange ).toHaveBeenCalledWith( 14 );
		} );

		it( 'validates when provided a max or min of zero', () => {
			const onChange = jest.fn();
			const wrapper = getWrapper( {
				onChange,
				min: -100,
				max: 0,
				value: 0,
			} );

			const numberInputElement = () =>
				TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-range-control__number'
				);

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '1',
					checkValidity() {
						return false;
					},
				},
			} );

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'validates when min and max are negative', () => {
			const onChange = jest.fn();
			const wrapper = getWrapper( {
				onChange,
				min: -100,
				max: -50,
				value: -60,
			} );

			const numberInputElement = () =>
				TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-range-control__number'
				);

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '-101',
					checkValidity() {
						return false;
					},
				},
			} );

			expect( onChange ).not.toHaveBeenCalled();

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '-49',
					checkValidity() {
						return false;
					},
				},
			} );

			expect( onChange ).not.toHaveBeenCalled();

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '-50',
					checkValidity() {
						return true;
					},
				},
			} );

			expect( onChange ).toHaveBeenCalledWith( -50 );
		} );
		it( 'takes into account the step starting from min', () => {
			const onChange = jest.fn();
			const wrapper = getWrapper( {
				onChange,
				min: 0.1,
				step: 0.125,
				value: 0.1,
			} );

			const numberInputElement = () =>
				TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-range-control__number'
				);

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '0.125',
					checkValidity() {
						return false;
					},
				},
			} );

			expect( onChange ).not.toHaveBeenCalled();

			TestUtils.Simulate.change( numberInputElement(), {
				target: {
					value: '0.225',
					checkValidity() {
						return true;
					},
				},
			} );

			expect( onChange ).toHaveBeenCalledWith( 0.225 );
		} );
	} );
} );
