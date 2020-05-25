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
	} );

	describe( 'Label', () => {
		it( 'should render label', () => {
			render( <InputControl label="Hello" value="There" /> );

			const input = screen.getByText( 'Hello' );

			expect( input ).toBeTruthy();
		} );

		it( 'should render label, if floating', () => {
			render(
				<InputControl isFloatingLabel label="Hello" value="There" />
			);

			const input = screen.getAllByText( 'Hello' );

			expect( input ).toBeTruthy();
		} );
	} );

	describe( 'Value', () => {
		it( 'should update value onChange', () => {
			const spy = jest.fn();
			render( <InputControl value="Hello" onChange={ spy } /> );

			const input = getInput();

			fireEvent.change( input, { target: { value: 'There' } } );

			expect( input.value ).toBe( 'There' );
			expect( spy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should work as a controlled component', () => {
			const spy = jest.fn();
			const { rerender } = render(
				<InputControl value="Original" onChange={ spy } />
			);

			const input = getInput();

			fireEvent.change( input, { target: { value: 'State' } } );

			// Assuming <InputControl /> is controlled...

			// Updating the value
			rerender( <InputControl value="New" onChange={ spy } /> );

			expect( input.value ).toBe( 'New' );

			/**
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

			// Assuming <InputControl /> is controlled...

			// Updating the value
			rerender( <InputControl value="New" onChange={ spy } /> );

			expect( input.value ).toBe( 'New' );

			// Change it back to the original value
			rerender( <InputControl value="Original" onChange={ spy } /> );

			expect( input.value ).toBe( 'Original' );
			expect( spy ).toHaveBeenCalledTimes( 0 );
		} );
	} );
} );
