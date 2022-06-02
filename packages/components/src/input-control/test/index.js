/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import BaseInputControl from '../';

const setupUser = () =>
	userEvent.setup( {
		advanceTimers: jest.advanceTimersByTime,
	} );

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
		it( 'should focus its input on mousedown events', async () => {
			const user = setupUser();
			const spy = jest.fn();
			render( <InputControl type="number" onFocus={ spy } /> );
			const target = getInput();

			// Hovers the input and presses (without releasing) primary button.
			await user.pointer( [
				{ target },
				{ keys: '[MouseLeft]', target },
			] );

			expect( spy ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Value', () => {
		it( 'should update value onChange', async () => {
			const user = setupUser();
			const spy = jest.fn();
			render(
				<InputControl value="Hello" onChange={ ( v ) => spy( v ) } />
			);
			const input = getInput();

			await user.type( input, ' there' );

			expect( input ).toHaveValue( 'Hello there' );
			expect( spy ).toHaveBeenCalledTimes( 6 );
			expect( spy ).toHaveBeenLastCalledWith( 'Hello there' );
		} );

		it( 'should work as a controlled component', async () => {
			const user = setupUser();
			const spy = jest.fn();
			const { rerender } = render(
				<InputControl value="one" onChange={ spy } />
			);
			const input = getInput();

			await user.type( input, '2' );
			// Blurs the input.
			await user.click( document.body );

			// Updating the value via props.
			rerender( <InputControl value="three" onChange={ spy } /> );

			expect( input ).toHaveValue( 'three' );
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

			// Updating the value.
			rerender( <InputControl value="New" onChange={ spy } /> );

			expect( input ).toHaveValue( 'New' );

			// Change it back to the original value.
			rerender( <InputControl value="Original" onChange={ spy } /> );

			expect( input ).toHaveValue( 'Original' );
			expect( spy ).toHaveBeenCalledTimes( 0 );
		} );

		it( 'should not commit value until blurred when isPressEnterToChange is true', async () => {
			const user = setupUser();
			const spy = jest.fn();
			render(
				<InputControl
					value=""
					onChange={ ( v ) => spy( v ) }
					isPressEnterToChange
				/>
			);
			const input = getInput();

			await user.type( input, 'that was then' );
			await user.click( document.body );

			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( spy ).toHaveBeenCalledWith( 'that was then' );
		} );

		it( 'should commit value when blurred if value is invalid', async () => {
			const user = setupUser();
			const spyChange = jest.fn();
			render(
				<InputControl
					value="this is"
					onChange={ ( v ) => spyChange( v ) }
					// If the value contains 'now' it is not valid.
					pattern="(?!.*now)^.*$"
					__unstableStateReducer={ ( state, action ) => {
						let { value } = state;
						if (
							action.type === 'COMMIT' &&
							action.payload.event.type === 'blur'
						)
							value = value.replace( /\bnow\b/, 'meow' );

						return { ...state, value };
					} }
				/>
			);
			const input = getInput();

			await user.type( input, ' now' );
			await user.click( document.body );

			expect( spyChange ).toHaveBeenLastCalledWith( 'this is meow' );
		} );
	} );
} );
