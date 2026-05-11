import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedInputControl } from '../components';

describe( 'ValidatedInputControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedInputControl label="URL" help="Enter a full URL." />
		);

		expect(
			screen.getByRole( 'textbox', { name: 'URL' } )
		).toHaveAccessibleDescription( 'Enter a full URL.' );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedInputControl
					label="URL"
					help="Enter a full URL."
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
} );
