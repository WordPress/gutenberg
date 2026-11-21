import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import BlockAlignmentMatrixControl from '../';

const meta: Meta< typeof BlockAlignmentMatrixControl > = {
	id: 'blockeditor-blockalignmentmatrixcontrol',
	title: 'Editor/Block Editor/BlockAlignmentMatrixControl',
	component: BlockAlignmentMatrixControl,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Renders a control for selecting block alignment using a matrix of alignment options.',
			},
		},
	},
	argTypes: {
		label: {
			control: 'text',
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: "'Change matrix alignment'" },
			},
			description: 'Label for the control.',
		},
		onChange: {
			action: 'onChange',
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			table: {
				type: { summary: 'function' },
				defaultValue: { summary: '() => {}' },
			},
			description:
				"Function to execute upon a user's change of the matrix state.",
		},
		isDisabled: {
			control: 'boolean',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
			description: 'Whether the control should be disabled.',
		},
		value: {
			// @ts-expect-error Storybook types omit `null`, which hides the control.
			control: { type: null },
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: "'center'" },
			},
			description: 'Content alignment location.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	render: function Template( { onChange, ...args } ) {
		const [ value, setValue ] =
			useState<
				ComponentProps< typeof BlockAlignmentMatrixControl >[ 'value' ]
			>();

		return (
			<BlockAlignmentMatrixControl
				{ ...args }
				value={ value }
				onChange={ ( ...changeArgs ) => {
					// Storybook passes an action.
					onChange!( ...changeArgs );
					setValue( ...changeArgs );
				} }
			/>
		);
	},
};
