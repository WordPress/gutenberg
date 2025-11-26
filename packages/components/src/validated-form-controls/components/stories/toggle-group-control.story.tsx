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
import { ValidatedToggleGroupControl } from '../toggle-group-control';
import { ToggleGroupControlOption } from '../../../toggle-group-control';

const meta: Meta< typeof ValidatedToggleGroupControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedToggleGroupControl',
	id: 'components-validatedtogglegroupcontrol',
	component: ValidatedToggleGroupControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		value: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof ValidatedToggleGroupControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] =
			useState<
				React.ComponentProps<
					typeof ValidatedToggleGroupControl
				>[ 'value' ]
			>( '1' );
		const [ customValidity, setCustomValidity ] =
			useState<
				React.ComponentProps<
					typeof ValidatedToggleGroupControl
				>[ 'customValidity' ]
			>( undefined );

		return (
			<ValidatedToggleGroupControl
				{ ...args }
				value={ value }
				onChange={ ( newValue ) => {
					setValue( newValue );
					onChange?.( newValue );
				} }
				onValidate={ ( v ) => {
					if ( v === '2' ) {
						setCustomValidity( {
							type: 'invalid',
							message: 'Option 2 is not allowed.',
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
	label: 'Toggle Group',
	isBlock: true,
	children: [
		<ToggleGroupControlOption value="1" key="1" label="Option 1" />,
		<ToggleGroupControlOption value="2" key="2" label="Option 2" />,
	],
	help: 'Selecting option 2 will trigger an error.',
};
