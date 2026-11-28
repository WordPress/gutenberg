import type { Decorator } from '@storybook/react-vite';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../lock-unlock';

const { createMemoryHistory, createRootRoute, createRouter, RouterProvider } =
	unlock( routePrivateApis );

/**
 * Storybook decorator that provides a router context.
 *
 * Wraps stories in a minimal tanstack router (via `@wordpress/route` private
 * APIs) so that components consuming `Link` from `@wordpress/route` can
 * render without errors. The router starts at the story's `initialPath`
 * parameter, or at `/`.
 */
export const withRouter: Decorator = ( Story, { parameters } ) => {
	const rootRoute = createRootRoute( { component: Story } );
	const router = createRouter( {
		routeTree: rootRoute,
		history: createMemoryHistory( {
			initialEntries: [ parameters.initialPath ?? '/' ],
		} ),
		defaultNotFoundComponent: () => null,
	} );
	return <RouterProvider router={ router } />;
};
