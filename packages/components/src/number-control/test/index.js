/**
 * External dependencies
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BaseNumberControl from '../';

const getInput = () => screen.getByTestId( 'input' );

const fireKeyDown = ( data ) =>
	fireEvent.keyDown( document.activeElement || document.body, data );

const NumberControl = ( props ) => (
	<BaseNumberControl { ...props } data-testid="input" />
);

function StatefulNumberControl( props ) {
	const [ value, setValue ] = useState( props.value );
	const handleOnChange = ( v ) => setValue( v );

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
			expect( getInput() ).not.toBeNull();
		} );

		it( 'should render custom className', () => {
			render( <NumberControl className="hello" /> );
			expect( getInput() ).toBeTruthy();
		} );
	} );

	describe( 'onChange handling', () => {
		it( 'should provide onChange callback with number value', () => {
			const spy = jest.fn();

			render(
				<NumberControl value={ 5 } onChange={ ( v ) => spy( v ) } />
			);

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: 10 } } );

			expect( spy ).toHaveBeenCalledWith( '10' );
		} );

		it( 'should call onChange callback when value is clamped on blur', async () => {
			const spy = jest.fn();
			render(
				<NumberControl
					value={ 5 }
					min={ 4 }
					max={ 10 }
					onChange={ ( v ) => spy( v ) }
				/>
			);

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: 1 } } );

			// Before blurring, the value is still un-clamped
			expect( input.value ).toBe( '1' );

			input.blur();

			// After blur, value is clamped
			expect( input.value ).toBe( '4' );

			await waitFor( () => {
				expect( spy ).toHaveBeenCalledTimes( 2 );
				expect( spy ).toHaveBeenNthCalledWith( 1, '1' );
				expect( spy ).toHaveBeenNthCalledWith( 2, 4 );
			} );
		} );
	} );

	describe( 'Validation', () => {
		it( 'should clamp value within range on ENTER keypress', () => {
			render( <NumberControl value={ 5 } min={ 0 } max={ 10 } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: -100 } } );
			fireKeyDown( { keyCode: ENTER } );

			/**
			 * This is zero because the value has been adjusted to
			 * respect the min/max range of the input.
			 */

			expect( input.value ).toBe( '0' );
		} );

		it( 'should clamp value within range on blur', () => {
			render( <NumberControl value={ 5 } min={ 0 } max={ 10 } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: 41 } } );

			// Before blurring, the value is still un-clamped
			expect( input.value ).toBe( '41' );

			input.blur();

			// After blur, value is clamped
			expect( input.value ).toBe( '10' );
		} );

		it( 'should parse to number value on ENTER keypress when required', () => {
			render( <NumberControl value={ 5 } required={ true } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '10 abc' } } );
			fireKeyDown( { keyCode: ENTER } );

			expect( input.value ).toBe( '0' );
		} );

		it( 'should parse to empty string on ENTER keypress when not required', () => {
			render( <NumberControl value={ 5 } required={ false } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '10 abc' } } );
			fireKeyDown( { keyCode: ENTER } );

			expect( input.value ).toBe( '' );
		} );

		it( 'should accept empty string on ENTER keypress for optional field', () => {
			render( <NumberControl value={ 5 } required={ false } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '' } } );
			fireKeyDown( { keyCode: ENTER } );

			expect( input.value ).toBe( '' );
		} );

		it( 'should not enforce numerical value for empty string when required is omitted', () => {
			render( <NumberControl value={ 5 } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '' } } );
			fireKeyDown( { keyCode: ENTER } );

			expect( input.value ).toBe( '' );
		} );

		it( 'should enforce numerical value for empty string when required', () => {
			render( <NumberControl value={ 5 } required={ true } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: '' } } );
			fireKeyDown( { keyCode: ENTER } );

			expect( input.value ).toBe( '0' );
		} );
	} );

	describe( 'Key UP interactions', () => {
		it( 'should fire onKeyDown callback', () => {
			const spy = jest.fn();

			render( <StatefulNumberControl value={ 5 } onKeyDown={ spy } /> );

			getInput().focus();
			fireKeyDown( { keyCode: UP } );

			expect( spy ).toHaveBeenCalled();
		} );

		it( 'should increment by step on key UP press', () => {
			render( <StatefulNumberControl value={ 5 } /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: UP } );

			expect( input.value ).toBe( '6' );
		} );

		it( 'should increment from a negative value', () => {
			render( <StatefulNumberControl value={ -5 } /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: UP } );

			expect( input.value ).toBe( '-4' );
		} );

		it( 'should increment while preserving the decimal value when `step` is “any”', () => {
			render( <StatefulNumberControl value={ 866.5309 } step="any" /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: UP } );

			expect( input.value ).toBe( '867.5309' );
		} );

		it( 'should increment by shiftStep on key UP + shift press', () => {
			render( <StatefulNumberControl value={ 5 } shiftStep={ 10 } /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: UP, shiftKey: true } );

			expect( input.value ).toBe( '20' );
		} );

		it( 'should increment by shiftStep while preserving the decimal value when `step` is “any”', () => {
			render( <StatefulNumberControl value={ 857.5309 } step="any" /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: UP, shiftKey: true } );

			expect( input.value ).toBe( '867.5309' );
		} );

		it( 'should increment by custom shiftStep on key UP + shift press', () => {
			render( <StatefulNumberControl value={ 5 } shiftStep={ 100 } /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: UP, shiftKey: true } );

			expect( input.value ).toBe( '100' );
		} );

		it( 'should increment but be limited by max on shiftStep', () => {
			render(
				<StatefulNumberControl
					value={ 5 }
					shiftStep={ 100 }
					max={ 99 }
				/>
			);

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: UP, shiftKey: true } );

			expect( input.value ).toBe( '99' );
		} );

		it( 'should not increment by shiftStep if disabled', () => {
			render(
				<StatefulNumberControl
					value={ 5 }
					shiftStep={ 100 }
					isShiftStepEnabled={ false }
				/>
			);

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: UP, shiftKey: true } );

			expect( input.value ).toBe( '6' );
		} );
	} );

	describe( 'Key DOWN interactions', () => {
		it( 'should fire onKeyDown callback', () => {
			const spy = jest.fn();
			render( <StatefulNumberControl value={ 5 } onKeyDown={ spy } /> );

			getInput().focus();
			fireKeyDown( { keyCode: DOWN } );

			expect( spy ).toHaveBeenCalled();
		} );

		it( 'should decrement by step on key DOWN press', () => {
			render( <StatefulNumberControl value={ 5 } /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: DOWN } );

			expect( input.value ).toBe( '4' );
		} );

		it( 'should decrement from a negative value', () => {
			render( <StatefulNumberControl value={ -5 } /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: DOWN } );

			expect( input.value ).toBe( '-6' );
		} );

		it( 'should decrement while preserving the decimal value when `step` is “any”', () => {
			render( <StatefulNumberControl value={ 868.5309 } step="any" /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: DOWN } );

			expect( input.value ).toBe( '867.5309' );
		} );

		it( 'should decrement by shiftStep on key DOWN + shift press', () => {
			render( <StatefulNumberControl value={ 5 } /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: DOWN, shiftKey: true } );

			expect( input.value ).toBe( '0' );
		} );

		it( 'should decrement by shiftStep while preserving the decimal value when `step` is “any”', () => {
			render( <StatefulNumberControl value={ 877.5309 } step="any" /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: DOWN, shiftKey: true } );

			expect( input.value ).toBe( '867.5309' );
		} );

		it( 'should decrement by custom shiftStep on key DOWN + shift press', () => {
			render( <StatefulNumberControl value={ 5 } shiftStep={ 100 } /> );

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: DOWN, shiftKey: true } );

			expect( input.value ).toBe( '-100' );
		} );

		it( 'should decrement but be limited by min on shiftStep', () => {
			render(
				<StatefulNumberControl
					value={ 5 }
					shiftStep={ 100 }
					min={ 4 }
				/>
			);

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: DOWN, shiftKey: true } );

			expect( input.value ).toBe( '4' );
		} );

		it( 'should not decrement by shiftStep if disabled', () => {
			render(
				<StatefulNumberControl
					value={ 5 }
					shiftStep={ 100 }
					isShiftStepEnabled={ false }
				/>
			);

			const input = getInput();
			input.focus();
			fireKeyDown( { keyCode: DOWN, shiftKey: true } );

			expect( input.value ).toBe( '4' );
		} );
	} );
} );
