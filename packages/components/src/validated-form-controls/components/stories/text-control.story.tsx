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
import { ValidatedTextControl } from '../text-control';

const meta: Meta< typeof ValidatedTextControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedTextControl',
	id: 'components-validatedtextcontrol',
	component: ValidatedTextControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		value: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof ValidatedTextControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState( '' );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedTextControl
				>[ 'customValidity' ]
			>( undefined );

		return (
			<ValidatedTextControl
				{ ...args }
				value={ value }
				onChange={ ( newValue ) => {
					setValue( newValue );
					onChange?.( newValue );
				} }
				onValidate={ ( v ) => {
					if ( v?.toString().toLowerCase() === 'error' ) {
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
	label: 'Text',
	help: "The word 'error' will trigger an error.",
};
