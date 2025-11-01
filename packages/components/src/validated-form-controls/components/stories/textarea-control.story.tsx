/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import type { StoryObj, Meta } from '@storybook/react';
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
		const [ value, setValue ] = useState( '' );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedTextareaControl
				>[ 'customValidity' ]
			>( undefined );

		return (
			<ValidatedTextareaControl
				{ ...args }
				onChange={ ( newValue ) => {
					setValue( newValue );
					onChange?.( newValue );
				} }
				value={ value }
				onValidate={ ( v ) => {
					if ( v?.toLowerCase() === 'error' ) {
						setCustomValidity( {
							type: 'invalid',
							message: 'The word "error" is not allowed.',
						} );
					} else {
						setCustomValidity( undefined );
					}
				} }
				customValidity={ customValidity }
			/>
		);
	},
};
Default.args = {
	required: true,
	label: 'Textarea',
	help: 'The word "error" will trigger an error.',
};
