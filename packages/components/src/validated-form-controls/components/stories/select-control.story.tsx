import { useState } from '@wordpress/element';
import type { StoryObj, Meta } from '@storybook/react-vite';
import { ValidatedSelectControl } from '../select-control';
import type { ValidatedSelectControlSingleSelectionProps } from '../select-control';
import { formDecorator } from './story-utils';

// Pinned to the single-selection half of the props union: Storybook's `args`
// spread cannot round-trip a discriminated union.
const meta: Meta< ValidatedSelectControlSingleSelectionProps > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedSelectControl',
	id: 'components-validatedselectcontrol',
	component:
		ValidatedSelectControl as React.ComponentType< ValidatedSelectControlSingleSelectionProps >,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		value: { control: false },
	},
};
export default meta;

export const Default: StoryObj< ValidatedSelectControlSingleSelectionProps > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string | undefined >( '' );

		return (
			<ValidatedSelectControl
				{ ...args }
				value={ value }
				onChange={ ( newValue ) => {
					setValue( newValue );
					onChange?.( newValue );
				} }
				customValidity={
					value === '1'
						? {
								type: 'invalid',
								message: 'Option 1 is not allowed.',
						  }
						: undefined
				}
			/>
		);
	},
};
Default.args = {
	required: true,
	label: 'Select',
	help: 'Selecting option 1 will trigger an error.',
	options: [
		{ value: '', label: 'Select an option' },
		{ value: '1', label: 'Option 1 (not allowed)' },
		{ value: '2', label: 'Option 2' },
	],
};
