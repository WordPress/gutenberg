import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useState } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components -- admin-ui is a bundled package that depends on @wordpress/ui
import { Badge, Button, Text } from '@wordpress/ui';
import { Icon, wordpress } from '@wordpress/icons';
import Page from '..';
import Breadcrumbs from '../../breadcrumbs';
import type { NavigationLinkProps } from '../../navigation/types';
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
	decorators: [ withRouter ],
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

export const WithVisual: Story = {
	args: {
		title: 'Page title',
		visual: <Icon icon={ wordpress } size={ 24 } />,
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithVisualAndBreadcrumbs: Story = {
	decorators: [ withRouter ],
	args: {
		visual: <Icon icon={ wordpress } size={ 24 } />,
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

/**
 * Demonstrates that large images are constrained by the header visual styles.
 *
 * The `img` uses an empty `alt` because the visual region is hidden from assistive
 * technologies and the page title carries the accessible name.
 */
export const WithImageVisual: Story = {
	args: {
		title: 'Page title',
		visual: (
			<img
				src="https://secure.gravatar.com/avatar/c0ccdd53794779bcc07fcae7b79c4d80?s=48&r=g&d=mm"
				alt=""
			/>
		),
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbsAndSubtitle: Story = {
	decorators: [ withRouter ],
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
	decorators: [ withRouter ],
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

/**
 * Demonstrates `components.link`: a custom link that intercepts navigation and
 * drives `currentHref` from local state, keeping the links usable without a
 * real router.
 */
export const WithInteractiveNavigation: Story = {
	render: function Render( args ) {
		const [ currentHref, setCurrentHref ] = useState( '/overview' );
		const link = useCallback(
			( { href, children, ...props }: NavigationLinkProps ) => (
				<a
					{ ...props }
					href={ href }
					onClick={ ( event ) => {
						event.preventDefault();
						setCurrentHref( href );
					} }
				>
					{ children }
				</a>
			),
			[]
		);

		return (
			<Page
				{ ...args }
				components={ { link } }
				navigation={ {
					items: [
						{ label: 'Overview', href: '/overview' },
						{ label: 'Products', href: '/products' },
						{ label: 'Orders', href: '/orders' },
						{ label: 'Customers', href: '/customers' },
					],
					currentHref,
				} }
			/>
		);
	},
	args: {
		title: 'Analytics',
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithNavigation: Story = {
	...WithInteractiveNavigation,
};

export const WithNavigationAndActions: Story = {
	...WithInteractiveNavigation,
	args: {
		title: 'Analytics',
		subTitle: 'Review key metrics to understand performance.',
		actions: (
			<>
				<Button size="compact" variant="outline">
					Export
				</Button>
				<Button size="compact" variant="solid">
					Add widget
				</Button>
			</>
		),
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const FullHeader: Story = {
	decorators: [ withRouter ],
	args: {
		visual: <Icon icon={ wordpress } size={ 24 } />,
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
		navigation: {
			items: [
				{ label: 'Overview', href: '/overview' },
				{ label: 'Products', href: '/products' },
				{ label: 'Orders', href: '/orders' },
				{ label: 'Customers', href: '/customers' },
			],
			currentHref: '/overview',
		},
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
