/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';

/**
 * WordPress dependencies
 */
import { useRef, useCallback, useState } from '@wordpress/element';
import { debounce } from '@wordpress/compose';
import { create } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ValidatedInputControl } from '..';
import { formDecorator } from './story-utils';
import type { ControlWithError } from '../../control-with-error';
import Dropdown from '../../../dropdown';
import { Button } from '../../../button';
import Modal from '../../../modal';
import { HStack } from '../../../h-stack';
import { CheckboxControl } from '../../../checkbox-control';
import { VStack } from '../../../v-stack';

const meta: Meta< typeof ControlWithError > = {
	title: 'Components/Selection & Input/Validated Form Controls/Overview',
	id: 'components-validated-form-controls-overview',
};
export default meta;

type Story = StoryObj< typeof ControlWithError >;

/**
 * When there are multiple controls with errors, attempting to submit will
 * move focus to the first control with an error.
 */
export const WithMultipleControls: Story = {
	decorators: formDecorator,
	render: function Template() {
		const [ text, setText ] = useState( '' );
		const [ text2, setText2 ] = useState( '' );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedInputControl
				>[ 'customValidity' ]
			>( undefined );
		const [ customValidity2, setCustomValidity2 ] =
			useState<
				React.ComponentProps<
					typeof ValidatedInputControl
				>[ 'customValidity' ]
			>( undefined );

		return (
			<>
				<ValidatedInputControl
					label="Text"
					required
					value={ text }
					help="The word 'error' will trigger an error."
					onValidate={ ( value ) => {
						if ( value?.toLowerCase() === 'error' ) {
							setCustomValidity( {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
							} );
						} else {
							setCustomValidity( undefined );
						}
					} }
					customValidity={ customValidity }
					onChange={ ( value ) => setText( value ?? '' ) }
				/>
				<ValidatedInputControl
					label="Text"
					required
					value={ text2 }
					help="The word 'error' will trigger an error."
					onValidate={ ( value ) => {
						if ( value?.toLowerCase() === 'error' ) {
							setCustomValidity2( {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
							} );
						} else {
							setCustomValidity2( undefined );
						}
					} }
					onChange={ ( value ) => setText2( value ?? '' ) }
					customValidity={ customValidity2 }
				/>
			</>
		);
	},
};

/**
 * Help text can be configured to be hidden when a custom error is reported. Whether to opt for this approach
 * will depend on context.
 */
export const WithHelpTextReplacement: Story = {
	decorators: formDecorator,
	render: function Template() {
		const [ text, setText ] = useState( '' );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedInputControl
				>[ 'customValidity' ]
			>( undefined );

		return (
			<ValidatedInputControl
				label="Text"
				required
				value={ text }
				help={
					customValidity
						? undefined
						: 'The word "error" is not allowed.'
				}
				onValidate={ ( value ) => {
					if ( value?.toLowerCase() === 'error' ) {
						setCustomValidity( {
							type: 'invalid',
							message: 'The word "error" is not allowed.',
						} );
					} else {
						setCustomValidity( undefined );
					}
				} }
				onChange={ ( value ) => setText( value ?? '' ) }
				customValidity={ customValidity }
			/>
		);
	},
};

/**
 * To provide feedback from server-side validation, the `customValidity` prop can be used
 * to show additional status indicators while waiting for the server response,
 * and after the response is received.
 *
 * These indicators are intended for asynchronous validation calls that may take more than 1 second to complete.
 * They may be unnecessary when responses are generally quick.
 */
export const AsyncValidation: StoryObj< typeof ValidatedInputControl > = {
	decorators: formDecorator,
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState( '' );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedInputControl
				>[ 'customValidity' ]
			>( undefined );

		const timeoutRef = useRef< ReturnType< typeof setTimeout > >();
		const previousValidationValueRef = useRef< unknown >( '' );

		// eslint-disable-next-line react-hooks/exhaustive-deps
		const debouncedValidate = useCallback(
			debounce( ( v ) => {
				if ( v === previousValidationValueRef.current ) {
					return;
				}

				previousValidationValueRef.current = v;

				setCustomValidity( {
					type: 'validating',
					message: 'Validating...',
				} );

				clearTimeout( timeoutRef.current );
				timeoutRef.current = setTimeout( () => {
					if ( v?.toString().toLowerCase() === 'error' ) {
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
				}, 1500 );
			}, 500 ),
			[]
		);

		return (
			<ValidatedInputControl
				{ ...args }
				value={ text }
				onChange={ ( newValue ) => {
					setText( newValue ?? '' );
				} }
				onValidate={ debouncedValidate }
				customValidity={ customValidity }
			/>
		);
	},
	args: {
		label: 'Text',
		help: 'The word "error" will trigger an error asynchronously.',
		required: true,
	},
};

