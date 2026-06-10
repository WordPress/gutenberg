import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedTextControl } from '../components';

describe( 'ValidatedTextControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedTextControl
				label="Name"
				help="Enter your full name."
				onChange={ () => {} }
				value=""
			/>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'Name' } )
		).toHaveAccessibleDescription( 'Enter your full name.' );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedTextControl
					label="Name"
					help="Enter your full name."
					onChange={ () => {} }
					value=""
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const input = screen.getByRole( 'textbox', { name: /^Name/ } );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( input ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( input ).toHaveAccessibleDescription(
			expect.stringContaining( 'Enter your full name.' )
		);
	} );
} );
