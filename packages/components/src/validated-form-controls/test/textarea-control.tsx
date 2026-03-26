import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedTextareaControl } from '../components';

describe( 'ValidatedTextareaControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedTextareaControl
				label="Bio"
				help="A short bio."
				onChange={ () => {} }
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
				<ValidatedTextareaControl
					label="Bio"
					help="A short bio."
					onChange={ () => {} }
					value=""
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const textarea = screen.getByRole( 'textbox', {
			name: /^Bio/,
		} );

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
} );
