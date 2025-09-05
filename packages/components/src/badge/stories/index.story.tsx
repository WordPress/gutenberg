/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import Badge from '..';

const meta: Meta< typeof Badge > = {
	component: Badge,
	title: 'Components/Containers/Badge',
	id: 'components-badge',
	tags: [ 'status-private' ],
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
		children: 'Code is Poetry',
	},
};

export const Info: Story = {
	args: {
		...Default.args,
		intent: 'info',
	},
};

export const Success: Story = {
	args: {
		...Default.args,
		intent: 'success',
	},
};

export const Warning: Story = {
	args: {
		...Default.args,
		intent: 'warning',
	},
};

export const Error: Story = {
	args: {
		...Default.args,
		intent: 'error',
	},
};
