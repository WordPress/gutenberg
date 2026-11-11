import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedFormTokenField } from '../form-token-field';

globalThis.wpVitest.mockMatchMedia();

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

	it( 'should append the validation error alongside the built-in howto description', async () => {
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

		await waitFor( () => {
			expect( input ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( input ).toHaveAccessibleDescription(
			expect.stringContaining( 'Separate with commas or the Enter key.' )
		);
	} );
} );
