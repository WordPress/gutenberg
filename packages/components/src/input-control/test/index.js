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

			expect( input ).toHaveAttribute( 'type', 'number' );
		} );

		it( 'should render label', () => {
			render( <InputControl label="Hello" value="There" /> );

			const input = screen.getByText( 'Hello' );

			expect( input ).toBeInTheDocument();
		} );

		it( 'should render help text as description', () => {
			render( <InputControl help="My help text" /> );
			expect(
				screen.getByRole( 'textbox', { description: 'My help text' } )
			).toBeInTheDocument();
		} );

		it( 'should still render help as aria-describedby when not plain text', () => {
			render( <InputControl help={ <a href="/foo">My help text</a> } /> );

			const input = screen.getByRole( 'textbox' );
			const help = screen.getByRole( 'link', { name: 'My help text' } );

			expect(
				// eslint-disable-next-line testing-library/no-node-access
				help.closest( `#${ input.getAttribute( 'aria-describedby' ) }` )
			).toBeVisible();
		} );
	} );

	describe( 'Ensurance of focus for number inputs', () => {
		it( 'should focus its input on mousedown events', async () => {
			const user = await userEvent.setup();
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
			const user = await userEvent.setup();
			const spy = jest.fn();
			render(
				<InputControl value="Hello" onChange={ ( v ) => spy( v ) } />
			);
			const input = getInput();

			await user.type( input, ' there' );

			expect( input ).toHaveValue( 'Hello there' );
			expect( spy ).toHaveBeenCalledTimes( ' there'.length );
			expect( spy ).toHaveBeenLastCalledWith( 'Hello there' );
		} );

		it( 'should work as a controlled component given normal, falsy or nullish values', async () => {
			const user = await userEvent.setup();
			const spy = jest.fn();
			const heldKeySet = new Set();
			const Example = () => {
				const [ state, setState ] = useState( 'one' );
				const onChange = ( value ) => {
					setState( value );
					spy( value );
				};
				const onKeyDown = ( { key } ) => {
					heldKeySet.add( key );
					if ( key === 'Escape' ) {
						if ( heldKeySet.has( 'Meta' ) ) {
							setState( 'qux' );
						} else if ( heldKeySet.has( 'Alt' ) ) {
							setState( undefined );
						} else {
							setState( '' );
						}
					}
				};
				const onKeyUp = ( { key } ) => heldKeySet.delete( key );
				return (
					<InputControl
						value={ state }
						onChange={ onChange }
						onKeyDown={ onKeyDown }
						onKeyUp={ onKeyUp }
					/>
				);
			};
			render( <Example /> );
			const input = getInput();

			await user.type( input, '2' );
			// Make a controlled update with a falsy value.
			await user.keyboard( '{Escape}' );
			expect( input ).toHaveValue( '' );

			// Make a controlled update with a normal value.
			await user.keyboard( '{Meta>}{Escape}{/Meta}' );
			expect( input ).toHaveValue( 'qux' );

			// Make a controlled update with a nullish value.
			await user.keyboard( '{Alt>}{Escape}{/Alt}' );
			expect( input ).toHaveValue( '' );
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
			const user = await userEvent.setup();
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
			// Clicking document.body to trigger a blur event on the input.
			await user.click( document.body );

			expect( spy ).toHaveBeenCalledTimes( 1 );
			expect( spy ).toHaveBeenCalledWith( 'that was then' );
		} );

		it( 'should commit value when blurred if value is invalid', async () => {
			const user = await userEvent.setup();
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
						) {
							value = value.replace( /\bnow\b/, 'meow' );
						}

						return { ...state, value };
					} }
				/>
			);
			const input = getInput();

			await user.type( input, ' now' );
			// Clicking document.body to trigger a blur event on the input.
			await user.click( document.body );

			expect( spyChange ).toHaveBeenLastCalledWith( 'this is meow' );
		} );
	} );
} );