// Not exported - Only for testing purposes.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AsyncValidationWithTest: StoryObj< typeof ValidatedInputControl > = {
	...AsyncValidation,
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );
		await userEvent.click( canvas.getByRole( 'textbox' ) );
		await userEvent.type( canvas.getByRole( 'textbox' ), 'valid text', {
			delay: 10,
		} );
		await userEvent.tab();

		await waitFor(
			() => {
				expect( canvas.getByText( 'Validated' ) ).toBeVisible();
			},
			{ timeout: 2500 }
		);

		await new Promise( ( resolve ) => setTimeout( resolve, 500 ) );
		await userEvent.clear( canvas.getByRole( 'textbox' ) );

		// Should show validating state when transitioning from valid to invalid.
		await waitFor(
			() => {
				expect( canvas.getByText( 'Validating...' ) ).toBeVisible();
			},
			{ timeout: 2500 }
		);

		await waitFor(
			() => {
				expect(
					canvas.getByText( 'Please fill out this field.' )
				).toBeVisible();
			},
			{ timeout: 2500 }
		);

		// Should not show validating state if there were no changes
		// after a valid/invalid state was already shown.
		await new Promise( ( resolve ) => setTimeout( resolve, 1500 ) );
		await expect(
			canvas.queryByText( 'Validating...' )
		).not.toBeInTheDocument();

		await userEvent.type( canvas.getByRole( 'textbox' ), 'e', {
			delay: 10,
		} );

		// Should not show valid state if server has not yet responded.
		await expect(
			canvas.queryByText( 'Validated' )
		).not.toBeInTheDocument();

		// Should show validating state when transitioning from invalid to valid.
		await waitFor(
			() => {
				expect( canvas.getByText( 'Validating...' ) ).toBeVisible();
			},
			{ timeout: 2500 }
		);

		await waitFor(
			() => {
				expect( canvas.getByText( 'Validated' ) ).toBeVisible();
			},
			{ timeout: 2500 }
		);

		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		await userEvent.type( canvas.getByRole( 'textbox' ), 'rror', {
			delay: 10,
		} );

		await waitFor(
			() => {
				expect(
					canvas.getByText( 'The word "error" is not allowed.' )
				).toBeVisible();
			},
			{ timeout: 2500 }
		);
	},
};

/**
 * A `form` wrapper and `type="submit"` button can be used to force validation when
 * the user tries to commit their changes, while still allowing the modal to be closed by canceling.
 * Optionally, the `shouldCloseOnClickOutside`, `isDismissible`, and `shouldCloseOnEsc` props
 * on `Modal` can be disabled to force users to more explicitly signal whether they are trying to
 * "submit close" or "cancel close" the dialog, as well as preventing data loss on accidental closures.
 */
export const ValidateInModal: StoryObj< typeof ValidatedInputControl > = {
	render: function Template( { ...args } ) {
		const [ isOpen, setIsOpen ] = useState( false );
		return (
			<>
				<Button
					variant="secondary"
					__next40pxDefaultSize
					onClick={ () => setIsOpen( true ) }
				>
					Open in modal
				</Button>
				{ isOpen && (
					<Modal
						title="Dialog title"
						onRequestClose={ () => setIsOpen( false ) }
						shouldCloseOnClickOutside={ false }
						isDismissible={ false }
					>
						<form
							onSubmit={ ( event ) => {
								event.preventDefault();
								setIsOpen( false );
							} }
						>
							<VStack spacing={ 2 }>
								<ValidatedInputControl { ...args } />

								<HStack justify="flex-end" spacing={ 2 }>
									<Button
										variant="tertiary"
										__next40pxDefaultSize
										onClick={ () => setIsOpen( false ) }
									>
										Cancel
									</Button>
									<Button
										variant="primary"
										__next40pxDefaultSize
										type="submit"
									>
										Save
									</Button>
								</HStack>
							</VStack>
						</form>
					</Modal>
				) }
			</>
		);
	},
	args: {
		label: 'Text',
		required: true,
	},
};

/**
 * [Form methods](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement#instance_methods) like
 * `reportValidity()` can be used to validate the fields when a popover is about to be closed,
 * and prevent the closing of the popover when invalid.
 */
