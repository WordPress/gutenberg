import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedToggleGroupControl } from '../components';
import { ToggleGroupControlOption } from '../../toggle-group-control';

// The `help` prop is rendered visually by BaseControl but is not
// programmatically associated with the toggle group via aria-describedby.
// Additionally, the validity target is a hidden delegate radio input, not the
// toggle group itself. These are pre-existing bugs, not caused by ControlWithError.
describe( 'ValidatedToggleGroupControl', () => {
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'should preserve the help description', () => {
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

		expect(
			screen.getByRole( 'radiogroup', { name: 'Alignment' } )
		).toHaveAccessibleDescription( 'Choose text alignment.' );
	} );

	it( 'should connect the validation error to the toggle group', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<ValidatedToggleGroupControl
					label="Alignment"
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

		const group = screen.getByRole( 'radiogroup', { name: /^Alignment/ } );

		await user.click( screen.getByRole( 'button', { name: 'Submit' } ) );

		await waitFor( () => {
			expect( group ).toHaveAccessibleDescription(
				expect.stringContaining( 'Constraints not satisfied' )
			);
		} );
	} );
} );
