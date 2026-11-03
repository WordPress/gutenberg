import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedCustomSelectControl } from '../components';

globalThis.wpVitest.mockMatchMedia();

describe( 'ValidatedCustomSelectControl', () => {
	const options = [
		{ key: 'small', name: 'Small' },
		{ key: 'large', name: 'Large' },
	];

	it( 'should preserve the built-in "Currently selected" description', async () => {
		render(
			<ValidatedCustomSelectControl
				label="Font Size"
				options={ options }
				value={ options[ 0 ] }
				onChange={ () => {} }
			/>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'combobox', { name: 'Font Size' } )
			).toHaveAccessibleDescription( 'Currently selected: Small' );
		} );
	} );

	it( 'should append the validation error alongside the built-in description', async () => {
		const user = userEvent.setup();
		render(
			<form onSubmit={ ( e ) => e.preventDefault() }>
				<ValidatedCustomSelectControl
					label="Font Size"
					options={ options }
					value={ options[ 0 ] }
					onChange={ () => {} }
					customValidity={ {
						type: 'invalid',
						message: 'Choose a larger size.',
					} }
				/>
				<button type="submit">Submit</button>
			</form>
		);

		const combobox = await waitFor( () => {
			return screen.getByRole( 'combobox', {
				name: /^Font Size/,
			} );
		} );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( combobox ).toHaveAccessibleDescription(
				expect.stringContaining( 'Choose a larger size.' )
			);
		} );
		expect( combobox ).toHaveAccessibleDescription(
			expect.stringContaining( 'Currently selected: Small' )
		);
	} );
} );
