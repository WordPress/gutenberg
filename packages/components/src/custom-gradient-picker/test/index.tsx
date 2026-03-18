/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import CustomGradientPicker from '../';

describe( 'CustomGradientPicker', () => {
	describe( 'GradientTypePicker angle persistence', () => {
		it( 'should restore the previous linear angle when switching from radial back to linear', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<CustomGradientPicker
					value="linear-gradient(125deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)"
					onChange={ onChange }
				/>
			);

			const typeSelect = screen.getByRole( 'combobox', {
				name: /type/i,
			} );
			await user.selectOptions( typeSelect, 'radial-gradient' );
			await user.selectOptions( typeSelect, 'linear-gradient' );

			// Verify the angle from before the radial switch is restored, not the default
			const lastCall =
				onChange.mock.calls[ onChange.mock.calls.length - 1 ][ 0 ];
			expect( lastCall ).toContain( '125deg' );
		} );

		it( 'should use HORIZONTAL_GRADIENT_ORIENTATION when no prior linear angle exists', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			// Start with a radial gradient so there is no previous linear angle in the ref
			render(
				<CustomGradientPicker
					value="radial-gradient(rgb(0,0,0) 0%, rgb(255,255,255) 100%)"
					onChange={ onChange }
				/>
			);

			const typeSelect = screen.getByRole( 'combobox', {
				name: /type/i,
			} );
			await user.selectOptions( typeSelect, 'linear-gradient' );

			const lastCall =
				onChange.mock.calls[ onChange.mock.calls.length - 1 ][ 0 ];
			expect( lastCall ).toContain( '90deg' );
		} );

		it( 'should not restore angle when switching to radial', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<CustomGradientPicker
					value="linear-gradient(45deg, rgb(0,0,0) 0%, rgb(255,255,255) 100%)"
					onChange={ onChange }
				/>
			);

			const typeSelect = screen.getByRole( 'combobox', {
				name: /type/i,
			} );
			await user.selectOptions( typeSelect, 'radial-gradient' );

			// Radial gradients have no orientation, so deg should not appear in the output
			const lastCall =
				onChange.mock.calls[ onChange.mock.calls.length - 1 ][ 0 ];
			expect( lastCall ).not.toContain( 'deg' );
		} );
	} );
} );
