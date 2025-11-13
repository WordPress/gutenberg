/**
 * External dependencies
 */
import { type Meta, type StoryObj } from '@storybook/react';

/**
 * WordPress dependencies
 */
import '@wordpress/theme/design-tokens.css'; // eslint-disable-line no-restricted-syntax

/**
 * Internal dependencies
 */
import { Box } from '../box';

const meta: Meta< typeof Box > = {
	title: 'Design System/Components/Box',
	component: Box,
	tags: [ 'status-experimental' ],
};
export default meta;

type Story = StoryObj< typeof Box >;

export const Default: Story = {
	args: {
		children: 'Box',
		backgroundColor: 'info',
		color: 'info',
		padding: 'small',
	},
	argTypes: {
		p: {
			control: 'select',
			options: [ 'x-small', 'small', 'medium', 'large', 1, 2, 3, 4 ],
		},
		padding: {
			control: 'select',
			options: [ 'x-small', 'small', 'medium', 'large', 1, 2, 3, 4 ],
		},
	},
};

export const DirectionalPadding: Story = {
	...Default,
	args: {
		...Default.args,
		padding: {
			blockStart: 'small',
			inline: 'medium',
			blockEnd: 'large',
		},
	},
};
export const Compact: Story = {
	...Default,
	globals: {
		density: 'compact',
	},
};
