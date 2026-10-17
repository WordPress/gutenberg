import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import PlainText from '..';

const meta: Meta< typeof PlainText > = {
	id: 'blockeditor-plaintext',
	title: 'Editor/Block Editor/PlainText',
	component: PlainText,
	parameters: {
		// FIXME: Story renders PlainText without a label (label).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'PlainText renders an auto-growing textarea that allows users to enter any textual content.',
			},
		},
	},
	argTypes: {
		value: {
			control: {
				// @ts-expect-error Storybook types omit `null`, which hides the control.
				type: null,
			},
			table: {
				type: {
					summary: 'string',
				},
			},
			description: 'String value of the textarea.',
		},
		onChange: {
			action: 'onChange',
			control: {
				// @ts-expect-error Storybook types omit `null`, which hides the control.
				type: null,
			},
			table: {
				type: {
					summary: 'function',
				},
			},
			description: 'Function called when the text value changes.',
		},
		className: {
			control: 'text',
			table: {
				type: {
					summary: 'string',
				},
			},
			description: 'Additional class name for the PlainText.',
		},
	},
};

export default meta;

export const Default: StoryObj< typeof PlainText > = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] = useState< string >();
		return (
			<PlainText
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
