import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedSelectControl } from '../components';

describe( 'ValidatedSelectControl', () => {
	const options = [
		{ label: 'Select a color...', value: '' },
		{ label: 'Red', value: 'red' },
		{ label: 'Blue', value: 'blue' },
	];

	it( 'should preserve the help description', () => {
		render(
			<ValidatedSelectControl
				label="Color"
				help="Pick a color."
				options={ options }
				onChange={ () => {} }
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Color' } )
		).toHaveAccessibleDescription( 'Pick a color.' );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedSelectControl
					label="Color"
					help="Pick a color."
					options={ options }
					onChange={ () => {} }
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const select = screen.getByRole( 'combobox', {
			name: /^Color/,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( select ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( select ).toHaveAccessibleDescription(
			expect.stringContaining( 'Pick a color.' )
		);
	} );
} );
