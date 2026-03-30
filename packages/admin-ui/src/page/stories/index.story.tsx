/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
// eslint-disable-next-line @wordpress/use-recommended-components -- admin-ui is a bundled package that depends on @wordpress/ui
import { Badge, Button, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import Page from '..';
import Breadcrumbs from '../../breadcrumbs';
import { withRouter } from '../../stories/with-router';

const meta: Meta< typeof Page > = {
	component: Page,
	title: 'Admin UI/Page',
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		( Story ) => (
			<div style={ { minHeight: '400px' } }>
				<Story />
			</div>
		),
		withRouter,
	],
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
		title: 'Page title',
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithSubtitle: Story = {
	args: {
		title: 'Page title',
		subTitle: 'All of the subtitle text you need goes here.',
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbs: Story = {
	args: {
		showSidebarToggle: false,
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Root breadcrumb', to: '/connectors' },
					{ label: 'Level 1 breadcrumb' },
				] }
			/>
		),
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbsAndSubtitle: Story = {
	args: {
		showSidebarToggle: false,
		subTitle: 'All of the subtitle text you need goes here.',
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Root breadcrumb', to: '/connectors' },
					{ label: 'Level 1 breadcrumb' },
				] }
			/>
		),
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithoutHeader: Story = {
	args: {
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithTitleAndBadges: Story = {
	args: {
		title: 'Page title',
		badges: <Badge intent="informational">Status</Badge>,
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbsAndBadges: Story = {
	args: {
		showSidebarToggle: false,
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Root breadcrumb', to: '/connectors' },
					{ label: 'Level 1 breadcrumb' },
				] }
			/>
		),
		badges: <Badge intent="none">Published</Badge>,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithActions: Story = {
	args: {
		title: 'Page title',
		actions: (
			<>
				<Button size="compact" variant="outline">
					Cancel
				</Button>
				<Button size="compact" variant="solid">
					Save
				</Button>
			</>
		),
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const FullHeader: Story = {
	args: {
		subTitle: 'All of the subtitle text you need goes here.',
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Root breadcrumb', to: '/connectors' },
					{ label: 'Level 1 breadcrumb' },
				] }
			/>
		),
		badges: <Badge intent="informational">Status</Badge>,
		actions: (
			<>
				<Button size="compact" variant="outline">
					Cancel
				</Button>
				<Button size="compact" variant="solid">
					Save
				</Button>
			</>
		),
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};
