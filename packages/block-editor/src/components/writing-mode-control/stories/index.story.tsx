import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import WritingModeControl from '../';

const meta: Meta< typeof WritingModeControl > = {
	id: 'blockeditor-writingmodecontrol',
	title: 'Editor/Block Editor/WritingModeControl',
	component: WritingModeControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: 'Control to facilitate writing mode selections.',
			},
		},
	},
	argTypes: {
		value: {
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'Currently selected writing mode.',
		},
		className: {
			control: 'text',
			description: 'Class name to add to the control.',
		},
		onChange: {
			action: 'onChange',
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'Handles change in the writing mode selection.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string >();

		return (
			<WritingModeControl
				{ ...args }
				onChange={ ( ...changeArgs ) => {
					onChange( ...changeArgs );
					setValue( ...changeArgs );
				} }
				value={ value }
			/>
		);
	},
};
