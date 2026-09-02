import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';

/**
 * Storybook decorator that provides a router context.
 *
 * Wraps stories in a minimal TanStack router so that components consuming
 * `Link` from `@wordpress/route` can render without errors.
 */
export function withRouter( Story: React.ComponentType ) {
	const rootRoute = createRootRoute( {
		component: function StoryRoute() {
			return <Story />;
		},
	} );
	const router = createRouter( {
		routeTree: rootRoute,
		history: createMemoryHistory( { initialEntries: [ '/' ] } ),
		defaultNotFoundComponent: () => null,
	} );
	return <RouterProvider router={ router } />;
}
