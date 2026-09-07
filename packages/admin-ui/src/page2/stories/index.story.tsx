import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '@wordpress/ui';
import { Icon, download, plus, trash, wordpress } from '@wordpress/icons';
import Page2 from '..';

const meta: Meta< typeof Page2 > = {
	component: Page2,
	title: 'Admin UI/Page2',
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
		children: <Text>Page content here</Text>,
	},
};

export const WithDescription: Story = {
	args: {
		title: 'Page title',
		description: 'All of the description text you need goes here.',
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbs: Story = {
	args: {
		breadcrumbs: [
			{ label: 'Root breadcrumb', href: '/connectors' },
			{ label: 'Level 1 breadcrumb' },
		],
		children: <Text>Page content here</Text>,
	},
};

export const WithVisual: Story = {
	args: {
		title: 'Page title',
		visual: <Icon icon={ wordpress } size={ 24 } />,
		children: <Text>Page content here</Text>,
	},
};

export const WithVisualAndBreadcrumbs: Story = {
	args: {
		visual: <Icon icon={ wordpress } size={ 24 } />,
		breadcrumbs: [
			{ label: 'Root breadcrumb', href: '/connectors' },
			{ label: 'Level 1 breadcrumb' },
		],
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
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbsAndDescription: Story = {
	args: {
		description: 'All of the description text you need goes here.',
		breadcrumbs: [
			{ label: 'Root breadcrumb', href: '/connectors' },
			{ label: 'Level 1 breadcrumb' },
		],
		children: <Text>Page content here</Text>,
	},
};

export const WithoutHeader: Story = {
	args: {
		children: <Text>Page content here</Text>,
	},
};

export const WithTitleAndBadges: Story = {
	args: {
		title: 'Page title',
		badges: [ { label: 'Status', intent: 'informational' } ],
		children: <Text>Page content here</Text>,
	},
};

export const WithBreadcrumbsAndBadges: Story = {
	args: {
		breadcrumbs: [
			{ label: 'Root breadcrumb', href: '/connectors' },
			{ label: 'Level 1 breadcrumb' },
		],
		badges: [ { label: 'Published', intent: 'none' } ],
		children: <Text>Page content here</Text>,
	},
};

export const WithNavigation: Story = {
	args: {
		title: 'Analytics',
		navigation: {
			items: [
				{ label: 'Overview', href: '/overview' },
				{ label: 'Products', href: '/products' },
				{ label: 'Orders', href: '/orders' },
				{ label: 'Customers', href: '/customers' },
			],
			currentHref: '/overview',
		},
		children: <Text>Page content here</Text>,
	},
};

export const WithPrimaryAction: Story = {
	args: {
		title: 'Pages',
		actions: {
			primary: { label: 'Add new', onClick: () => {} },
		},
		children: <Text>Page content here</Text>,
	},
};

export const WithActions: Story = {
	args: {
		title: 'Pages',
		actions: {
			primary: { label: 'Add new', icon: plus, onClick: () => {} },
			secondary: [
				{ label: 'Import', onClick: () => {} },
				{ label: 'Export', icon: download, onClick: () => {} },
			],
			overflow: [ { label: 'Delete all', onClick: () => {} } ],
		},
		children: <Text>Page content here</Text>,
	},
};

/**
 * `iconOnly` actions render as `IconButton`, using `label` as the tooltip
 * and accessible name instead of visible text. Only supported for actions
 * with `onClick`.
 */
export const WithIconOnlyAction: Story = {
	args: {
		title: 'Pages',
		actions: {
			primary: { label: 'Add new', onClick: () => {} },
			secondary: [
				{
					label: 'Delete',
					icon: trash,
					iconOnly: true,
					onClick: () => {},
				},
			],
		},
		children: <Text>Page content here</Text>,
	},
};

/**
 * Actions with `href` render as `LinkButton`.
 */
export const WithLinkAction: Story = {
	args: {
		title: 'Pages',
		actions: {
			primary: { label: 'View live', href: '/pages', openInNewTab: true },
		},
		children: <Text>Page content here</Text>,
	},
};

/**
 * `Page2ActionsGroup` observes the header row's width (not viewport
 * breakpoints): as the row narrows, secondary actions move into the overflow
 * menu, ahead of any actions already there. Resize the canvas to see it
 * respond.
 */
export const ResponsiveActions: Story = {
	decorators: [
		( Story ) => (
			<div
				style={ {
					resize: 'horizontal',
					overflow: 'hidden',
					border: '1px dashed currentColor',
					maxWidth: '100%',
				} }
			>
				<Story />
			</div>
		),
	],
	args: {
		title: 'A reasonably long page title to compete for space',
		actions: {
			primary: { label: 'Add new', icon: plus, onClick: () => {} },
			secondary: [
				{ label: 'Import', onClick: () => {} },
				{ label: 'Export', icon: download, onClick: () => {} },
			],
			overflow: [ { label: 'Delete all', onClick: () => {} } ],
		},
		children: <Text>Drag the bottom-right corner to resize.</Text>,
	},
};

export const FullHeader: Story = {
	args: {
		visual: <Icon icon={ wordpress } size={ 24 } />,
		description: 'All of the description text you need goes here.',
		breadcrumbs: [
			{ label: 'Root breadcrumb', href: '/connectors' },
			{ label: 'Level 1 breadcrumb' },
		],
		badges: [ { label: 'Status', intent: 'informational' } ],
		navigation: {
			items: [
				{ label: 'Overview', href: '/overview' },
				{ label: 'Products', href: '/products' },
				{ label: 'Orders', href: '/orders' },
				{ label: 'Customers', href: '/customers' },
			],
			currentHref: '/overview',
		},
		actions: {
			primary: { label: 'Add new', icon: plus, onClick: () => {} },
			secondary: [ { label: 'Import', onClick: () => {} } ],
		},
		children: <Text>Page content here</Text>,
	},
};

/**
 * `Page2.FullBleed` neutralizes the page's inline padding for its children,
 * so content such as a full-width table can align with the page's outer
 * edges.
 */
export const WithFullBleedContent: Story = {
	args: {
		title: 'Page title',
		children: (
			<>
				<Text>Regular, padded content.</Text>
				<Page2.FullBleed
					style={ {
						background:
							'var(--wpds-color-background-surface-neutral-strong)',
						padding: 16,
					} }
				>
					<Text>Full-bleed content, edge-to-edge.</Text>
				</Page2.FullBleed>
				<Text>Regular, padded content.</Text>
			</>
		),
	},
};

/**
 * `Page2.Narrow` centers and constrains the width of content, such as a
 * settings form, that should not span the full width of the page.
 */
export const WithNarrowContent: Story = {
	args: {
		title: 'Page title',
		children: (
			<Page2.Narrow>
				<Text>Narrow, centered content.</Text>
			</Page2.Narrow>
		),
	},
};

/**
 * `Page2.Footer` anchors itself to the bottom of the page, spanning
 * edge-to-edge and staying stuck to the bottom of the viewport while the
 * page content scrolls.
 */
export const WithFooter: Story = {
	decorators: [
		( Story ) => (
			<div style={ { height: '400px' } }>
				<Story />
			</div>
		),
	],
	args: {
		title: 'Page title',
		children: (
			<>
				{ Array.from( { length: 20 }, ( _, index ) => (
					<Text key={ index }>Page content here</Text>
				) ) }
				<Page2.Footer>
					<Text>Footer content</Text>
				</Page2.Footer>
			</>
		),
	},
};
