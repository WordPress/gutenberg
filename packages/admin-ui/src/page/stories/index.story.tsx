import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useState } from '@wordpress/element';
import {
	Badge,
	// eslint-disable-next-line @wordpress/use-recommended-components -- admin-ui is a bundled package that depends on @wordpress/ui
	Button,
	Text,
} from '@wordpress/ui';
import { Icon, wordpress } from '@wordpress/icons';
import Page from '..';
import Breadcrumbs from '../../breadcrumbs';
import { withRouter } from '../../stories/with-router';

const meta: Meta< typeof Page > = {
	component: Page,
	id: 'admin-ui-page',
	title: 'Design System/Admin UI/Page',
	tags: [ 'manifest' ],
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
		title: 'Settings',
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithSubtitle: Story = {
	args: {
		title: 'Settings',
		subTitle: 'Manage how your site looks and works.',
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbs: Story = {
	decorators: [ withRouter ],
	args: {
		showSidebarToggle: false,
		ariaLabel: 'Privacy',
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Settings', to: '/settings' },
					{ label: 'Privacy' },
				] }
			/>
		),
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithVisual: Story = {
	args: {
		title: 'Settings',
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
		ariaLabel: 'Privacy',
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Settings', to: '/settings' },
					{ label: 'Privacy' },
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
	tags: [ 'external-requests' ],
	args: {
		title: 'Profile',
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
		subTitle: 'Choose how your site collects and shares visitor data.',
		ariaLabel: 'Privacy',
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Settings', to: '/settings' },
					{ label: 'Privacy' },
				] }
			/>
		),
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithoutHeader: Story = {
	args: {
		ariaLabel: 'Settings',
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithTitleAndBadges: Story = {
	args: {
		title: 'Discussion',
		badges: <Badge intent="informational">New</Badge>,
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbsAndBadges: Story = {
	decorators: [ withRouter ],
	args: {
		showSidebarToggle: false,
		ariaLabel: 'Privacy Policy',
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Pages', to: '/pages' },
					{ label: 'Privacy Policy' },
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
		title: 'Settings',
		actions: (
			<Button size="compact" variant="solid">
				Save changes
			</Button>
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
		const [ currentHref, setCurrentHref ] = useState( '/settings/general' );
		const link = useCallback(
			( {
				href,
				children,
				...props
			}: ComponentProps< 'a' > & { href: string } ) => (
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

		const pages = [
			{ label: 'General', href: '/settings/general' },
			{ label: 'Writing', href: '/settings/writing' },
			{ label: 'Reading', href: '/settings/reading' },
			{ label: 'Discussion', href: '/settings/discussion' },
		];
		const currentPage = pages.find( ( page ) => page.href === currentHref );

		return (
			<Page
				{ ...args }
				// Adjacent pages share the "Settings" title, so name each page
				// region after its page.
				ariaLabel={ `${ currentPage?.label } settings` }
				components={ { link } }
				navigation={ { items: pages, currentHref } }
			/>
		);
	},
	args: {
		title: 'Settings',
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
		title: 'Settings',
		subTitle: 'Manage how your site looks and works.',
		actions: (
			<Button size="compact" variant="solid">
				Save changes
			</Button>
		),
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};

/**
 * The header of a settings subpage. The breadcrumbs lead back to the parent
 * page, the badge shows the status of the page, and "Save changes" saves it.
 */
export const WithBreadcrumbsAndActions: Story = {
	decorators: [ withRouter ],
	args: {
		subTitle: 'Choose how your site collects and shares visitor data.',
		ariaLabel: 'Privacy',
		breadcrumbs: (
			<Breadcrumbs
				items={ [
					{ label: 'Settings', to: '/settings' },
					{ label: 'Privacy' },
				] }
			/>
		),
		badges: <Badge intent="informational">Policy published</Badge>,
		actions: (
			<Button size="compact" variant="solid">
				Save changes
			</Button>
		),
		showSidebarToggle: false,
		hasPadding: true,
		children: <Text>Page content here</Text>,
	},
};
