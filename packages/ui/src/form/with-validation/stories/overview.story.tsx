import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useRef, useCallback, useState } from '@wordpress/element';
import { debounce } from '@wordpress/compose';
import { Button } from '../../../button';
import * as Dialog from '../../../dialog';
import * as Popover from '../../../popover';
import { Stack } from '../../../stack';
import type { ControlWithError } from '../../primitives/control-with-error';
import { formDecorator } from '../../stories/shared';
import { ValidatedInputControl } from '../validated-input-control';

const meta: Meta< typeof ControlWithError > = {
	title: 'Design System/Components/Form/With Validation/Overview',
	id: 'design-system-form-with-validation-overview',
	parameters: {
		controls: { disable: true },
	},
};
export default meta;

type Story = StoryObj< typeof ControlWithError >;

/**
 * When there are multiple controls with errors, attempting to submit will
 * move focus to the first control with an error.
 */
export const WithMultipleControls: Story = {
	decorators: [ formDecorator ],
	render: function Template() {
		const [ text, setText ] = useState( '' );
		const [ text2, setText2 ] = useState( '' );

		return (
			<>
				<ValidatedInputControl
					label="Text"
					required
					value={ text }
					description="The word 'error' will trigger an error."
					onValueChange={ ( next ) => setText( next ?? '' ) }
					customValidity={
						text.toLowerCase() === 'error'
							? {
									type: 'invalid',
									message: 'The word "error" is not allowed.',
							  }
							: undefined
					}
				/>
				<ValidatedInputControl
					label="Text"
					required
					value={ text2 }
					description="The word 'error' will trigger an error."
					onValueChange={ ( next ) => setText2( next ?? '' ) }
					customValidity={
						text2.toLowerCase() === 'error'
							? {
									type: 'invalid',
									message: 'The word "error" is not allowed.',
							  }
							: undefined
					}
				/>
			</>
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
	decorators: [ formDecorator ],
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState( '' );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedInputControl
				>[ 'customValidity' ]
			>( undefined );

		const timeoutRef =
			useRef< ReturnType< typeof setTimeout > >( undefined );

		// eslint-disable-next-line react-hooks/exhaustive-deps
		const debouncedValidate = useCallback(
			debounce( ( v ) => {
				if ( v === '' ) {
					return;
				}

				setCustomValidity( {
					type: 'validating',
					message: 'Validating...',
				} );

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
				onValueChange={ ( newValue ) => {
					setText( newValue ?? '' );
					setCustomValidity( undefined );
					clearTimeout( timeoutRef.current );
					debouncedValidate( newValue );
				} }
				customValidity={ customValidity }
			/>
		);
	},
	args: {
		label: 'Text',
		description: 'The word "error" will trigger an error asynchronously.',
		required: true,
	},
};

// Not exported - Only for testing purposes.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AsyncValidationWithTest: StoryObj< typeof ValidatedInputControl > = {
	...AsyncValidation,
	decorators: [ formDecorator ],
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

		await waitFor(
			() => {
				expect(
					canvas.getByText( 'Please fill out this field.' )
				).toBeVisible();
			},
			{ timeout: 2500 }
		);

		await new Promise( ( resolve ) => setTimeout( resolve, 1500 ) );
		await expect(
			canvas.queryByText( 'Validating...' )
		).not.toBeInTheDocument();

		await userEvent.type( canvas.getByRole( 'textbox' ), 'e', {
			delay: 10,
		} );

		await expect(
			canvas.queryByText( 'Validated' )
		).not.toBeInTheDocument();

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
 * Custom validity errors are effective immediately, even when they are not yet visible
 * to the user. For example, in this form where the initial value is already invalid,
 * the error message will be shown to the user once the submit button is clicked,
 * even if the input has never been interacted with.
 */
export const CustomErrorsOnSubmit: StoryObj< typeof ValidatedInputControl > = {
	decorators: [ formDecorator ],
	args: {
		label: 'Text',
		required: true,
		description: 'The word "error" will trigger an error.',
	},
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState( 'error' );

		return (
			<ValidatedInputControl
				{ ...args }
				value={ text }
				onValueChange={ ( next ) => setText( next ?? '' ) }
				customValidity={
					text === 'error'
						? {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
						  }
						: undefined
				}
			/>
		);
	},
};

/**
 * While it is recommended to rely on the built-in behavior for showing errors by
 * using a `form` element and `type="submit"` button around validated fields,
 * it is also possible to show errors at arbitrary times.
 * This can be done by calling the [`reportValidity()` method](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity)
 * on a ref of the field itself, or the wrapping `form` element.
 */
export const ShowingErrorsAtArbitraryTimes: StoryObj<
	typeof ValidatedInputControl
> = {
	args: {
		label: 'Text',
		required: true,
		description: 'The word "error" will trigger an error.',
	},
	decorators: [],
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState( 'error' );
		const ref = useRef< HTMLInputElement >( null );

		return (
			<Stack direction="column" gap="md" align="start">
				<ValidatedInputControl
					ref={ ref }
					{ ...args }
					value={ text }
					onValueChange={ ( next ) => setText( next ?? '' ) }
					customValidity={
						text === 'error'
							? {
									type: 'invalid',
									message: 'The word "error" is not allowed.',
							  }
							: undefined
					}
				/>
				<Button
					variant="outline"
					onClick={ () => ref.current?.reportValidity() }
				>
					Report validity
				</Button>
			</Stack>
		);
	},
};

/**
 * A synthetic `invalid` event can be dispatched to reveal an existing error
 * without moving focus.
 */
export const ShowingErrorsWithoutMovingFocus: StoryObj<
	typeof ValidatedInputControl
> = {
	args: {
		label: 'Text',
		required: true,
		description: 'The word "error" will trigger an error.',
	},
	decorators: [],
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState( 'error' );
		const ref = useRef< HTMLInputElement >( null );

		return (
			<Stack direction="column" gap="md" align="start">
				<ValidatedInputControl
					ref={ ref }
					{ ...args }
					value={ text }
					onValueChange={ ( next ) => setText( next ?? '' ) }
					customValidity={
						text === 'error'
							? {
									type: 'invalid',
									message: 'The word "error" is not allowed.',
							  }
							: undefined
					}
				/>
				<Button
					variant="outline"
					onClick={ () =>
						ref.current?.dispatchEvent(
							new Event( 'invalid', {
								cancelable: true,
							} )
						)
					}
				>
					Show errors
				</Button>
			</Stack>
		);
	},
};