export const ValidateOnPopoverClose: StoryObj< typeof ValidatedInputControl > =
	{
		render: function Template( { ...args } ) {
			const [ isOpen, setIsOpen ] = useState( false );
			const formRef = useRef< HTMLFormElement >( null );
			const [ text, setText ] = useState( '' );
			const [ customValidity, setCustomValidity ] =
				useState<
					React.ComponentProps<
						typeof ValidatedInputControl
					>[ 'customValidity' ]
				>( undefined );

			return (
				<Dropdown
					popoverProps={ { placement: 'bottom-start' } }
					open={ isOpen }
					onToggle={ ( willOpen ) => {
						if ( ! willOpen ) {
							const isValid = formRef.current?.reportValidity();
							setIsOpen( ! isValid );
						} else {
							setIsOpen( true );
						}
					} }
					renderContent={ () => (
						<form ref={ formRef }>
							<ValidatedInputControl
								{ ...args }
								value={ text }
								onChange={ ( newValue ) => {
									setText( newValue ?? '' );
								} }
								onValidate={ ( value ) => {
									if ( value?.toLowerCase() === 'error' ) {
										setCustomValidity( {
											type: 'invalid',
											message:
												'The word "error" is not allowed.',
										} );
									} else {
										setCustomValidity( undefined );
									}
								} }
								customValidity={ customValidity }
							/>
						</form>
					) }
					renderToggle={ () => {
						return (
							<Button
								__next40pxDefaultSize
								variant="secondary"
								onClick={ () => setIsOpen( ! isOpen ) }
								aria-expanded={ isOpen }
							>
								Open in popover
							</Button>
						);
					} }
				/>
			);
		},
		args: {
			label: 'Text',
			help: 'The word "error" will trigger an error.',
			required: true,
			style: {
				width: '200px',
			},
		},
	};

/**
 * Sometimes, a field's validity may depend on the state of other fields.
 *
 * In this example, the text field must start with "http" if the checkbox is checked.
 * Validator logic should be added to both fields.
 */
export const ValidateWithOtherFieldState: StoryObj<
	typeof ValidatedInputControl
> = {
	decorators: formDecorator,
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState( '' );
		const [ isHttp, setIsHttp ] = useState( false );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedInputControl
				>[ 'customValidity' ]
			>( undefined );

		return (
			<>
				<ValidatedInputControl
					{ ...args }
					value={ text }
					onChange={ ( newValue ) => {
						setText( newValue ?? '' );
					} }
					onValidate={ ( value ) => {
						if ( isHttp && value && ! value.startsWith( 'http' ) ) {
							setCustomValidity( {
								type: 'invalid',
								message: 'Text must start with "http".',
							} );
						} else {
							setCustomValidity( undefined );
						}
					} }
					customValidity={ customValidity }
				/>
				<CheckboxControl
					__nextHasNoMarginBottom
					label="Text starts with HTTP"
					checked={ isHttp }
					onChange={ ( value ) => {
						setIsHttp( value );

						if (
							value === true &&
							text &&
							! text.startsWith( 'http' )
						) {
							setCustomValidity( {
								type: 'invalid',
								message: 'Text must start with "http".',
							} );
						} else {
							setCustomValidity( undefined );
						}
					} }
				/>
			</>
		);
	},
	args: {
		label: 'Text',
		required: true,
	},
};

/**
 * When a field's validity can only be determined after the submit button is clicked,
 * `customValidity` can be set within the form's `onSubmit` handler.
 *
 * In this example, the text field must start with "http" if the submit button is clicked,
 * but can be any string if the "Create new page" button is clicked.
 */
export const ValidateOnSubmit: StoryObj< typeof ValidatedInputControl > = {
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState( '' );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedInputControl
				>[ 'customValidity' ]
			>( undefined );

		return (
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();

					if ( text && ! text.startsWith( 'http' ) ) {
						setCustomValidity( {
							type: 'invalid',
							message: 'Text must start with "http".',
						} );
						return;
					}
					// eslint-disable-next-line no-alert
					alert( 'Form submitted!' );
				} }
			>
				<VStack style={ { width: 300 } }>
					<ValidatedInputControl
						{ ...args }
						value={ text }
						onChange={ ( newValue ) => {
							setText( newValue ?? '' );
						} }
						onValidate={ ( value ) => {
							if (
								customValidity?.type === 'invalid' &&
								value &&
								! value.startsWith( 'http' )
							) {
								setCustomValidity( {
									type: 'invalid',
									message: 'Text must start with "http".',
								} );
							} else {
								setCustomValidity( undefined );
							}
						} }
						customValidity={ customValidity }
					/>
					<Button
						variant="secondary"
						__next40pxDefaultSize
						icon={ create }
						// eslint-disable-next-line no-alert
						onClick={ () => alert( 'Created new page!' ) }
					>
						Create new page
					</Button>
				</VStack>
				<Button
					style={ { marginTop: 16 } }
					type="submit"
					variant="primary"
					__next40pxDefaultSize
				>
					Submit
				</Button>
			</form>
		);
	},
	args: {
		label: 'Link to',
		required: true,
	},
};
