import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import { ValidatedInputControl } from '../index';

describe( 'ValidatedInputControl', () => {
	it( 'forwards ref to the input element', () => {
		const ref = createRef< HTMLInputElement >();

		render( <ValidatedInputControl ref={ ref } label="Username" /> );

		expect( ref.current ).toBeInstanceOf( HTMLInputElement );
	} );

	it( 'appends a required indicator to the label', () => {
		render( <ValidatedInputControl label="URL" required /> );

		expect(
			screen.getByRole( 'textbox', { name: 'URL (Required)' } )
		).toBeVisible();
	} );

	it( 'appends an optional indicator to the label when markWhenOptional', () => {
		render( <ValidatedInputControl label="URL" markWhenOptional /> );

		expect(
			screen.getByRole( 'textbox', { name: 'URL (Optional)' } )
		).toBeVisible();
	} );

	it( 'preserves the description', () => {
		render(
			<ValidatedInputControl
				label="URL"
				description="Enter a full URL."
			/>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'URL' } )
		).toHaveAccessibleDescription( 'Enter a full URL.' );
	} );

	it( 'shows a native constraint violation when the form is submitted', async () => {
		const user = userEvent.setup();
		const onSubmit = jest.fn();
		render(
			<form onSubmit={ onSubmit }>
				<ValidatedInputControl label="URL" required />
				<button type="submit">Submit</button>
			</form>
		);

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect(
				screen.getByText( 'Constraints not satisfied' )
			).toBeVisible();
		} );
		expect( onSubmit ).not.toHaveBeenCalled();
	} );

	it( 'appends the validation error alongside the description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedInputControl
					label="URL"
					description="Enter a full URL."
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const input = screen.getByRole( 'textbox', { name: /^URL/ } );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( input ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( input ).toHaveAccessibleDescription(
			expect.stringContaining( 'Enter a full URL.' )
		);
	} );

	it( 'shows a custom validity message once the control is touched', async () => {
		const user = userEvent.setup();

		function TestComponent() {
			const [ value, setValue ] = useState( '' );
			return (
				<ValidatedInputControl
					label="Text"
					value={ value }
					onValueChange={ ( next ) => setValue( next ?? '' ) }
					customValidity={
						value === 'error'
							? {
									type: 'invalid',
									message: 'The word "error" is not allowed.',
							  }
							: undefined
					}
				/>
			);
		}

		render( <TestComponent /> );

		const input = screen.getByRole( 'textbox', { name: 'Text' } );

		await user.type( input, 'error' );
		await user.tab();

		await waitFor( () => {
			expect(
				screen.getByText( 'The word "error" is not allowed.' )
			).toBeVisible();
		} );
		expect( ( input as HTMLInputElement ).validationMessage ).toBe(
			'The word "error" is not allowed.'
		);
	} );
} );
