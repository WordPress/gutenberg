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

const JetpackLogo = ( {
	height = 32,
	width = 32,
}: {
	height?: number;
	width?: number;
} ) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		x="0px"
		y="0px"
		viewBox="0 0 32 32"
		height={ height }
		width={ width }
		// role="img" is required to prevent VoiceOver on Safari reading the content of the SVG
		role="img"
	>
		<path
			fill="#069e08"
			d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"
		/>
	</svg>
);

const GlobeLogo = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		width={ 24 }
		height={ 24 }
	>
		<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
	</svg>
);

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

export const WithLogo: Story = {
	args: {
		title: 'Page title',
		logo: <GlobeLogo />,
		showSidebarToggle: false,
		children: (
			<Text style={ { padding: '24px 24px' } }>Page content here</Text>
		),
	},
};

export const WithLogoAndBreadcrumbs: Story = {
	args: {
		logo: <GlobeLogo />,
		showSidebarToggle: false,
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Root breadcrumb', to: '/connectors' },
					{ label: 'Level 1 breadcrumb' },
				] }
			/>
		),
		children: (
			<Text style={ { padding: '24px 24px' } }>Page content here</Text>
		),
	},
};

export const WithJetpackLogo: Story = {
	args: {
		title: 'Jetpack',
		logo: <JetpackLogo width={ 20 } />,
		showSidebarToggle: false,
		children: (
			<Text style={ { padding: '24px 24px' } }>Page content here</Text>
		),
	},
};

export const WithJetpackLogoAndBreadcrumbs: Story = {
	args: {
		logo: <JetpackLogo width={ 20 } />,
		showSidebarToggle: false,
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Root breadcrumb', to: '/connectors' },
					{ label: 'Level 1 breadcrumb' },
				] }
			/>
		),
		children: (
			<Text style={ { padding: '24px 24px' } }>Page content here</Text>
		),
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
