import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { __experimentalToggleGroupControlOption as ToggleGroupControlOption } from '@wordpress/components';
import { ValidatedToggleGroupControl } from '../toggle-group-control';

globalThis.wpVitest.mockResizeObserver();

describe( 'ValidatedToggleGroupControl', () => {
	it( 'should preserve the help description', async () => {
		render(
			<ValidatedToggleGroupControl
				label="Alignment"
				help="Choose text alignment."
				value="left"
				onChange={ () => {} }
			>
				<ToggleGroupControlOption label="Left" value="left" />
				<ToggleGroupControlOption label="Center" value="center" />
			</ValidatedToggleGroupControl>
		);

		await waitFor( () => {
			expect(
				screen.getByRole( 'radiogroup', { name: 'Alignment' } )
			).toHaveAccessibleDescription( 'Choose text alignment.' );
		} );
	} );

	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedToggleGroupControl
					label="Alignment"
					help="Choose text alignment."
					value={ undefined }
					onChange={ () => {} }
					required
				>
					<ToggleGroupControlOption label="Left" value="left" />
					<ToggleGroupControlOption label="Center" value="center" />
				</ValidatedToggleGroupControl>
				<button type="submit">Submit</button>
			</form>
		);

		const radiogroup = screen.getByRole( 'radiogroup', {
			name: /^Alignment/,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( radiogroup ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
		expect( radiogroup ).toHaveAccessibleDescription(
			expect.stringContaining( 'Choose text alignment.' )
		);
	} );

	it( 'should expose only the toggle options to assistive technology', async () => {
		render(
			<ValidatedToggleGroupControl
				label="Alignment"
				value="left"
				onChange={ () => {} }
				required
			>
				<ToggleGroupControlOption label="Left" value="left" />
				<ToggleGroupControlOption label="Center" value="center" />
			</ValidatedToggleGroupControl>
		);

		await waitFor( () => {
			expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 2 );
		} );
	} );
} );
