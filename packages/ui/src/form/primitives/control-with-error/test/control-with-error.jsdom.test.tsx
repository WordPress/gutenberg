import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	forwardRef,
	useCallback,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { useIsomorphicLayoutEffect, useMergeRefs } from '@wordpress/compose';
import { ControlWithError } from '../index';

const ValidatedInput = forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes< HTMLInputElement > & { label?: string }
>( function ValidatedInput( { label, ...restProps }, ref ) {
	return <input ref={ ref } aria-label={ label } { ...restProps } />;
} );

type ValidatedInputControlProps = React.ComponentProps<
	typeof ValidatedInput
> &
	Pick<
		React.ComponentProps< typeof ControlWithError >,
		'required' | 'markWhenOptional' | 'customValidity'
	>;

const ValidatedInputControl = forwardRef<
	HTMLInputElement,
	ValidatedInputControlProps
>( function ValidatedInputControl(
	{ required, markWhenOptional, customValidity, ...restProps },
	forwardedRef
) {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<ValidatedInput ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
} );

describe( 'ControlWithError', () => {
	describe( 'label cloning', () => {
		it( 'should pass string labels as strings when appending the required indicator', () => {
			render( <ValidatedInputControl required label="Opacity" /> );

			expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
				'aria-label',
				'Opacity (Required)'
			);
		} );
	} );

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

	describe( 'Reveal during pending validation', () => {
		it( 'should keep the pending indicator instead of a native error on a synthetic `invalid` event', async () => {
			const user = userEvent.setup();

			function PendingValidatedInputControl() {
				const ref = useRef< HTMLInputElement >( null );
				return (
					<>
						<ValidatedInputControl
							ref={ ref }
							label="Text"
							required
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

			render( <PendingValidatedInputControl /> );

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
					onChange={ ( event ) =>
						event.target.value === 'error'
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

	describe( 'aria-describedby', () => {
		it( 'should connect the error message to the input via aria-describedby', async () => {
			const user = userEvent.setup();
			render(
				<form>
					<ValidatedInputControl label="URL" required />
					<button type="submit">Submit</button>
				</form>
			);

			const input = screen.getByRole( 'textbox', { name: /^URL/ } );

			expect( input ).not.toHaveAttribute( 'aria-describedby' );

			await user.click(
				screen.getByRole( 'button', { name: 'Submit' } )
			);

			await waitFor( () => {
				expect( input ).toHaveAccessibleDescription(
					expect.stringContaining( 'Constraints not satisfied' )
				);
			} );
		} );

		it( 'should preserve existing aria-describedby values', async () => {
			const user = userEvent.setup();

			function TestComponent() {
				const hintId = useId();
				return (
					<form>
						<ValidatedInputControl
							label="URL"
							required
							aria-describedby={ hintId }
						/>
						<p id={ hintId }>Enter a full URL.</p>
						<button type="submit">Submit</button>
					</form>
				);
			}

			render( <TestComponent /> );

			const input = screen.getByRole( 'textbox', { name: /^URL/ } );

			expect( input ).toHaveAccessibleDescription( 'Enter a full URL.' );

			await user.click(
				screen.getByRole( 'button', { name: 'Submit' } )
			);

			await waitFor( () => {
				expect( input ).toHaveAccessibleDescription(
					expect.stringContaining( 'Constraints not satisfied' )
				);
			} );
			expect( input ).toHaveAccessibleDescription(
				expect.stringContaining( 'Enter a full URL.' )
			);
		} );

		it( 'should connect a custom validity error to the input via aria-describedby', async () => {
			const user = userEvent.setup();

			function TestComponent() {
				const [ customValidity, setCustomValidity ] =
					useState<
						React.ComponentProps<
							typeof ValidatedInputControl
						>[ 'customValidity' ]
					>( undefined );
				const inputRef = useRef< HTMLInputElement >( null );

				return (
					<>
						<ValidatedInputControl
							ref={ inputRef }
							label="URL"
							customValidity={ customValidity }
						/>
						<button
							type="button"
							onClick={ () => {
								setCustomValidity( {
									type: 'invalid',
									message: 'Please enter a valid URL.',
								} );
								requestAnimationFrame(
									() => inputRef.current?.reportValidity()
								);
							} }
						>
							Validate
						</button>
					</>
				);
			}

			render( <TestComponent /> );

			const input = screen.getByRole( 'textbox', { name: 'URL' } );
			expect( input ).not.toHaveAttribute( 'aria-describedby' );

			await user.click(
				screen.getByRole( 'button', { name: 'Validate' } )
			);

			await waitFor( () => {
				expect( input ).toHaveAccessibleDescription(
					expect.stringContaining( 'Please enter a valid URL.' )
				);
			} );
		} );

		it( 'should remove aria-describedby when the error is resolved', async () => {
			const user = userEvent.setup();

			function TestComponent() {
				const [ customValidity, setCustomValidity ] =
					useState<
						React.ComponentProps<
							typeof ValidatedInputControl
						>[ 'customValidity' ]
					>( undefined );
				const inputRef = useRef< HTMLInputElement >( null );

				return (
					<>
						<ValidatedInputControl
							ref={ inputRef }
							label="URL"
							customValidity={ customValidity }
						/>
						<button
							type="button"
							onClick={ () => {
								setCustomValidity( {
									type: 'invalid',
									message: 'Please enter a valid URL.',
								} );
								requestAnimationFrame(
									() => inputRef.current?.reportValidity()
								);
							} }
						>
							Validate
						</button>
						<button
							type="button"
							onClick={ () => setCustomValidity( undefined ) }
						>
							Clear
						</button>
					</>
				);
			}

			render( <TestComponent /> );

			const input = screen.getByRole( 'textbox', { name: 'URL' } );

			await user.click(
				screen.getByRole( 'button', { name: 'Validate' } )
			);

			await waitFor( () => {
				expect( input ).toHaveAccessibleDescription(
					expect.stringContaining( 'Please enter a valid URL.' )
				);
			} );

			await user.click( screen.getByRole( 'button', { name: 'Clear' } ) );

			await waitFor( () => {
				expect( input ).not.toHaveAttribute( 'aria-describedby' );
			} );
		} );
	} );

	describe( 'Controls that commit their value on blur', () => {
		it( 'should clear a stale native error once the control commits a valid value on blur', async () => {
			const user = userEvent.setup();

			// Mimics controls like `NumberControl`: the value is clamped on
			// blur, and the committed value is synced into the control's own
			// state (and the DOM) in a layout effect, a render later.
			const ClampedNumberInput = forwardRef<
				HTMLInputElement,
				{
					label?: string;
					value: string;
					onChange: ( value: string ) => void;
				}
			>( function ClampedNumberInput( { label, value, onChange }, ref ) {
				const [ innerValue, setInnerValue ] = useState( value );
				useIsomorphicLayoutEffect( () => {
					setInnerValue( value );
				}, [ value ] );
				return (
					<input
						ref={ ref }
						type="number"
						min={ 1 }
						aria-label={ label }
						value={ innerValue }
						onChange={ ( event ) =>
							setInnerValue( event.target.value )
						}
						onBlur={ () =>
							onChange(
								String( Math.max( 1, Number( innerValue ) ) )
							)
						}
					/>
				);
			} );

			function Harness() {
				const [ value, setValue ] = useState( '10' );
				const ref = useRef< HTMLInputElement >( null );
				const getValidityTarget = useCallback( () => ref.current, [] );
				return (
					<ControlWithError getValidityTarget={ getValidityTarget }>
						<ClampedNumberInput
							ref={ ref }
							label="Number"
							value={ value }
							onChange={ setValue }
						/>
					</ControlWithError>
				);
			}

			render( <Harness /> );

			const input = screen.getByRole< HTMLInputElement >( 'spinbutton', {
				name: 'Number',
			} );
			await user.clear( input );
			await user.type( input, '0' );
			// The message has to be showing before the blur for the assertion below
			// to mean anything. Surface it the way a save action would, by validating
			// the form while the field is still focused.
			act( () => {
				input.reportValidity();
			} );
			expect(
				screen.getByText( 'Constraints not satisfied' )
			).toBeVisible();

			await user.tab();

			await waitFor( () => {
				expect( input ).toHaveValue( 1 );
			} );
			expect(
				screen.queryByText( 'Constraints not satisfied' )
			).not.toBeInTheDocument();
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

		it( 'should show the error message without moving focus on a synthetic `invalid` event', async () => {
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

			render( <ValidatedInputControlWithRef label="Text" required /> );

			const button = screen.getByRole( 'button', {
				name: 'Show errors',
			} );
			await user.click( button );

			// The error message is revealed...
			await waitFor( () => {
				expect(
					screen.getByText( 'Constraints not satisfied' )
				).toBeVisible();
			} );
			// ...but focus is not moved to the invalid field.
			expect( button ).toHaveFocus();
		} );
	} );
} );
