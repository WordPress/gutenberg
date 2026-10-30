import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import TextTransformControl from '../';

const meta: Meta< typeof TextTransformControl > = {
	id: 'blockeditor-texttransformcontrol',
	title: 'Editor/Block Editor/TextTransformControl',
	component: TextTransformControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Control to facilitate text transformation selections.',
			},
		},
	},
	argTypes: {
		onChange: {
			action: 'onChange',
			control: {
				// @ts-expect-error Storybook types omit `null`, which hides the control.
				type: null,
			},
			description: 'Handles change in text transform selection.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		className: {
			control: { type: 'text' },
			description: 'Class name to add to the control.',
			table: {
				type: { summary: 'string' },
			},
		},
		value: {
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			description: 'Currently selected text transform.',
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
			<TextTransformControl
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
