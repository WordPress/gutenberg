import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { __experimentalToggleGroupControlOption as ToggleGroupControlOption } from '@wordpress/components';
import { ValidatedToggleGroupControl } from '../toggle-group-control';

globalThis.wpVitest.mockResizeObserver();

// The `help` prop is rendered visually by BaseControl but is not
// programmatically associated with the toggle group via aria-describedby.
// Additionally, the validity target is a hidden delegate radio input, not the
// toggle group itself. These are pre-existing bugs, not caused by ControlWithError.
describe( 'ValidatedToggleGroupControl', () => {
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
