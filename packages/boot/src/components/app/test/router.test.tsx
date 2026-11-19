import { expect, test, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import Router from '../router';

const { createRoute, getEntityRecord } = vi.hoisted( () => ( {
	createRoute: vi.fn(),
	getEntityRecord: vi.fn(),
} ) );

// @ts-expect-error The stub provides only the selector used by the loader.
vi.mock( import( '@wordpress/data' ), () => ( {
	resolveSelect: () => ( { getEntityRecord } ),
} ) );
// @ts-expect-error The stub uses an empty store descriptor.
vi.mock( import( '@wordpress/core-data' ), () => ( { store: {} } ) );
// @ts-expect-error The stub omits Page's static properties.
vi.mock( import( '@wordpress/admin-ui' ), () => ( { Page: () => null } ) );
// @ts-expect-error The stub renders nothing instead of the root element.
vi.mock( import( '../../root' ), () => ( { default: () => null } ) );
// @ts-expect-error The stub replaces the error boundary class with a function.
vi.mock( import( '../../error-boundary' ), () => ( { default: () => null } ) );
// @ts-expect-error The stub returns its input without a generic type assertion.
vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( value: unknown ) => value,
} ) );
vi.mock( import( '@wordpress/route' ), () => ( {
	privateApis: {
		createRoute,
		createRootRoute: () => ( { addChildren: vi.fn() } ),
		createBrowserHistory: vi.fn(),
		createRouter: vi.fn(),
		RouterProvider: () => null,
	},
} ) );

test( 'loads a route when the site data request fails', async () => {
	createRoute.mockReturnValue( { lazy: vi.fn().mockReturnThis() } );
	getEntityRecord.mockRejectedValue( { code: 'http_request_failed' } );

	renderToString(
		<Router routes={ [ { path: '/', content_module: 'test-page' } ] } />
	);

	const { loader } = createRoute.mock.calls[ 0 ][ 0 ];
	await expect( loader( {} ) ).resolves.toEqual( {
		canvas: undefined,
		inspector: true,
		stage: true,
		title: undefined,
		routeContentModule: 'test-page',
	} );
	expect( getEntityRecord ).toHaveBeenCalledWith( 'root', '__unstableBase' );
} );
