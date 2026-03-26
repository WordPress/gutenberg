import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedRadioControl } from '../components';

describe( 'ValidatedRadioControl', () => {
	const options = [
		{ label: 'Small', value: 'small' },
		{ label: 'Medium', value: 'medium' },
		{ label: 'Large', value: 'large' },
	];

	it( 'should preserve the help description on the radio group', () => {
		render(
			<ValidatedRadioControl
				label="Size"
				help="Choose a size."
				options={ options }
				onChange={ () => {} }
			/>
		);

		expect(
			screen.getByRole( 'radiogroup', { name: 'Size' } )
		).toHaveAccessibleDescription( 'Choose a size.' );
	} );

	it( 'should append the validation error to the first radio input', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedRadioControl
					label="Size"
					help="Choose a size."
					options={ options }
					onChange={ () => {} }
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		// The validation error targets the first radio input (the validity
		// target), while the help description stays on the radiogroup.
		const firstRadio = screen.getByRole( 'radio', {
			name: 'Small',
		} );
		await waitFor( () => {
			expect( firstRadio ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );

		expect(
			screen.getByRole( 'radiogroup', { name: /^Size/ } )
		).toHaveAccessibleDescription(
			expect.stringContaining( 'Choose a size.' )
		);
	} );
} );
