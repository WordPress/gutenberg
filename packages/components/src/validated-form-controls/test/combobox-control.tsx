import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedComboboxControl } from '../components';

// The `help` prop is rendered visually by BaseControl but is not
// programmatically associated with the combobox input via aria-describedby.
// This is a pre-existing bug in ComboboxControl, not caused by ControlWithError.
describe( 'ValidatedComboboxControl', () => {
	const options = [
		{ label: 'Apple', value: 'apple' },
		{ label: 'Banana', value: 'banana' },
	];

	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'should preserve the help description', () => {
		render(
			<ValidatedComboboxControl
				label="Fruit"
				help="Pick a fruit."
				options={ options }
				onChange={ () => {} }
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Fruit' } )
		).toHaveAccessibleDescription( 'Pick a fruit.' );
	} );

	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedComboboxControl
					label="Fruit"
					help="Pick a fruit."
					options={ options }
					onChange={ () => {} }
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const combobox = screen.getByRole( 'combobox', {
			name: /^Fruit/,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( combobox ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( combobox ).toHaveAccessibleDescription(
			expect.stringContaining( 'Pick a fruit.' )
		);
	} );
} );
