/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { UnitRangeControl } from '../';

const props = {
	label: 'Unit + Range Control',
	value: '10px',
	onChange: jest.fn().mockImplementation( ( newValue ) => {
		props.value = newValue;
	} ),
};

const renderUnitRangeControl = ( customProps ) => {
	return render( <UnitRangeControl { ...{ ...props, ...customProps } } /> );
};

const rerenderUnitRangeControl = ( rerender, customProps ) => {
	return rerender( <UnitRangeControl { ...{ ...props, ...customProps } } /> );
};

describe( 'UnitRangeControl', () => {
	describe( 'basic rendering', () => {
		it( 'should render both unit and range controls', () => {
			renderUnitRangeControl();

			const label = screen.getByText( props.label );
			const unitControl = screen.getByRole( 'spinbutton' );
			const rangeControl = screen.getByRole( 'slider' );

			expect( label ).toBeInTheDocument();
			expect( unitControl ).toBeInTheDocument();
			expect( rangeControl ).toBeInTheDocument();
		} );

		it( 'should hide label', () => {
			renderUnitRangeControl( { hideLabelFromVision: true } );
			const label = screen.getByText( props.label );

			// As visually hidden labels are still included in the document
			// and do not have `display: none` styling, we can't rely on
			// `.toBeInTheDocument()` or `.toBeVisible()` assertions.
			expect( label ).toHaveAttribute(
				'data-wp-component',
				'VisuallyHidden'
			);
		} );
	} );

	describe( 'unit control', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should pass through unit control props', () => {
			renderUnitRangeControl( {
				unitControlProps: { placeholder: 'Test' },
			} );
			const unitControl = screen.getByRole( 'spinbutton' );

			expect( unitControl ).toHaveAttribute( 'placeholder', 'Test' );
		} );

		it( 'should update value via input and be reflected by slider', async () => {
			const { rerender } = renderUnitRangeControl();
			const unitControl = screen.getByRole( 'spinbutton' );
			unitControl.focus();
			fireEvent.change( unitControl, { target: { value: '100' } } );

			expect( props.onChange ).toHaveBeenNthCalledWith(
				1,
				'100px',
				expect.anything()
			);

			// Ensure UnitControl reflects updated value.
			rerenderUnitRangeControl( rerender );
			const rangeControl = screen.getByRole( 'slider' );

			expect( rangeControl.value ).toEqual( '100' );
		} );
	} );

	describe( 'range control', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should pass through range control props', () => {
			renderUnitRangeControl( { rangeControlProps: { max: 200 } } );
			const rangeControl = screen.getByRole( 'slider' );

			expect( rangeControl ).toHaveAttribute( 'max', '200' );
		} );

		it( 'should update value via slider and be reflected by unit control', async () => {
			const { rerender } = renderUnitRangeControl();
			const slider = screen.getByRole( 'slider' );
			fireEvent.change( slider, { target: { value: '5' } } );

			expect( props.onChange ).toHaveBeenNthCalledWith( 1, '5px' );

			rerenderUnitRangeControl( rerender );
			const unitControl = screen.getByRole( 'spinbutton' );

			expect( unitControl.value ).toEqual( '5' );
		} );
	} );
} );
