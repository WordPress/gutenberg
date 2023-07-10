/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NumberControl from '..';
import type { NumberControlProps } from '../types';

function expectInputToHaveEmptyStringValue( input: HTMLElement ) {
	// React Testing Library associates `null` to empty string types for
	// numeric `input` elements
	// (see https://github.com/testing-library/jest-dom/blob/v5.16.5/src/utils.js#L191-L192)
	return expect( input ).toHaveValue( null );
}

function ControlledNumberControl( {
	value: valueProp,
	onChange,
	...props
}: NumberControlProps ) {
	const [ value, setValue ] = useState( valueProp );
	const handleOnChange: NumberControlProps[ 'onChange' ] = ( v, extra ) => {
		setValue( v );
		onChange?.( v, extra );
	};

	return (
		<NumberControl
			{ ...props }
			value={ value }
			onChange={ handleOnChange }
		/>
	);
}

describe.each( [
	[ 'uncontrolled', NumberControl ],
	[ 'controlled', ControlledNumberControl ],
] )( 'NumberControl %s', ( ...modeAndComponent ) => {
	const [ mode, Component ] = modeAndComponent;

	describe( 'Basic rendering', () => {
		it( 'should render', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			await user.clear( input );
			await user.type( input, '14' );

			expect( input ).toBeVisible();
			expect( input ).toHaveValue( 14 );
		} );

		it( 'should render custom className', () => {
			render( <Component className="hello" /> );
			expect( screen.getByRole( 'spinbutton' ) ).toBeVisible();
		} );
	} );

	describe( 'onChange handling', () => {
		it( 'should provide onChange callback with number value', async () => {
			const user = userEvent.setup();
			const spy = jest.fn();

			render( <Component onChange={ ( v ) => spy( v ) } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.clear( input );
			await user.type( input, '10' );

			expect( spy ).toHaveBeenCalledWith( '10' );
		} );

		it( 'should call onChange callback when value is clamped on blur', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<Component
					min={ 4 }
					max={ 10 }
					onChange={ ( v, extra ) =>
						onChangeSpy(
							v,
							( extra.event.target as HTMLInputElement ).validity
								.valid
						)
					}
				/>
			);

			const input = screen.getByRole( 'spinbutton' );

			// Type `5`, a value in the min-max range.
			await user.clear( input );
			await user.type( input, '5' );

			// Before blurring, the value is still un-clamped
			expect( input ).toHaveValue( 5 );

			// Blur the input, make sure that the value remains unchanged.
			await user.keyboard( '[Tab]' );
			expect( input ).toHaveValue( 5 );

			// Type `1`, a value that is outside of the min-max range.
			await user.clear( input );
			await user.type( input, '1' );

			// Before blurring, the value is still un-clamped
			expect( input ).toHaveValue( 1 );

			// Blur the input, make sure that the value gets clamped.
			await user.keyboard( '[Tab]' );
			expect( input ).toHaveValue( 4 );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 4 );

			// First call: type `5`
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 1, '5', true );

			// TODO: why not another call that converts `'5'` to `5`, like in the next test?

			// Second call: clear the input
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 2, '', true );
			// Second call: type '1'
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 3, '1', false );
			// Third call: clamp value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 4, 4, true );
		} );

		it( 'should call onChange callback when value is not valid', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<Component
					min={ 1 }
					max={ 10 }
					onChange={ ( v, extra ) =>
						onChangeSpy(
							v,
							( extra.event.target as HTMLInputElement ).validity
								.valid
						)
					}
				/>
			);

			const input = screen.getByRole( 'spinbutton' );

			await user.clear( input );
			await user.type( input, '5' );

			expect( input ).toHaveValue( 5 );

			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 5 );

			await user.clear( input );
			await user.type( input, '14' );

			expect( input ).toHaveValue( 14 );

			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 10 );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 6 );

			// First call: type `5`
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 1, '5', true );
			// Second call: clear value
			// TODO: Why does this call happen?
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 2, 5, true );
			// Third call: clear value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 3, '', true );
			// Fourth call: valid, unclamped value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 4, '1', true );
			// Fifth call: invalid, unclamped value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 5, '14', false );
			// Sixth call: valid, clamped value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 6, 10, true );
		} );
	} );

	describe( 'Validation', () => {
		it( 'should clamp value within range on ENTER keypress', async () => {
			const user = userEvent.setup();

			render( <Component min={ 0 } max={ 10 } /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a value within the min-max range.
			// The value should not be clamped when pressing the ENTER key.
			await user.clear( input );
			await user.type( input, '5' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 5 );

			// Type a value below the min-max range.
			// The value should be clamped to [min] when pressing the ENTER key.
			await user.clear( input );
			await user.type( input, '-100' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 0 );

			// Type a value above the min-max range.
			// The value should be clamped to [max] when pressing the ENTER key.
			await user.clear( input );
			await user.type( input, '14' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 10 );
		} );

		it( 'should clamp value within range on blur', async () => {
			const user = userEvent.setup();

			render( <Component min={ 0 } max={ 10 } /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a value within the min-max range.
			// The value should not be clamped when blurring the input by clicking outside it.
			await user.clear( input );
			await user.type( input, '5' );
			await user.tab();

			expect( input ).toHaveValue( 5 );

			// Type a value below the min-max range.
			// The value should be clamped to [min] when pressing the ENTER key.
			await user.clear( input );
			await user.type( input, '-2' );
			await user.tab();

			expect( input ).toHaveValue( 0 );

			// Type a value above the min-max range.
			// The value should be clamped to [max] when pressing the ENTER key.
			// TODO: why does it not work if clamping to MIN before?
			// await user.clear( input );
			// await user.type( input, '41' );
			// await user.tab();

			// expect( input ).toHaveValue( 10 );
		} );

		// TODO: add min/max
		it( 'should parse non-numeric values on ENTER keypress when required', async () => {
			const user = userEvent.setup();

			render( <Component required /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a numeric value.
			// The value should be parsed as-is when pressing the ENTER key.
			await user.clear( input );
			await user.type( input, '5' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 5 );

			// Type a non-numeric value.
			// The value should be parsed to the default value when pressing the ENTER key.
			await user.clear( input );
			await user.type( input, 'abc' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 0 );
		} );

		// Todo: try with different min-max
		// Todo: try without writing a valid value first
		// Todo: should check the value before enter as well
		it( 'should parse non-numeric values to empty string on ENTER keypress when not required', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a value within the min-max range.
			// The value should be parsed as-is when pressing the ENTER key.
			await user.clear( input );
			await user.type( input, '5' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 5 );

			// Type a non-numeric value.
			// The value should be rejected (i.e not assigned) when pressing the ENTER key.
			await user.clear( input );
			await user.type( input, 'abc' );
			await user.keyboard( '[Enter]' );

			// Note: the `input` field may still visually show the invalid input,
			// while internally parsing the value as an empty string.
			expectInputToHaveEmptyStringValue( input );
		} );

		// TODO: investigate why it parses to empty string only when there's a valid value before
		it( 'should not enforce numerical value for empty string when required is omitted', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value, then press enter.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 5 );

			// Type a valid numeric value.
			await user.clear( input );
			await user.keyboard( '[Enter]' );

			expectInputToHaveEmptyStringValue( input );
		} );

		it( 'should enforce numerical value for empty string when required', async () => {
			const user = userEvent.setup();

			render( <Component required /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value, then press enter.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 5 );

			// Clear the input and submit.
			// The empty string value should be enforced to the default numeric value.
			await user.clear( input );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 0 );
		} );
	} );

	describe( 'Key UP interactions', () => {
		// Test expected values when incrementing / decrementing from empty values
		// When min/max are defined too!
		it( 'should fire onKeyDown callback', async () => {
			const user = userEvent.setup();

			const spy = jest.fn();

			render( <Component onKeyDown={ spy } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( spy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should increment by step on key UP press', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			expect( input ).toHaveValue( 5 );

			// Focus the input and press the up arrow to increment the value.
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( input ).toHaveValue( 6 );
		} );

		it( 'should increment from a negative value', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '-5' );

			expect( input ).toHaveValue( -5 );

			// Focus the input and press the up arrow to increment the value.
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( input ).toHaveValue( -4 );
		} );

		it( 'should increment while preserving the decimal value when `step` is “any”', async () => {
			const user = userEvent.setup();

			render( <Component step="any" /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '866.5309' );

			expect( input ).toHaveValue( 866.5309 );

			// Focus the input and press the up arrow to increment the value.
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( input ).toHaveValue( 867.5309 );
		} );

		it( 'should increment by default shiftStep on key UP + shift press', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			expect( input ).toHaveValue( 5 );

			// Focus the input and press the shift+up arrow to increment the value.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 20 );
		} );

		it( 'should increment by shiftStep while preserving the decimal value when `step` is “any”', async () => {
			const user = userEvent.setup();

			render( <Component step="any" /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '857.5309' );

			expect( input ).toHaveValue( 857.5309 );

			// Focus the input and press the shift+up arrow to increment the value.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 867.5309 );
		} );

		// Todo: why in this case it increments to `shiftStep`,
		// but in the default case it increments to `2 * shiftstep` ?
		it( 'should increment by custom shiftStep on key UP + shift press', async () => {
			const user = userEvent.setup();

			render( <Component shiftStep={ 100 } /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			expect( input ).toHaveValue( 5 );

			// Focus the input and press the shift+up arrow to increment the value.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 100 );
		} );

		it( 'should increment but be limited by max on shiftStep', async () => {
			const user = userEvent.setup();

			render( <Component shiftStep={ 100 } max={ 99 } /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			await user.clear( input );
			await user.type( input, '5' );

			expect( input ).toHaveValue( 5 );

			// Focus the input and press the shift+up arrow to increment the value,
			// which gets clamped by the value of `max`.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 99 );
		} );

		it( 'should not increment by shiftStep if disabled', async () => {
			const user = userEvent.setup();

			render(
				<Component shiftStep={ 100 } isShiftStepEnabled={ false } />
			);

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			expect( input ).toHaveValue( 5 );

			// Focus the input and press the shift+up arrow to increment the value,
			// but the "shift" is ignored, and therefore the value increments normally.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 6 );
		} );
	} );

	describe( 'Key DOWN interactions', () => {
		it( 'should fire onKeyDown callback', async () => {
			const user = userEvent.setup();
			const spy = jest.fn();

			render( <Component onKeyDown={ spy } /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			// Focus the input and press the down arrow to decrement the value.
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( spy ).toHaveBeenCalled();
		} );

		it( 'should decrement by step on key DOWN press', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			// Focus the input and press the down arrow to decrement the value.
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( input ).toHaveValue( 4 );
		} );

		it( 'should decrement from a negative value', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '-5' );

			// Focus the input and press the down arrow to decrement the value.
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( input ).toHaveValue( -6 );
		} );

		it( 'should decrement while preserving the decimal value when `step` is “any”', async () => {
			const user = userEvent.setup();

			render( <Component step="any" /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '868.5309' );

			// Focus the input and press the down arrow to decrement the value.
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( input ).toHaveValue( 867.5309 );
		} );

		it( 'should decrement by shiftStep on key DOWN + shift press', async () => {
			const user = userEvent.setup();

			render( <Component /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			// Focus the input and press the shift+down arrow to decrement the value.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( 0 );
		} );

		it( 'should decrement by shiftStep while preserving the decimal value when `step` is “any”', async () => {
			const user = userEvent.setup();

			render( <Component step="any" /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '877.5309' );

			// Focus the input and press the shift+down arrow to decrement the value.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( 867.5309 );
		} );

		it( 'should decrement by custom shiftStep on key DOWN + shift press', async () => {
			const user = userEvent.setup();

			render( <Component shiftStep={ 100 } /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			// Focus the input and press the shift+down arrow to decrement the value.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( -100 );
		} );

		it( 'should decrement but be limited by min on shiftStep', async () => {
			const user = userEvent.setup();

			render( <Component shiftStep={ 100 } min={ 4 } /> );

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			// Focus the input and press the shift+down arrow to decrement the value,
			// which gets clamped by the value of `min`.
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( 4 );
		} );

		it( 'should not decrement by shiftStep if disabled', async () => {
			const user = userEvent.setup();

			render(
				<Component shiftStep={ 100 } isShiftStepEnabled={ false } />
			);

			const input = screen.getByRole( 'spinbutton' );

			// Type a valid numeric value.
			// The value should be parsed correctly.
			await user.clear( input );
			await user.type( input, '5' );

			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( 4 );
		} );
	} );

	describe( 'custom spin buttons', () => {
		test.each( [
			undefined,
			'none',
			'native',
		] as NumberControlProps[ 'spinControls' ][] )(
			'should not appear when spinControls = %s',
			( spinControls ) => {
				render( <NumberControl spinControls={ spinControls } /> );
				expect(
					screen.queryByLabelText( 'Increment' )
				).not.toBeInTheDocument();
				expect(
					screen.queryByLabelText( 'Decrement' )
				).not.toBeInTheDocument();
			}
		);

		// Note: Custom spin buttons currently work only when the component is controlled.
		if ( mode === 'controlled' ) {
			test.each( [
				[ undefined, 'up', '1', {} ],
				[ '1', 'up', '2', {} ],
				[ '10', 'up', '12', { step: '2' } ],
				[ '10', 'up', '10', { max: 10 } ],
				[ undefined, 'down', '-1', {} ],
				[ '2', 'down', '1', {} ],
				[ '12', 'down', '10', { step: '2' } ],
				[ '10', 'down', '10', { min: 10 } ],
			] )(
				'should spin %s %s to %s when props = %o',
				async ( initialValue, direction, expectedValue, props ) => {
					const user = userEvent.setup();
					const onChange = jest.fn();
					render(
						<Component
							{ ...props }
							spinControls="custom"
							onChange={ onChange }
						/>
					);

					const input = screen.getByRole( 'spinbutton' );
					if ( initialValue !== undefined ) {
						await user.clear( input );
						await user.type( input, initialValue );
					}

					await user.click(
						screen.getByLabelText(
							direction === 'up' ? 'Increment' : 'Decrement'
						)
					);

					expect( onChange ).toHaveBeenCalledTimes(
						( initialValue ?? '' ).length + 1
					);
					expect( onChange ).toHaveBeenLastCalledWith(
						expectedValue,
						{
							event: expect.objectContaining( {
								target: input,
								type: expect.any( String ),
							} ),
						}
					);
				}
			);
		}
	} );
} );
