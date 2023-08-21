/**
 * External dependencies
 */
import { act, fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import RangeControl from '../';

const getRangeInput = (): HTMLInputElement => screen.getByRole( 'slider' );
const getNumberInput = (): HTMLInputElement => screen.getByRole( 'spinbutton' );
const getResetButton = (): HTMLButtonElement => screen.getByRole( 'button' );

const fireChangeEvent = ( input: HTMLInputElement, value?: number | string ) =>
	fireEvent.change( input, { target: { value } } );

describe( 'RangeControl', () => {
	describe( '#render()', () => {
		it( 'should trigger change callback with numeric value', () => {
			const onChange = jest.fn();

			render( <RangeControl onChange={ onChange } /> );

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			act( () => rangeInput.focus() );
			fireChangeEvent( rangeInput, '5' );

			act( () => numberInput.focus() );
			fireChangeEvent( numberInput, '10' );

			expect( onChange ).toHaveBeenCalledWith( 5 );
			expect( onChange ).toHaveBeenCalledWith( 10 );
		} );

		it( 'should render with icons', () => {
			const { container } = render(
				<RangeControl
					beforeIcon="format-image"
					afterIcon="format-video"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const beforeIcon = container.querySelector(
				'.dashicons-format-image'
			);
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const afterIcon = container.querySelector(
				'.dashicons-format-video'
			);

			expect( beforeIcon ).toBeInTheDocument();
			expect( afterIcon ).toBeInTheDocument();
		} );
	} );

	describe( 'validation', () => {
		it( 'should not apply if new value is lower than minimum', () => {
			render( <RangeControl min={ 11 } /> );

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			fireChangeEvent( numberInput, '10' );
			fireEvent.blur( numberInput );

			expect( rangeInput.value ).not.toBe( '10' );
		} );

		it( 'should not apply if new value is greater than maximum', () => {
			render( <RangeControl max={ 20 } /> );

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			fireChangeEvent( numberInput, '21' );
			fireEvent.blur( numberInput );

			expect( rangeInput.value ).not.toBe( '21' );
		} );

		it( 'should not call onChange if new value is invalid', () => {
			const onChange = jest.fn();
			render(
				<RangeControl onChange={ onChange } min={ 10 } max={ 20 } />
			);

			const numberInput = getNumberInput();

			act( () => numberInput.focus() );
			fireChangeEvent( numberInput, '25e' );

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'should keep invalid values in number input until loss of focus', () => {
			const onChange = jest.fn();
			render(
				<RangeControl onChange={ onChange } min={ -1 } max={ 1 } />
			);

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			act( () => numberInput.focus() );
			fireChangeEvent( numberInput, '-1.1' );

			expect( numberInput.value ).toBe( '-1.1' );
			expect( rangeInput.value ).toBe( '-1' );

			fireEvent.blur( numberInput );
			expect( onChange ).toHaveBeenCalledWith( -1 );
			expect( numberInput.value ).toBe( '-1' );
		} );

		it( 'should validate when provided a max or min of zero', () => {
			render( <RangeControl min={ -100 } max={ 0 } /> );

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			act( () => numberInput.focus() );
			fireChangeEvent( numberInput, '1' );
			fireEvent.blur( numberInput );

			expect( rangeInput.value ).toBe( '0' );
		} );

		it( 'should validate when min and max are negative', () => {
			render( <RangeControl min={ -100 } max={ -50 } /> );

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			act( () => numberInput.focus() );

			fireChangeEvent( numberInput, '-101' );
			expect( rangeInput.value ).toBe( '-100' );

			fireChangeEvent( numberInput, '-49' );
			expect( rangeInput.value ).toBe( '-50' );

			fireChangeEvent( numberInput, '-50' );
			expect( rangeInput.value ).toBe( '-50' );
		} );

		it( 'should take into account the step starting from min', () => {
			const onChange = jest.fn();
			render(
				<RangeControl
					onChange={ onChange }
					min={ 0.1 }
					step={ 0.125 }
				/>
			);

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			act( () => numberInput.focus() );
			fireChangeEvent( numberInput, '0.125' );

			expect( onChange ).toHaveBeenCalledWith( 0.125 );
			expect( rangeInput.value ).toBe( '0.125' );

			fireChangeEvent( numberInput, '0.225' );

			expect( onChange ).toHaveBeenCalledWith( 0.225 );
			expect( rangeInput.value ).toBe( '0.225' );
		} );
	} );

	describe( 'initialPosition / value', () => {
		it( 'should render initial rendered value of 50% of min/max, if no initialPosition or value is defined', () => {
			render( <RangeControl min={ 0 } max={ 10 } /> );

			const rangeInput = getRangeInput();

			expect( rangeInput.value ).toBe( '5' );
		} );

		it( 'should render initialPosition if no value is provided', () => {
			render( <RangeControl initialPosition={ 50 } /> );

			const rangeInput = getRangeInput();

			expect( rangeInput.value ).toBe( '50' );
		} );

		it( 'should render value instead of initialPosition is provided', () => {
			render( <RangeControl initialPosition={ 50 } value={ 10 } /> );

			const rangeInput = getRangeInput();

			expect( rangeInput.value ).toBe( '10' );
		} );

		it( 'should clamp initialPosition between min and max on first render, and on reset', () => {
			render(
				<RangeControl
					initialPosition={ 200 }
					min={ 0 }
					max={ 100 }
					allowReset
				/>
			);

			const numberInput = getNumberInput();
			const rangeInput = getRangeInput();
			const resetButton = getResetButton();

			// Value should be clamped on initial load
			expect( numberInput.value ).toBe( '100' );
			expect( rangeInput.value ).toBe( '100' );

			fireChangeEvent( numberInput, '50' );

			expect( numberInput.value ).toBe( '50' );
			expect( rangeInput.value ).toBe( '50' );

			// Value should be clamped after resetting
			fireEvent.click( resetButton );

			expect( numberInput.value ).toBe( '100' );
			expect( rangeInput.value ).toBe( '100' );
		} );
	} );

	describe( 'input field', () => {
		it( 'should render an input field by default', () => {
			render( <RangeControl /> );

			const numberInput = getNumberInput();

			expect( numberInput ).toBeInTheDocument();
		} );

		it( 'should not render an input field, if disabled', () => {
			render( <RangeControl withInputField={ false } /> );

			const numberInput = screen.queryByRole( 'spinbutton' );

			expect( numberInput ).not.toBeInTheDocument();
		} );

		it( 'should render a zero value into input range and field', () => {
			render( <RangeControl value={ 0 } /> );

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			expect( rangeInput.value ).toBe( '0' );
			expect( numberInput.value ).toBe( '0' );
		} );

		it( 'should update both field and range on change', () => {
			render( <RangeControl /> );

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			act( () => rangeInput.focus() );
			fireChangeEvent( rangeInput, 13 );

			expect( rangeInput.value ).toBe( '13' );
			expect( numberInput.value ).toBe( '13' );

			act( () => numberInput.focus() );
			fireChangeEvent( numberInput, 7 );

			expect( rangeInput.value ).toBe( '7' );
			expect( numberInput.value ).toBe( '7' );
		} );

		it( 'should reset input values if next value is removed', () => {
			render( <RangeControl /> );

			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			fireChangeEvent( numberInput, '' );
			fireEvent.blur( numberInput );

			// Reset to 50. Median value of min: 0, max: 100.
			expect( rangeInput.value ).toBe( '50' );
			// Input field should be blank.
			expect( numberInput.value ).toBe( '' );
		} );
	} );

	describe( 'reset', () => {
		it( 'should reset to a custom fallback value, defined by a parent component', () => {
			const spy = jest.fn();
			render(
				<RangeControl
					initialPosition={ 10 }
					allowReset={ true }
					onChange={ spy }
					resetFallbackValue={ 33 }
				/>
			);

			const resetButton = getResetButton();
			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			fireEvent.click( resetButton );

			expect( rangeInput.value ).toBe( '33' );
			expect( numberInput.value ).toBe( '33' );
			expect( spy ).toHaveBeenCalledWith( 33 );
		} );

		it( 'should reset to a 50% of min/max value, of no initialPosition or value is defined', () => {
			render(
				<RangeControl
					initialPosition={ undefined }
					min={ 0 }
					max={ 100 }
					allowReset={ true }
					resetFallbackValue={ undefined }
				/>
			);

			const resetButton = getResetButton();
			const rangeInput = getRangeInput();
			const numberInput = getNumberInput();

			fireEvent.click( resetButton );

			expect( rangeInput.value ).toBe( '50' );
			expect( numberInput.value ).toBe( '' );
		} );
	} );
} );
