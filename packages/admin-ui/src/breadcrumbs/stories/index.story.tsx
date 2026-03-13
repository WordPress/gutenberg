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

/**
 * Internal dependencies
 */
import Breadcrumbs from '..';

const rootRoute = createRootRoute( {
	notFoundComponent: () => null,
} );
const router = createRouter( {
	routeTree: rootRoute,
	history: createMemoryHistory( { initialEntries: [ '/' ] } ),
	defaultNotFoundComponent: () => null,
} );

const meta: Meta< typeof Breadcrumbs > = {
	component: Breadcrumbs,
	title: 'Admin UI/Breadcrumbs',
	decorators: [
		( Story ) => (
			<RouterContextProvider router={ router }>
				<Story />
			</RouterContextProvider>
		),
	],
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
