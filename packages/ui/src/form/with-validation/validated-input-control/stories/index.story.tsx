import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';
import { ValidatedInputControl } from '../index';
import { IconButton } from '../../../../icon-button';
import { InputLayout } from '../../../primitives/input-layout';
import { formDecorator } from '../../../stories/shared';

const meta: Meta< typeof ValidatedInputControl > = {
	title: 'Design System/Components/Form/With Validation/ValidatedInputControl',
	component: ValidatedInputControl,
	argTypes: {
		customValidity: { control: false },
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		prefix: { control: false },
		suffix: { control: false },
		type: { control: 'text' },
		value: { control: false },
	},
	decorators: [ formDecorator ],
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'APIs and behavior are still prone to change.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ValidatedInputControl >;

/**
 * Native constraint validation (here, `required`) is reported inline when the
 * control is blurred or the form is submitted.
 */
export const Default: Story = {
	args: {
		label: 'Text',
		required: true,
	},
};

/**
 * Consumer-driven validation results are passed through the `customValidity`
 * prop. Type the word "error" and blur the field to trigger the custom error.
 */
export const WithCustomValidity: Story = {
	render: function Template( args ) {
		const [ value, setValue ] = useState( '' );

		return (
			<ValidatedInputControl
				{ ...args }
				value={ value }
				onValueChange={ ( next ) => setValue( next ?? '' ) }
				customValidity={
					value.toLowerCase() === 'error'
						? {
								type: 'invalid',
								message: 'The word "error" is not allowed.',
						  }
						: undefined
				}
			/>
		);
	},
	args: {
		label: 'Text',
		description: "The word 'error' will trigger an error.",
	},
};

/**
 * This demonstrates how password validation would work with the standard
 * implementation.
 */
export const Password: Story = {
	render: function Template( args ) {
		const [ value, setValue ] = useState( '' );
		const [ visible, setVisible ] = useState( false );

		return (
			<ValidatedInputControl
				{ ...args }
				type={ visible ? 'text' : 'password' }
				suffix={
					<InputLayout.Slot padding="minimal">
						<IconButton
							label={
								visible ? 'Hide password' : 'Show password'
							}
							icon={ visible ? unseen : seen }
							onClick={ () => setVisible( ( v ) => ! v ) }
							size="small"
							variant="minimal"
						/>
					</InputLayout.Slot>
				}
				value={ value }
				onValueChange={ ( next ) => setValue( next ?? '' ) }
				customValidity={ ( () => {
					if ( ! value ) {
						return undefined;
					}
					if ( ! /\d/.test( value ) ) {
						return {
							type: 'invalid' as const,
							message:
								'Password must include at least one number.',
						};
					}
					if ( ! /[A-Z]/.test( value ) ) {
						return {
							type: 'invalid' as const,
							message:
								'Password must include at least one capital letter.',
						};
					}
					return undefined;
				} )() }
			/>
		);
	},
	args: {
		label: 'Password',
		description:
			'Minimum 8 characters, include a number and a capital letter.',
		minLength: 8,
		required: true,
	},
};
