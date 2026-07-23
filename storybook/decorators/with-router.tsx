import { privateApis as routePrivateApis } from '@wordpress/route';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/storybook'
);

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
