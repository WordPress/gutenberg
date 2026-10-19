import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useCallback, useState } from '@wordpress/element';
import { ValidatedInputControl } from './fixtures/validated-input-control';

globalThis.wpVitest.mockMatchMedia();

describe( 'ControlWithError', () => {
	describe( 'Async Validation', () => {
		beforeEach( () => {
			vi.useFakeTimers( {
				toFake: [ 'clearTimeout', 'setTimeout' ],
			} );
		} );

		afterEach( () => {
			vi.useRealTimers();
		} );

		const AsyncValidatedInputControl = ( {
			serverDelayMs,
			...restProps
		}: {
			serverDelayMs: number;
		} & Omit<
			React.ComponentProps< typeof ValidatedInputControl >,
			'value' | 'label' | 'onChange'
		> ) => {
			const [ text, setText ] = useState( '' );
			const [ customValidity, setCustomValidity ] =
				useState<
					React.ComponentProps<
						typeof ValidatedInputControl
					>[ 'customValidity' ]
				>( undefined );

			const onChange = useCallback(
				( event: React.ChangeEvent< HTMLInputElement > ) => {
					const { value } = event.target;

					setCustomValidity( {
						type: 'validating',
						message: 'Validating...',
					} );

					// Simulate delayed server response
					setTimeout( () => {
						if ( value.toLowerCase() === 'error' ) {
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

					setText( value );
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

		it( 'should not show "validating" state if it takes less than 1000ms', () => {
			render( <AsyncValidatedInputControl serverDelayMs={ 500 } /> );

			const input = screen.getByRole( 'textbox' );

			fireEvent.change( input, { target: { value: 'valid text' } } );
			fireEvent.blur( input );

			// Fast-forward to right before the server response
			act( () => vi.advanceTimersByTime( 499 ) );

			// The validating state should not be shown
			expect(
				screen.queryByText( 'Validating...' )
			).not.toBeInTheDocument();

			// Fast-forward past the server delay to show validation result
			act( () => vi.advanceTimersByTime( 1 ) );

			expect( screen.getByText( 'Validated' ) ).toBeVisible();
		} );

		it( 'should show "validating" state if it takes more than 1000ms', () => {
			render( <AsyncValidatedInputControl serverDelayMs={ 1200 } /> );

			const input = screen.getByRole( 'textbox' );

			fireEvent.change( input, { target: { value: 'valid text' } } );
			fireEvent.blur( input );

			// Initially, no validating message should be shown (before 1s delay)
			expect(
				screen.queryByText( 'Validating...' )
			).not.toBeInTheDocument();

			// Fast-forward past the 1s delay to show validating state
			act( () => vi.advanceTimersByTime( 1000 ) );

			expect( screen.getByText( 'Validating...' ) ).toBeVisible();

			// Fast-forward past the server delay to show validation result
			act( () => vi.advanceTimersByTime( 200 ) );

			expect( screen.getByText( 'Validated' ) ).toBeVisible();

			// Test error case
			fireEvent.change( input, { target: { value: 'error' } } );
			fireEvent.blur( input );

			act( () => vi.advanceTimersByTime( 1000 ) );

			expect( screen.getByText( 'Validating...' ) ).toBeVisible();

			act( () => vi.advanceTimersByTime( 200 ) );

			expect(
				screen.getByText( 'The word "error" is not allowed.' )
			).toBeVisible();

			// Test editing after error
			fireEvent.change( input, { target: { value: 'erro' } } );

			act( () => vi.advanceTimersByTime( 1000 ) );

			expect( screen.getByText( 'Validating...' ) ).toBeVisible();

			act( () => vi.advanceTimersByTime( 200 ) );

			expect( screen.getByText( 'Validated' ) ).toBeVisible();
		} );

		it( 'should not show a "valid" state until the server response is received, even if locally valid', () => {
			render(
				<AsyncValidatedInputControl serverDelayMs={ 1200 } required />
			);

			const input = screen.getByRole( 'textbox' );

			fireEvent.change( input, { target: { value: 'valid text' } } );
			fireEvent.blur( input );
			act( () => vi.advanceTimersByTime( 1200 ) );

			expect( screen.getByText( 'Validated' ) ).toBeVisible();

			fireEvent.change( input, { target: { value: '' } } );

			act( () => vi.advanceTimersByTime( 1000 ) );

			expect( screen.getByText( 'Validating...' ) ).toBeVisible();
			expect( screen.queryByText( 'Validated' ) ).not.toBeInTheDocument();

			act( () => vi.advanceTimersByTime( 200 ) );

			expect(
				screen.getByText( 'Constraints not satisfied' )
			).toBeVisible();

			fireEvent.change( input, { target: { value: 'error' } } );

			act( () => vi.advanceTimersByTime( 1000 ) );
			expect( screen.queryByText( 'Validated' ) ).not.toBeInTheDocument();

			act( () => vi.advanceTimersByTime( 200 ) );

			expect(
				screen.getByText( 'The word "error" is not allowed.' )
			).toBeVisible();
		} );
	} );
} );
