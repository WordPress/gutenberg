import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedToggleControl } from '../components';

describe( 'ValidatedToggleControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedToggleControl
				label="Dark mode"
				help="Enable dark mode."
				onChange={ () => {} }
			/>
		);

		expect(
			screen.getByRole( 'checkbox', { name: 'Dark mode' } )
		).toHaveAccessibleDescription( 'Enable dark mode.' );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedToggleControl
					label="Dark mode"
					help="Enable dark mode."
					onChange={ () => {} }
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const toggle = screen.getByRole( 'checkbox', {
			name: /^Dark mode/,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( toggle ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( toggle ).toHaveAccessibleDescription(
			expect.stringContaining( 'Enable dark mode.' )
		);
	} );
} );
