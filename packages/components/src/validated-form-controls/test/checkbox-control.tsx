import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedCheckboxControl } from '../components';

describe( 'ValidatedCheckboxControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedCheckboxControl
				label="Agree"
				help="You must agree to continue."
				onChange={ () => {} }
			/>
		);

		expect(
			screen.getByRole( 'checkbox', { name: 'Agree' } )
		).toHaveAccessibleDescription( 'You must agree to continue.' );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedCheckboxControl
					label="Agree"
					help="You must agree to continue."
					onChange={ () => {} }
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const checkbox = screen.getByRole( 'checkbox', {
			name: /^Agree/,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( checkbox ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( checkbox ).toHaveAccessibleDescription(
			expect.stringContaining( 'You must agree to continue.' )
		);
	} );
} );
