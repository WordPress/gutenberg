import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import { ValidatedTextareaControl } from '../index';

describe( 'ValidatedTextareaControl', () => {
	it( 'forwards ref to the textarea element', () => {
		const ref = createRef< HTMLTextAreaElement >();

		render( <ValidatedTextareaControl ref={ ref } label="Bio" /> );

		expect( ref.current ).toBeInstanceOf( HTMLTextAreaElement );
	} );

	it( 'appends a required indicator to the label', () => {
		render( <ValidatedTextareaControl label="Bio" required /> );

		expect(
			screen.getByRole( 'textbox', { name: 'Bio (Required)' } )
		).toBeVisible();
	} );

	it( 'appends an optional indicator to the label when markWhenOptional', () => {
		render( <ValidatedTextareaControl label="Bio" markWhenOptional /> );

		expect(
			screen.getByRole( 'textbox', { name: 'Bio (Optional)' } )
		).toBeVisible();
	} );

	it( 'preserves the description', () => {
		render(
			<ValidatedTextareaControl label="Bio" description="A short bio." />
		);

		expect(
			screen.getByRole( 'textbox', { name: 'Bio' } )
		).toHaveAccessibleDescription( 'A short bio.' );
	} );

	it( 'shows a native constraint violation when the form is submitted', async () => {
		const user = userEvent.setup();
		const onSubmit = jest.fn();
		render(
			<form onSubmit={ onSubmit }>
				<ValidatedTextareaControl label="Bio" required />
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
				<ValidatedTextareaControl
					label="Bio"
					description="A short bio."
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const textarea = screen.getByRole( 'textbox', { name: /^Bio/ } );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( textarea ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( textarea ).toHaveAccessibleDescription(
			expect.stringContaining( 'A short bio.' )
		);
	} );

	it( 'shows a custom validity message once the control is touched', async () => {
		const user = userEvent.setup();

		function TestComponent() {
			const [ value, setValue ] = useState( '' );
			return (
				<ValidatedTextareaControl
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

		const textarea = screen.getByRole( 'textbox', { name: 'Text' } );

		await user.type( textarea, 'error' );
		await user.tab();

		await waitFor( () => {
			expect(
				screen.getByText( 'The word "error" is not allowed.' )
			).toBeVisible();
		} );
		expect( ( textarea as HTMLTextAreaElement ).validationMessage ).toBe(
			'The word "error" is not allowed.'
		);
	} );
} );
