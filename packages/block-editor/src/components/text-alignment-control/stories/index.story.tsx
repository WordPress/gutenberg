import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import TextAlignmentControl from '../';

const meta: Meta< typeof TextAlignmentControl > = {
	id: 'blockeditor-textalignmentcontrol',
	title: 'Editor/Block Editor/TextAlignmentControl',
	component: TextAlignmentControl,
	tags: [ 'status-private' ],
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: 'Control to facilitate text alignment selections.',
			},
		},
	},
	argTypes: {
		value: {
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'Currently selected text alignment value.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		onChange: {
			action: 'onChange',
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'Handles change in text alignment selection.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		options: {
			control: 'check',
			description: 'Array of text alignment options to display.',
			options: [ 'left', 'center', 'right', 'justify' ],
			table: {
				type: { summary: 'array' },
			},
		},
		className: {
			control: 'text',
			description: 'Class name to add to the control.',
			table: {
				type: { summary: 'string' },
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string >();
		return (
			<TextAlignmentControl
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
