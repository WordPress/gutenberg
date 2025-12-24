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
import { ValidatedRadioControl } from '../radio-control';
import { formDecorator } from './story-utils';

const meta: Meta< typeof ValidatedRadioControl > = {
	title: 'Components/Selection & Input/Validated Form Controls/ValidatedRadioControl',
	id: 'components-validatedradiocontrol',
	component: ValidatedRadioControl,
	tags: [ 'status-private' ],
	decorators: formDecorator,
	args: { onChange: () => {} },
	argTypes: {
		selected: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof ValidatedRadioControl > = {
	render: function Template( { onChange, ...args } ) {
		const [ selected, setSelected ] =
			useState<
				React.ComponentProps<
					typeof ValidatedRadioControl
				>[ 'selected' ]
			>();

		return (
			<ValidatedRadioControl
				{ ...args }
				selected={ selected }
				onChange={ ( newValue ) => {
					setSelected( newValue );
					onChange?.( newValue );
				} }
				customValidity={
					selected === 'b'
						? {
								type: 'invalid',
								message: 'Option B is not allowed.',
						  }
						: undefined
				}
			/>
		);
	},
};
Default.args = {
	required: true,
	label: 'Radio',
	help: 'Option B is not allowed.',
	options: [
		{ label: 'Option A', value: 'a' },
		{ label: 'Option B (not allowed)', value: 'b' },
	],
};
