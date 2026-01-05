/**
 * External dependencies
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ValidatedInputControl } from '../components';

describe( 'ControlWithError', () => {
	describe( 'Async Validation', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		const AsyncValidatedInputControl = ( {
			serverDelayMs,
			...restProps
		}: {
			serverDelayMs: number;
		} & React.ComponentProps< typeof ValidatedInputControl > ) => {
			const [ text, setText ] = useState( '' );
			const [ customValidity, setCustomValidity ] =
				useState<
					React.ComponentProps<
						typeof ValidatedInputControl
					>[ 'customValidity' ]
				>( undefined );

			const onChange = useCallback(
				( value?: string ) => {
					setCustomValidity( {
						type: 'validating',
						message: 'Validating...',
					} );

					// Simulate delayed server response
					setTimeout( () => {
						if ( value?.toLowerCase() === 'error' ) {
							setCustomValidity( {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
							} );
						} else {
							setCustomValidity( {
								type: 'valid',
								message: 'Validated',
							} );
						}
					}, serverDelayMs );

					setText( value ?? '' );
				},
				[ serverDelayMs ]
			);

			return (
				<ValidatedInputControl
					label="Text"
					value={ text }
					onChange={ onChange }
					customValidity={ customValidity }
					{ ...restProps }
				/>
			);
		};

		it( 'should not show "validating" state if it takes less than 1000ms', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			render( <AsyncValidatedInputControl serverDelayMs={ 500 } /> );

			const input = screen.getByRole( 'textbox' );

			await user.type( input, 'valid text' );

			// Blur to trigger validation
			await user.tab();

			// Fast-forward to right before the server response
			act( () => jest.advanceTimersByTime( 499 ) );

			// The validating state should not be shown
			await waitFor( () => {
				expect(
					screen.queryByText( 'Validating...' )
				).not.toBeInTheDocument();
			} );

			// Fast-forward past the server delay to show validation result
			act( () => jest.advanceTimersByTime( 1 ) );

			await waitFor( () => {
				expect( screen.getByText( 'Validated' ) ).toBeVisible();
			} );
		} );

		it( 'should show "validating" state if it takes more than 1000ms', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			render( <AsyncValidatedInputControl serverDelayMs={ 1200 } /> );

			const input = screen.getByRole( 'textbox' );

			await user.type( input, 'valid text' );

			// Blur to trigger validation
			await user.tab();

			// Initially, no validating message should be shown (before 1s delay)
			expect(
				screen.queryByText( 'Validating...' )
			).not.toBeInTheDocument();

			// Fast-forward past the 1s delay to show validating state
			act( () => jest.advanceTimersByTime( 1000 ) );

			await waitFor( () => {
				expect( screen.getByText( 'Validating...' ) ).toBeVisible();
			} );

			// Fast-forward past the server delay to show validation result
			act( () => jest.advanceTimersByTime( 200 ) );

			await waitFor( () => {
				expect( screen.getByText( 'Validated' ) ).toBeVisible();
			} );

			// Test error case
			await user.clear( input );
			await user.type( input, 'error' );

			// Blur to trigger validation
			await user.tab();

			act( () => jest.advanceTimersByTime( 1000 ) );

			await waitFor( () => {
				expect( screen.getByText( 'Validating...' ) ).toBeVisible();
			} );

			act( () => jest.advanceTimersByTime( 200 ) );

			await waitFor( () => {
				expect(
					screen.getByText( 'The word "error" is not allowed.' )
				).toBeVisible();
			} );

			// Test editing after error
			await user.type( input, '{backspace}' );

			act( () => jest.advanceTimersByTime( 1000 ) );

			await waitFor( () => {
				expect( screen.getByText( 'Validating...' ) ).toBeVisible();
			} );

			act( () => jest.advanceTimersByTime( 200 ) );

			await waitFor( () => {
				expect( screen.getByText( 'Validated' ) ).toBeVisible();
			} );
		} );

		it( 'should not show a "valid" state until the server response is received, even if locally valid', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			render(
				<AsyncValidatedInputControl serverDelayMs={ 1200 } required />
			);

			const input = screen.getByRole( 'textbox' );

			await user.type( input, 'valid text' );

			await user.tab();
			act( () => jest.advanceTimersByTime( 1200 ) );

			await waitFor( () => {
				expect( screen.getByText( 'Validated' ) ).toBeVisible();
			} );

			await user.clear( input );

			act( () => jest.advanceTimersByTime( 1000 ) );

			await waitFor( () => {
				expect(
					screen.getByText( 'Constraints not satisfied' )
				).toBeVisible();
			} );

			await user.type( input, 'error' );

			act( () => jest.advanceTimersByTime( 200 ) );

			expect( screen.queryByText( 'Validated' ) ).not.toBeInTheDocument();

			act( () => jest.advanceTimersByTime( 1000 ) );

			await waitFor( () => {
				expect(
					screen.getByText( 'The word "error" is not allowed.' )
				).toBeVisible();
			} );
		} );
	} );

	describe( 'Form submission', () => {
		const CustomValidatedInputControl = ( {
			...restProps
		}: React.ComponentProps< typeof ValidatedInputControl > ) => {
			const [ customValidity, setCustomValidity ] =
				useState<
					React.ComponentProps<
						typeof ValidatedInputControl
					>[ 'customValidity' ]
				>( undefined );
			return (
				<ValidatedInputControl
					onChange={ ( value ) =>
						value === 'error'
							? setCustomValidity( {
									type: 'invalid',
									message: 'The word "error" is not allowed.',
							  } )
							: setCustomValidity( undefined )
					}
					customValidity={ customValidity }
					{ ...restProps }
				/>
			);
		};

		it( 'should show custom validity messages regardless of "touched" state if parent form is submitted', async () => {
			const user = userEvent.setup();
			const onSubmit = jest.fn();
			render(
				<form onSubmit={ onSubmit }>
					<CustomValidatedInputControl label="Text" />
					<button type="submit">Submit</button>
				</form>
			);

			const input = screen.getByRole< HTMLInputElement >( 'textbox', {
				name: 'Text',
			} );

			// User has interacted, but not blurred
			await user.type( input, 'error' );
			await user.keyboard( '{enter}' );

			// Input is marked as invalid at the HTML level
			await waitFor( () => {
				expect( input.checkValidity() ).toBe( false );
			} );
			expect( input.validationMessage ).toBe(
				'The word "error" is not allowed.'
			);

			// Field is showing the error message
			expect(
				screen.getByText( 'The word "error" is not allowed.' )
			).toBeVisible();

			// Form is not submitted
			expect( onSubmit ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Focus behavior', () => {
		it( 'should focus the first error in the form', async () => {
			const user = userEvent.setup();
			render(
				<form>
					<ValidatedInputControl label="Text1" required />
					<ValidatedInputControl label="Text2" required />
					<button type="submit">Submit</button>
				</form>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit' } )
			);

			expect(
				screen.getByRole( 'textbox', { name: /^Text1/ } )
			).toHaveFocus();
		} );

		it( 'should focus the field on an `invalid` event, even if there is no enclosing form', async () => {
			const user = userEvent.setup();
			function ValidatedInputControlWithRef(
				props: React.ComponentProps< typeof ValidatedInputControl >
			) {
				const ref = useRef< HTMLInputElement >( null );
				return (
					<>
						<ValidatedInputControl ref={ ref } { ...props } />
						<button
							type="button"
							onClick={ () => ref.current?.reportValidity() }
						>
							Report Validity
						</button>
					</>
				);
			}

			render( <ValidatedInputControlWithRef label="Text" required /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Report Validity' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'textbox', { name: /^Text/ } )
				).toHaveFocus();
			} );
		} );
	} );
} );
