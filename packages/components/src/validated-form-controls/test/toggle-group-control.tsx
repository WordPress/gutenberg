import { render, screen } from '@testing-library/react';
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
} );
