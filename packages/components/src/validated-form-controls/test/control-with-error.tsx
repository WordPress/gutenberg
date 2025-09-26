/**
 * External dependencies
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

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

			const onValidate = useCallback(
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
				},
				[ serverDelayMs ]
			);

			return (
				<ValidatedInputControl
					label="Text"
					value={ text }
					onChange={ ( newValue ) => {
						setText( newValue ?? '' );
					} }
					onValidate={ onValidate }
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
} );
