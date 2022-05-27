/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import BaseInputControl from '../';

const getInput = () => screen.getByTestId( 'input' );

describe( 'InputControl', () => {
	const InputControl = ( props ) => (
		<BaseInputControl { ...props } data-testid="input" />
	);

	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			render( <InputControl /> );

			const input = getInput();

			expect( input ).toBeTruthy();
		} );

		it( 'should render with specified type', () => {
			render( <InputControl type="number" /> );

			const input = getInput();

			expect( input.getAttribute( 'type' ) ).toBe( 'number' );
		} );

		it( 'should render label', () => {
			render( <InputControl label="Hello" value="There" /> );

			const input = screen.getByText( 'Hello' );

			expect( input ).toBeTruthy();
		} );
	} );

	describe( 'Ensurance of focus for number inputs', () => {
		it( 'should focus its input on mousedown events', () => {
			const spy = jest.fn();
			render( <InputControl type="number" onFocus={ spy } /> );

			const input = getInput();
			fireEvent.mouseDown( input );

			expect( spy ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Value', () => {
		it( 'should update value onChange', () => {
			const spy = jest.fn();
			render( <InputControl value="Hello" onChange={ spy } /> );

			const input = getInput();
			input.focus();
			fireEvent.change( input, { target: { value: 'There' } } );

			expect( input.value ).toBe( 'There' );
			expect( spy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should work as a controlled component', () => {
			const spy = jest.fn();
			const { rerender } = render(
				<InputControl value="one" onChange={ spy } />
			);

			const input = getInput();

			input.focus();
			fireEvent.change( input, { target: { value: 'two' } } );

			// Ensuring <InputControl /> is controlled.
			fireEvent.blur( input );

			// Updating the value.
			rerender( <InputControl value="three" onChange={ spy } /> );

			expect( input.value ).toBe( 'three' );

			/*
			 * onChange called only once. onChange is not called when a
			 * parent component explicitly passed a (new value) change down to
			 * the <InputControl />.
			 */
			expect( spy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should change back to initial value prop, if controlled', () => {
			const spy = jest.fn();
			const { rerender } = render(
				<InputControl value="Original" onChange={ spy } />
			);

			const input = getInput();

			// Assuming <InputControl /> is controlled (not focused)

			// Updating the value.
			rerender( <InputControl value="New" onChange={ spy } /> );

			expect( input.value ).toBe( 'New' );

			// Change it back to the original value.
			rerender( <InputControl value="Original" onChange={ spy } /> );

			expect( input.value ).toBe( 'Original' );
			expect( spy ).toHaveBeenCalledTimes( 0 );
		} );
	} );
} );
