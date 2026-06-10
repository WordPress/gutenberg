/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useRef, useCallback, useState } from '@wordpress/element';
import { debounce } from '@wordpress/compose';

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
import { VStack } from '../../../v-stack';

const meta: Meta< typeof ControlWithError > = {
	title: 'Components/Selection & Input/Validated Form Controls/Overview',
	id: 'components-validated-form-controls-overview',
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
	decorators: formDecorator,
	render: function Template() {
		const [ text, setText ] = useState< string | undefined >( '' );
		const [ text2, setText2 ] = useState< string | undefined >( '' );

		return (
			<>
				<ValidatedInputControl
					label="Text"
					required
					value={ text }
					help="The word 'error' will trigger an error."
					onChange={ setText }
					customValidity={
						text?.toLowerCase() === 'error'
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
					help="The word 'error' will trigger an error."
					onChange={ setText2 }
					customValidity={
						text2?.toLowerCase() === 'error'
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
 * Help text can be configured to be hidden when a custom error is reported. Whether to opt for this approach
 * will depend on context.
 */
export const WithHelpTextReplacement: Story = {
	decorators: formDecorator,
	render: function Template() {
		const [ text, setText ] = useState< string | undefined >( '' );
		const isInvalid = text?.toLowerCase() === 'error';

		return (
			<>
				<style>
					{ `
				.my-control:has(:invalid[data-validity-visible]) .my-control__help:not(.is-visible) {
					display: none;
				}
				` }
				</style>
				<ValidatedInputControl
					className="my-control"
					label="Text"
					required
					value={ text }
					help={
						<span
							className={ clsx(
								'my-control__help',
								! isInvalid && 'is-visible'
							) }
						>
							The word &quot;error&quot; is not allowed.
						</span>
					}
					onChange={ setText }
					customValidity={
						isInvalid
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
	decorators: formDecorator,
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
				onChange={ ( newValue ) => {
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
		help: 'The word "error" will trigger an error asynchronously.',
		required: true,
	},
};

// Not exported - Only for testing purposes.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AsyncValidationWithTest: StoryObj< typeof ValidatedInputControl > = {
	...AsyncValidation,
	decorators: formDecorator,
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
 * Custom validity errors are effective immediately, even when they are not yet visible
 * to the user. For example, in this form where the initial value is already invalid,
 * the error message will be shown to the user once the submit button is clicked,
 * even if the input has never been interacted with.
 */
export const CustomErrorsOnSubmit: StoryObj< typeof ValidatedInputControl > = {
	decorators: formDecorator,
	args: {
		label: 'Text',
		required: true,
		help: 'The word "error" will trigger an error.',
	},
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState< string | undefined >( 'error' );

		return (
			<>
				<ValidatedInputControl
					{ ...args }
					value={ text }
					onChange={ setText }
					customValidity={
						text === 'error'
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
		help: 'The word "error" will trigger an error.',
	},
	decorators: [],
	render: function Template( { ...args } ) {
		const [ text, setText ] = useState< string | undefined >( 'error' );
		const ref = useRef< HTMLInputElement >( null );

		return (
			<VStack spacing={ 4 } alignment="left">
				<ValidatedInputControl
					ref={ ref }
					{ ...args }
					value={ text }
					onChange={ setText }
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
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => ref.current?.reportValidity() }
				>
					Report validity
				</Button>
			</VStack>
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
		const [ text, setText ] = useState< string | undefined >( '' );

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
						shouldCloseOnEsc={ false }
						isDismissible={ false }
					>
						<form
							onSubmit={ ( event ) => {
								event.preventDefault();
								setIsOpen( false );
							} }
						>
							<VStack spacing={ 2 }>
								<ValidatedInputControl
									{ ...args }
									value={ text }
									onChange={ setText }
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
		help: 'The word "error" will trigger an error.',
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
			const [ text, setText ] = useState< string | undefined >( '' );

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
						<form
							ref={ formRef }
							onSubmit={ ( event ) => {
								event.preventDefault();
								setIsOpen( false );
							} }
						>
							<ValidatedInputControl
								{ ...args }
								value={ text }
								onChange={ setText }
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
