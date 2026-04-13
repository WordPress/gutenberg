/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import { Breadcrumb } from '..';

const meta: Meta< typeof Breadcrumb > = {
	component: Breadcrumb,
	title: 'UI/Breadcrumb',
};

export default meta;

type Story = StoryObj< typeof meta >;

export const FromItems: Story = {
	args: {
		items: [
			{ label: 'Home', href: '/' },
			{ label: 'Settings', href: '/settings' },
			{ label: 'General' },
		],
	},
};

export const Compound: Story = {
	render: () => (
		<Breadcrumb>
			<Breadcrumb.List>
				<Breadcrumb.Item href="/">Home</Breadcrumb.Item>
				<Breadcrumb.Item href="/settings">Settings</Breadcrumb.Item>
				<Breadcrumb.Current>General</Breadcrumb.Current>
			</Breadcrumb.List>
		</Breadcrumb>
	),
};
