import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from '@wordpress/element';
import { ValidatedSelectControl } from '../select-control';

describe( 'ControlWithError', () => {
	describe( 'Reveal during pending validation', () => {
		it( 'should keep the pending indicator instead of a native error on a synthetic `invalid` event', async () => {
			const user = userEvent.setup();

			function PendingValidatedSelectControl() {
				const ref = useRef< HTMLSelectElement >( null );
				return (
					<>
						<ValidatedSelectControl
							ref={ ref }
							label="Color"
							required
							value=""
							options={ [
								{ label: 'Select a color...', value: '' },
								{ label: 'Red', value: 'red' },
							] }
							onChange={ () => {} }
							customValidity={ {
								type: 'validating',
								message: 'Validating...',
							} }
						/>
						<button
							type="button"
							onClick={ () =>
								ref.current?.dispatchEvent(
									new Event( 'invalid', {
										cancelable: true,
									} )
								)
							}
						>
							Show errors
						</button>
					</>
				);
			}

			render( <PendingValidatedSelectControl /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Show errors' } )
			);

			await waitFor( () => {
				expect( screen.getByText( 'Validating...' ) ).toBeVisible();
			} );
			expect(
				screen.queryByText( 'Constraints not satisfied' )
			).not.toBeInTheDocument();
		} );
	} );
} );
