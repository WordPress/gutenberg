/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import type { StoryObj, Meta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { seen, unseen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ValidatedInputControl } from '../input-control';
import { formDecorator } from './story-utils';
import InputControlSuffixWrapper from '../../../input-control/input-suffix-wrapper';
import { Button } from '../../../button';

const meta: Meta< typeof ValidatedInputControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedInputControl',
	id: 'components-validatedinputcontrol',
	component: ValidatedInputControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		__unstableInputWidth: { control: { type: 'text' } },
		__unstableStateReducer: { control: false },
		onChange: { control: false },
		prefix: { control: false },
		suffix: { control: false },
		type: { control: { type: 'text' } },
		value: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof ValidatedInputControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string | undefined >( '' );

		return (
			<ValidatedInputControl
				{ ...args }
				value={ value }
				onChange={ ( newValue, ...rest ) => {
					setValue( newValue );
					onChange?.( newValue, ...rest );
				} }
				customValidity={
					value?.toLowerCase() === 'error'
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
Default.args = {
	required: true,
	label: 'Input',
	help: 'The word "error" will trigger an error.',
};

/**
 * This demonstrates how password validation would work with the standard implementation.
 *
 * We are planning to move to a custom implementation more tailored to the password use case.
 */
export const Password: StoryObj< typeof ValidatedInputControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string | undefined >( '' );
		const [ visible, setVisible ] = useState( false );

		return (
			<ValidatedInputControl
				{ ...args }
				type={ visible ? 'text' : 'password' }
				suffix={
					<InputControlSuffixWrapper variant="control">
						<Button
							size="small"
							icon={ visible ? unseen : seen }
							onClick={ () => setVisible( ( v ) => ! v ) }
							label={
								visible ? 'Hide password' : 'Show password'
							}
						/>
					</InputControlSuffixWrapper>
				}
				value={ value }
				onChange={ ( newValue, ...rest ) => {
					setValue( newValue );
					onChange?.( newValue, ...rest );
				} }
				customValidity={ ( () => {
					if ( ! /\d/.test( value ?? '' ) ) {
						return {
							type: 'invalid' as const,
							message:
								'Password must include at least one number.',
						};
					}
					if ( ! /[A-Z]/.test( value ?? '' ) ) {
						return {
							type: 'invalid' as const,
							message:
								'Password must include at least one capital letter.',
						};
					}
					if ( ! /[!@£$%^&*#]/.test( value ?? '' ) ) {
						return {
							type: 'invalid' as const,
							message:
								'Password must include at least one symbol.',
						};
					}
					return undefined;
				} )() }
			/>
		);
	},
};
Password.args = {
	required: true,
	label: 'Password',
	help: 'Minimum 8 characters, include a number, capital letter, and symbol (!@£$%^&*#).',
	minLength: 8,
};
Password.argTypes = {
	suffix: { control: false },
	type: { control: false },
};
