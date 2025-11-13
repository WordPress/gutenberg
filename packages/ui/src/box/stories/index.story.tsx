/**
 * External dependencies
 */
import { type Meta, type StoryObj } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/theme';
import '@wordpress/theme/design-tokens.css'; // eslint-disable-line no-restricted-syntax

/**
 * Internal dependencies
 */
import { Box } from '../box';
import { unlock } from '../../lock-unlock';

const { ThemeProvider } = unlock( privateApis );

const meta: Meta< typeof Box > = {
	title: 'Design System/Components/Box',
	component: Box,
	decorators: [
		( Story ) => (
			<ThemeProvider>
				<Story />
			</ThemeProvider>
		),
	],
	tags: [ 'status-experimental' ],
};
export default meta;

type Story = StoryObj< typeof Box >;

export const Default: Story = {
	args: {
		children: 'Box',
		backgroundColor: 'info',
		color: 'info',
		padding: 4,
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
	args: {
		children: 'Box',
		backgroundColor: 'info',
		color: 'info',
		padding: {
			blockStart: 'small',
			inline: 'medium',
			blockEnd: 'large',
		},
	},
};