/**
 * A `form` wrapper and `type="submit"` button can be used to force validation when
 * the user tries to commit their changes, while still allowing the dialog to be
 * closed by canceling.
 *
 * Optionally, `disablePointerDismissal` on `Dialog.Root` and blocking dismissal
 * on Escape in `onOpenChange` can force users to more explicitly signal whether
 * they are trying to "submit close" or "cancel close" the dialog, as well as
 * preventing data loss on accidental closures.
 */
export const ValidateInModal: StoryObj< typeof ValidatedInputControl > = {
	render: function Template( { ...args } ) {
		const [ isOpen, setIsOpen ] = useState( false );
		const [ text, setText ] = useState( '' );

		return (
			<>
				<Button variant="outline" onClick={ () => setIsOpen( true ) }>
					Open in modal
				</Button>
				<Dialog.Root
					open={ isOpen }
					disablePointerDismissal
					onOpenChange={ ( nextOpen, eventDetails ) => {
						if (
							! nextOpen &&
							eventDetails.reason === 'escape-key'
						) {
							eventDetails.cancel();
							return;
						}

						setIsOpen( nextOpen );
					} }
				>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title>Dialog title</Dialog.Title>
						</Dialog.Header>
						<Dialog.Content>
							<form
								onSubmit={ ( event ) => {
									event.preventDefault();
									setIsOpen( false );
								} }
							>
								<Stack direction="column" gap="sm">
									<ValidatedInputControl
										{ ...args }
										value={ text }
										onValueChange={ ( next ) =>
											setText( next ?? '' )
										}
										customValidity={
											text === 'error'
												? {
														type: 'invalid',
														message:
															'The word "error" is not allowed.',
												  }
												: undefined
										}
									/>
									<Stack
										direction="row"
										gap="sm"
										justify="flex-end"
									>
										<Button
											variant="outline"
											type="button"
											onClick={ () => setIsOpen( false ) }
										>
											Cancel
										</Button>
										<Button type="submit">Save</Button>
									</Stack>
								</Stack>
							</form>
						</Dialog.Content>
					</Dialog.Popup>
				</Dialog.Root>
			</>
		);
	},
	args: {
		label: 'Text',
		required: true,
		description: 'The word "error" will trigger an error.',
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

			return (
				<Popover.Root
					open={ isOpen }
					onOpenChange={ ( nextOpen ) => {
						if ( ! nextOpen ) {
							const isValid =
								formRef.current?.reportValidity() ?? true;
							setIsOpen( ! isValid );
							return;
						}

						setIsOpen( true );
					} }
				>
					<Popover.Trigger render={ <Button variant="outline" /> }>
						Open in popover
					</Popover.Trigger>
					<Popover.Popup>
						<Popover.Arrow />
						<form
							ref={ formRef }
							style={ { width: 200 } }
							onSubmit={ ( event ) => {
								event.preventDefault();
								setIsOpen( false );
							} }
						>
							<ValidatedInputControl
								{ ...args }
								value={ text }
								onValueChange={ ( next ) =>
									setText( next ?? '' )
								}
								customValidity={
									text === 'error'
										? {
												type: 'invalid',
												message:
													'The word "error" is not allowed.',
										  }
										: undefined
								}
							/>
						</form>
					</Popover.Popup>
				</Popover.Root>
			);
		},
		args: {
			label: 'Text',
			description: 'The word "error" will trigger an error.',
			required: true,
		},
	};
