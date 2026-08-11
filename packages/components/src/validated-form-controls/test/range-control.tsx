import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, useRef } from '@wordpress/element';
import { ValidatedRangeControl } from '../components';

describe( 'ValidatedRangeControl', () => {
	it( 'should preserve the help description', () => {
		render(
			<ValidatedRangeControl label="Opacity" help="Set the opacity." />
		);

		expect(
			screen.getByRole( 'slider', { name: 'Opacity' } )
		).toHaveAccessibleDescription( 'Set the opacity.' );
	} );

	// Range inputs always have a value, so `required` never fails constraint
	// validation. Use `customValidity` to trigger the validation error.
	it( 'should append the validation error alongside the help description', async () => {
		const user = userEvent.setup();

		function TestComponent() {
			const [ customValidity, setCustomValidity ] =
				useState<
					React.ComponentProps<
						typeof ValidatedRangeControl
					>[ 'customValidity' ]
				>( undefined );
			const ref = useRef< HTMLInputElement >( null );

			return (
				<>
					<ValidatedRangeControl
						ref={ ref }
						label="Opacity"
						help="Set the opacity."
						customValidity={ customValidity }
					/>
					<button
						type="button"
						onClick={ () => {
							setCustomValidity( {
								type: 'invalid',
								message: 'Value out of range.',
							} );
							requestAnimationFrame(
								() => ref.current?.reportValidity()
							);
						} }
					>
						Validate
					</button>
				</>
			);
		}

		render( <TestComponent /> );

		const slider = screen.getByRole( 'slider', { name: 'Opacity' } );
		expect( slider ).toHaveAccessibleDescription( 'Set the opacity.' );

		await user.click( screen.getByRole( 'button', { name: 'Validate' } ) );

		await waitFor( () => {
			expect( slider ).toHaveAccessibleDescription(
				expect.stringContaining( 'Value out of range.' )
			);
		} );
		expect( slider ).toHaveAccessibleDescription(
			expect.stringContaining( 'Set the opacity.' )
		);
	} );
} );
