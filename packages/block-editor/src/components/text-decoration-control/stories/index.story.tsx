import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import TextDecorationControl from '../';

const meta: Meta< typeof TextDecorationControl > = {
	id: 'blockeditor-textdecorationcontrol',
	title: 'Editor/Block Editor/TextDecorationControl',
	component: TextDecorationControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: 'Control to facilitate text decoration selections.',
			},
		},
	},
	argTypes: {
		value: {
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'Currently selected text decoration.',
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
			description: 'Handles change in text decoration selection.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		className: {
			control: 'text',
			description: 'Additional class name to apply.',
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
			<TextDecorationControl
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
