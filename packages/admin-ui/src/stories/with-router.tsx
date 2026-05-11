/**
 * WordPress dependencies
 */
import { privateApis as routePrivateApis } from '@wordpress/route';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { createMemoryHistory, createRootRoute, createRouter, RouterProvider } =
	unlock( routePrivateApis );

/**
 * Storybook decorator that provides a router context.
 *
 * Wraps stories in a minimal tanstack router (via @wordpress/route private
 * APIs) so that components consuming `Link` from `@wordpress/route` can
 * render without errors.
 */
export function withRouter( Story: React.ComponentType ) {
	const rootRoute = createRootRoute( { component: Story } );
	const router = createRouter( {
		routeTree: rootRoute,
		history: createMemoryHistory( { initialEntries: [ '/' ] } ),
		defaultNotFoundComponent: () => null,
	} );
	return <RouterProvider router={ router } />;
}
