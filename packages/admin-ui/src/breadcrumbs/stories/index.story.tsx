/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import Breadcrumbs from '..';
import { withRouter } from '../../stories/with-router';

const meta: Meta< typeof Breadcrumbs > = {
	component: Breadcrumbs,
	title: 'Admin UI/Breadcrumbs',
	decorators: [ withRouter ],
};

export default meta;

type Story = StoryObj< typeof meta >;

export const SingleItem: Story = {
	args: {
		items: [ { label: 'Root breadcrumb' } ],
	},
};

export const TwoLevels: Story = {
	args: {
		items: [
			{ label: 'Root breadcrumb', to: '/settings' },
			{ label: 'Level 1 breadcrumb' },
		],
	},
};

export const ThreeLevels: Story = {
	args: {
		items: [
			{ label: 'Root breadcrumb', to: '/settings' },
			{ label: 'Level 1 breadcrumb', to: '/settings/connectors' },
			{ label: 'Level 2 breadcrumb' },
		],
	},
};
