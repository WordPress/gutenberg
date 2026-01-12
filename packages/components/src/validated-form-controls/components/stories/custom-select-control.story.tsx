/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import type { StoryObj, Meta } from '@storybook/react-webpack5';

/**
 * Internal dependencies
 */
import { ValidatedCustomSelectControl } from '../custom-select-control';
import { formDecorator } from './story-utils';

const meta: Meta< typeof ValidatedCustomSelectControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedCustomSelectControl',
	id: 'components-validatedcustomselectcontrol',
	component: ValidatedCustomSelectControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		value: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof ValidatedCustomSelectControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] =
			useState<
				React.ComponentProps<
					typeof ValidatedCustomSelectControl
				>[ 'value' ]
			>();

		return (
			<ValidatedCustomSelectControl
				{ ...args }
				value={ value }
				onChange={ ( newValue ) => {
					setValue( newValue.selectedItem );
					onChange?.( newValue );
				} }
				customValidity={
					value?.key === 'a'
						? {
								type: 'invalid',
								message: 'Option A is not allowed.',
						  }
						: undefined
				}
			/>
		);
	},
};
Default.args = {
	required: true,
	label: 'Custom Select',
	options: [
		{ key: '', name: 'Select an option' },
		{ key: 'a', name: 'Option A (not allowed)' },
		{ key: 'b', name: 'Option B' },
	],
};
