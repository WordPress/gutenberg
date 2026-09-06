import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedCustomSelectControl } from '../components';

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

	it( 'should preserve the built-in description when validation is active', async () => {
		const user = userEvent.setup();
		render(
			<form onSubmit={ ( e ) => e.preventDefault() }>
				<ValidatedCustomSelectControl
					label="Font Size"
					options={ options }
					value={ options[ 0 ] }
					onChange={ () => {} }
					required
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

		// The validation error targets the hidden delegate <select>, not
		// the interactive combobox. The combobox's built-in description
		// should be unaffected.
		await waitFor( () => {
			expect( combobox ).toHaveAccessibleDescription(
				'Currently selected: Small'
			);
		} );
	} );
} );
