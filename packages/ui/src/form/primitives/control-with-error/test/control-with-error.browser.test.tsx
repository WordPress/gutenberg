import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import {
	forwardRef,
	useCallback,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';
import { ValidatedInputControl } from './fixtures/validated-input-control';
import { ControlWithError } from '../index';

describe( 'ControlWithError', () => {
	describe( 'label cloning', () => {
		it( 'should pass string labels as strings when appending the required indicator', async () => {
			await render( <ValidatedInputControl required label="Opacity" /> );

			expect( screen.getByRole( 'textbox' ) ).toHaveAttribute(
				'aria-label',
				'Opacity (Required)'
			);
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

			await render( <PendingValidatedInputControl /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Show errors' } )
			);

			await waitFor( () => {
				expect( screen.getByText( 'Validating...' ) ).toBeVisible();
			} );
			expect(
				screen.queryByText( 'Please fill out this field.' )
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
			const onSubmit = vi.fn();
			await render(
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
			await render(
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
					expect.stringContaining( 'Please fill out this field.' )
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

			await render( <TestComponent /> );

			const input = screen.getByRole( 'textbox', { name: /^URL/ } );

			expect( input ).toHaveAccessibleDescription( 'Enter a full URL.' );

			await user.click(
				screen.getByRole( 'button', { name: 'Submit' } )
			);

			await waitFor( () => {
				expect( input ).toHaveAccessibleDescription(
					expect.stringContaining( 'Please fill out this field.' )
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

			await render( <TestComponent /> );

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

			await render( <TestComponent /> );

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

			await render( <Harness /> );

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
			const validationMessage = input.validationMessage;
			expect( validationMessage ).not.toBe( '' );
			expect( screen.getByText( validationMessage ) ).toBeVisible();

			await user.tab();

			await waitFor( () => {
				expect( input ).toHaveValue( 1 );
			} );
			expect(
				screen.queryByText( validationMessage )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'Focus behavior', () => {
		it( 'should focus the first error in the form', async () => {
			const user = userEvent.setup();
			await render(
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

			await render(
				<ValidatedInputControlWithRef label="Text" required />
			);

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

			await render(
				<ValidatedInputControlWithRef label="Text" required />
			);

			const button = screen.getByRole( 'button', {
				name: 'Show errors',
			} );
			await user.click( button );

			// The error message is revealed...
			await waitFor( () => {
				expect(
					screen.getByText( 'Please fill out this field.' )
				).toBeVisible();
			} );
			// ...but focus is not moved to the invalid field.
			expect( button ).toHaveFocus();
		} );
	} );
} );
