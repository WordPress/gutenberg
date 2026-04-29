/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import type { StoryObj, Meta } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import { formDecorator } from './story-utils';
import { ValidatedTextareaControl } from '../textarea-control';

const meta: Meta< typeof ValidatedTextareaControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedTextareaControl',
	id: 'components-validatedtextareacontrol',
	component: ValidatedTextareaControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: { value: { control: false } },
};
export default meta;

export const Default: StoryObj< typeof ValidatedTextareaControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] =
			useState<
				React.ComponentProps<
					typeof ValidatedTextareaControl
				>[ 'value' ]
			>( '' );

		return (
			<ValidatedTextareaControl
				{ ...args }
				value={ value }
				onChange={ ( newValue ) => {
					setValue( newValue );
					onChange?.( newValue );
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
	label: 'Textarea',
	help: 'The word "error" will trigger an error.',
};
