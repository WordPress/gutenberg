/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import Navigation from '..';
import { withRouter } from '../../stories/with-router';

const meta: Meta< typeof Navigation > = {
	component: Navigation,
	title: 'Admin UI/Navigation',
	decorators: [ withRouter ],
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
		items: [
			{ label: 'Overview', to: '/overview', active: true },
			{ label: 'Products', to: '/products' },
			{ label: 'Orders', to: '/orders' },
			{ label: 'Customers', to: '/customers' },
		],
	},
};

export const SingleItem: Story = {
	args: {
		items: [ { label: 'Overview', to: '/overview', active: true } ],
	},
};
