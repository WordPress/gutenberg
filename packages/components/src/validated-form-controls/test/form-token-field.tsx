import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedFormTokenField } from '../components';

describe( 'ValidatedFormTokenField', () => {
	it( 'should preserve the built-in howto description', () => {
		render(
			<ValidatedFormTokenField
				label="Tags"
				value={ [] }
				onChange={ () => {} }
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Tags' } )
		).toHaveAccessibleDescription(
			expect.stringContaining( 'Separate with commas or the Enter key.' )
		);
	} );

	it( 'should preserve the built-in howto description when validation is active', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedFormTokenField
					label="Tags"
					value={ [] }
					onChange={ () => {} }
					required
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const input = screen.getByRole( 'combobox', { name: /^Tags/ } );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		// The validation error targets the hidden delegate input, not the
		// interactive combobox. The combobox's built-in description should
		// be unaffected.
		await waitFor( () => {
			expect(
				screen.getByText( 'Constraints not satisfied' )
			).toBeVisible();
		} );
		expect( input ).toHaveAccessibleDescription(
			expect.stringContaining( 'Separate with commas or the Enter key.' )
		);
	} );
} );
