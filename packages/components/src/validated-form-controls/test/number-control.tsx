import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedNumberControl } from '../components';

describe( 'ValidatedNumberControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedNumberControl label="Quantity" help="Enter a quantity." />
		);

		expect(
			screen.getByRole( 'spinbutton', { name: 'Quantity' } )
		).toHaveAccessibleDescription( 'Enter a quantity.' );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedNumberControl
					label="Quantity"
					help="Enter a quantity."
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const input = screen.getByRole( 'spinbutton', {
			name: /^Quantity/,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( input ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( input ).toHaveAccessibleDescription(
			expect.stringContaining( 'Enter a quantity.' )
		);
	} );
} );
