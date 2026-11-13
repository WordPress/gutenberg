import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedContentEditableControl } from '../components';

describe( 'ValidatedContentEditableControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedContentEditableControl
				label="Bio"
				help="A short bio."
				value=""
			/>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'Bio' } )
		).toHaveAccessibleDescription( 'A short bio.' );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedContentEditableControl
					label="Bio"
					help="A short bio."
					value=""
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const textbox = screen.getByRole( 'textbox', {
			name: /^Bio/,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( textbox ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( textbox ).toHaveAccessibleDescription(
			expect.stringContaining( 'A short bio.' )
		);
	} );

	it( 'should expose only the editable to assistive technology', () => {
		render(
			<ValidatedContentEditableControl label="Bio" value="" required />
		);

		expect( screen.getAllByRole( 'textbox' ) ).toHaveLength( 1 );
	} );

	it( 'should move focus to the editable when the delegate is focused', async () => {
		render(
			<ValidatedContentEditableControl label="Bio" value="" required />
		);

		const textbox = screen.getByRole( 'textbox', { name: /^Bio/ } );

		// Constraint validation lands focus on the hidden delegate; the
		// wrapper forwards it to the editable the user actually interacts
		// with.
		screen.getByRole( 'textbox', { name: '', hidden: true } ).focus();

		await waitFor( () => expect( textbox ).toHaveFocus() );
	} );
} );
