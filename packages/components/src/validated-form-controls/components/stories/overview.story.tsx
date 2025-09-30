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

/**
 * Internal dependencies
 */
import { ValidatedInputControl } from '..';
import { formDecorator } from './story-utils';
import type { ControlWithError } from '../../control-with-error';

const meta: Meta< typeof ControlWithError > = {
	title: 'Components/Selection & Input/Validated Form Controls/Overview',
	id: 'components-validated-form-controls-overview',
	decorators: formDecorator,
};
export default meta;

type Story = StoryObj< typeof ControlWithError >;

/**
 * When there are multiple controls with errors, attempting to submit will
 * move focus to the first control with an error.
 */
export const WithMultipleControls: Story = {
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
