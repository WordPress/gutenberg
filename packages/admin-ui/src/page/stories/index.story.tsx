/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterContextProvider,
} from '@tanstack/react-router';
import { __experimentalText as Text } from '@wordpress/components';
/**
 * WordPress dependencies
 */
import { privateApis as themeApis } from '@wordpress/theme';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

/**
 * Internal dependencies
 */
import Page from '..';
import Breadcrumbs from '../../breadcrumbs';

const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/theme'
);

const { ThemeProvider } = unlock( themeApis );

const rootRoute = createRootRoute( {
	notFoundComponent: () => null,
} );
const router = createRouter( {
	routeTree: rootRoute,
	history: createMemoryHistory( { initialEntries: [ '/' ] } ),
	defaultNotFoundComponent: () => null,
} );

const meta: Meta< typeof Page > = {
	component: Page,
	title: 'Admin UI/Page',
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		( Story ) => (
			<ThemeProvider isRoot>
				<RouterContextProvider router={ router }>
					<div style={ { height: '400px' } }>
						<Story />
					</div>
				</RouterContextProvider>
			</ThemeProvider>
		),
	],
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
		title: 'Page title',
		showSidebarToggle: false,
		children: (
			<Text style={ { padding: '24px 24px' } }>Page content here</Text>
		),
	},
};

export const WithSubtitle: Story = {
	args: {
		title: 'Page title',
		subTitle: 'All of the subtitle text you need goes here.',
		showSidebarToggle: false,
		children: (
			<Text style={ { padding: '24px 24px' } }>Page content here</Text>
		),
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
		children: (
			<Text style={ { padding: '24px 24px' } }>Page content here</Text>
		),
	},
};
