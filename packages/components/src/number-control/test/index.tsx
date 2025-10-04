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
import _NumberControl from '..';
import type { NumberControlProps } from '../types';

const NumberControl = (
	props: React.ComponentProps< typeof _NumberControl >
) => <_NumberControl __next40pxDefaultSize { ...props } />;

function StatefulNumberControl( props: NumberControlProps ) {
	const [ value, setValue ] = useState( props.value );
	const handleOnChange = ( v: string | undefined ) => setValue( v );

	return (
		<NumberControl
			{ ...props }
			value={ value }
			onChange={ handleOnChange }
		/>
	);
}

describe( 'NumberControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			render( <NumberControl /> );
			expect( screen.getByRole( 'spinbutton' ) ).toBeVisible();
		} );

		it( 'should render custom className', () => {
			const { container: withoutClassName } = render( <NumberControl /> );

			const { container: withClassName } = render(
				<NumberControl className="hello" />
			);

			expect(
				// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
				withoutClassName.querySelector( '.components-number-control' )
			).not.toHaveClass( 'hello' );

			expect(
				// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
				withClassName.querySelector( '.components-number-control' )
			).toHaveClass( 'hello' );
		} );
	} );

	describe( 'onChange handling', () => {
		it( 'should provide onChange callback with number value', async () => {
			const user = userEvent.setup();
			const spy = jest.fn();

			render(
				<NumberControl value={ 5 } onChange={ ( v ) => spy( v ) } />
			);

			const input = screen.getByRole( 'spinbutton' );
			await user.clear( input );
			await user.type( input, '10' );

			expect( spy ).toHaveBeenCalledWith( '10' );
		} );

		it( 'should call onChange callback when value is clamped on blur', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<NumberControl
					value={ 5 }
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

			await user.clear( input );
			await user.type( input, '1' );

			// Before blurring, the value is still un-clamped
			expect( input ).toHaveValue( 1 );

			// Blur the input
			await user.keyboard( '[Tab]' );

			// After blur, value is clamped
			expect( input ).toHaveValue( 4 );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 3 );

			// First call: clear the input
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 1, '', true );
			// Second call: type '1'
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 2, '1', false );
			// Third call: clamp value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 3, '4', true );
		} );

		it( 'should call onChange callback when value is not valid', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<NumberControl
					value={ 5 }
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
			await user.type( input, '14' );

			expect( input ).toHaveValue( 14 );

			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 10 );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 4 );

			// First call: clear value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 1, '', true );
			// Second call: valid, unclamped value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 2, '1', true );
			// Third call: invalid, unclamped value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 3, '14', false );
			// Fourth call: valid, clamped value
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 4, '10', true );
		} );
	} );

	describe( 'Validation', () => {
		it( 'should clamp value within range on ENTER keypress', async () => {
			const user = userEvent.setup();

			render( <NumberControl value={ 5 } min={ 0 } max={ 10 } /> );

			const input = screen.getByRole( 'spinbutton' );

			await user.clear( input );
			await user.type( input, '-100' );
			await user.keyboard( '[Enter]' );

			/**
			 * This is zero because the value has been adjusted to
			 * respect the min/max range of the input.
			 */
			expect( input ).toHaveValue( 0 );
		} );

		it( 'should clamp value within range on blur', async () => {
			const user = userEvent.setup();

			render( <NumberControl value={ 5 } min={ 0 } max={ 10 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.clear( input );
			await user.type( input, '41' );

			// Before blurring, the value is still un-clamped
			expect( input ).toHaveValue( 41 );

			// Blur the input
			await user.click( document.body );

			// After blur, value is clamped
			expect( input ).toHaveValue( 10 );
		} );

		it( 'should parse non-numeric values to a number on ENTER keypress when required', async () => {
			const user = userEvent.setup();

			render( <NumberControl value={ 5 } required /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.clear( input );
			await user.type( input, 'abc' );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 0 );
		} );

		it( 'should parse non-numeric values to empty string on ENTER keypress when not required', async () => {
			const user = userEvent.setup();

			render( <NumberControl value={ 5 } required={ false } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.clear( input );
			await user.type( input, 'abc' );
			await user.keyboard( '[Enter]' );

			// Note: the `input` field may still visually show the invalid input,
			// while internally parsing the value as an empty string.
			//
			// React Testing Library associates `null` to empty string types for
			// numeric `input` elements
			// (see https://github.com/testing-library/jest-dom/blob/v5.16.5/src/utils.js#L191-L192)
			expect( input ).toHaveValue( null );
		} );

		it( 'should not enforce numerical value for empty string when required is omitted', async () => {
			const user = userEvent.setup();

			render( <NumberControl value={ 5 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.clear( input );
			await user.keyboard( '[Enter]' );

			// React Testing Library associates `null` to empty string types for
			// numeric `input` elements
			// (see https://github.com/testing-library/jest-dom/blob/v5.16.5/src/utils.js#L191-L192)
			expect( input ).toHaveValue( null );
		} );

		it( 'should enforce numerical value for empty string when required', async () => {
			const user = userEvent.setup();

			render( <NumberControl value={ 5 } required /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.clear( input );
			await user.keyboard( '[Enter]' );

			expect( input ).toHaveValue( 0 );
		} );
	} );

	describe( 'Key UP interactions', () => {
		it( 'should fire onKeyDown callback', async () => {
			const user = userEvent.setup();

			const spy = jest.fn();

			render( <StatefulNumberControl value={ 5 } onKeyDown={ spy } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( spy ).toHaveBeenCalled();
		} );

		it( 'should increment by step on key UP press', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 5 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( input ).toHaveValue( 6 );
		} );

		it( 'should increment from a negative value', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ -5 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( input ).toHaveValue( -4 );
		} );

		it( 'should increment while preserving the decimal value when `step` is “any”', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 866.5309 } step="any" /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( input ).toHaveValue( 867.5309 );
		} );

		it( 'should increment by step multiplied by spinFactor when spinFactor is provided', async () => {
			const user = userEvent.setup();

			render(
				<StatefulNumberControl
					step={ 0.01 }
					spinFactor={ 10 }
					value={ 1.65 }
				/>
			);

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowUp]' );

			expect( input ).toHaveValue( 1.75 );
		} );

		it( 'should increment by shiftStep on key UP + shift press', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 5 } shiftStep={ 10 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 20 );
		} );

		it( 'should increment by shiftStep multiplied by spinFactor on key UP + shift press', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 5 } spinFactor={ 5 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 50 );
		} );

		it( 'should increment by shiftStep while preserving the decimal value when `step` is “any”', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 857.5309 } step="any" /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 867.5309 );
		} );

		it( 'should increment by custom shiftStep on key UP + shift press', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 5 } shiftStep={ 100 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 100 );
		} );

		it( 'should increment but be limited by max on shiftStep', async () => {
			const user = userEvent.setup();

			render(
				<StatefulNumberControl
					value={ 5 }
					shiftStep={ 100 }
					max={ 99 }
				/>
			);

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 99 );
		} );

		it( 'should not increment by shiftStep if disabled', async () => {
			const user = userEvent.setup();

			render(
				<StatefulNumberControl
					value={ 5 }
					shiftStep={ 100 }
					isShiftStepEnabled={ false }
				/>
			);

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowUp]{/Shift}' );

			expect( input ).toHaveValue( 6 );
		} );
	} );

	describe( 'Key DOWN interactions', () => {
		it( 'should fire onKeyDown callback', async () => {
			const user = userEvent.setup();
			const spy = jest.fn();

			render( <StatefulNumberControl value={ 5 } onKeyDown={ spy } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( spy ).toHaveBeenCalled();
		} );

		it( 'should decrement by step on key DOWN press', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 5 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( input ).toHaveValue( 4 );
		} );

		it( 'should decrement from a negative value', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ -5 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( input ).toHaveValue( -6 );
		} );

		it( 'should decrement while preserving the decimal value when `step` is “any”', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 868.5309 } step="any" /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( input ).toHaveValue( 867.5309 );
		} );

		it( 'should decrement by step multiplied by spinFactor when spinFactor is provided', async () => {
			const user = userEvent.setup();

			render(
				<StatefulNumberControl
					step={ 0.01 }
					spinFactor={ 10 }
					value={ 1.65 }
				/>
			);

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			expect( input ).toHaveValue( 1.55 );
		} );

		it( 'should decrement by shiftStep on key DOWN + shift press', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 5 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( 0 );
		} );

		it( 'should decrement by shiftStep multiplied by spinFactor on key DOWN + shift press', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 100 } spinFactor={ 5 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( 50 );
		} );

		it( 'should decrement by shiftStep while preserving the decimal value when `step` is “any”', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 877.5309 } step="any" /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( 867.5309 );
		} );

		it( 'should decrement by custom shiftStep on key DOWN + shift press', async () => {
			const user = userEvent.setup();

			render( <StatefulNumberControl value={ 5 } shiftStep={ 100 } /> );

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( -100 );
		} );

		it( 'should decrement but be limited by min on shiftStep', async () => {
			const user = userEvent.setup();

			render(
				<StatefulNumberControl
					value={ 5 }
					shiftStep={ 100 }
					min={ 4 }
				/>
			);

			const input = screen.getByRole( 'spinbutton' );
			await user.click( input );
			await user.keyboard( '{Shift>}[ArrowDown]{/Shift}' );

			expect( input ).toHaveValue( 4 );
		} );

		it( 'should not decrement by shiftStep if disabled', async () => {
			const user = userEvent.setup();

			render(
				<StatefulNumberControl
					value={ 5 }
					shiftStep={ 100 }
					isShiftStepEnabled={ false }
				/>
			);

			const input = screen.getByRole( 'spinbutton' );
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

		test.each( [
			[ 'up', '1', {} ],
			[ 'up', '2', { value: '1' } ],
			[ 'up', '12', { value: '10', step: '2' } ],
			[ 'up', '10', { value: '10', max: 10 } ],
			[ 'up', '10.1', { value: '10', step: '0.01', spinFactor: 10 } ],
			[ 'down', '-1', {} ],
			[ 'down', '1', { value: '2' } ],
			[ 'down', '10', { value: '12', step: '2' } ],
			[ 'down', '10', { value: '10', min: 10 } ],
			[ 'down', '9.9', { value: '10', step: '0.01', spinFactor: 10 } ],
		] )(
			'should spin %s to %s when props = %o',
			async ( direction, expectedValue, props ) => {
				const user = userEvent.setup();
				const onChange = jest.fn();
				render(
					<NumberControl
						{ ...props }
						spinControls="custom"
						onChange={ onChange }
					/>
				);
				await user.click(
					screen.getByLabelText(
						direction === 'up' ? 'Increment' : 'Decrement'
					)
				);
				expect( onChange ).toHaveBeenCalledWith( expectedValue, {
					event: expect.objectContaining( {
						target: expect.any( HTMLInputElement ),
						type: expect.any( String ),
					} ),
				} );
			}
		);
	} );
} );
