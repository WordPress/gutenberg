import { expect, test, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import Router from '../router';

const { createRoute, getEntityRecord } = vi.hoisted( () => ( {
	createRoute: vi.fn(),
	getEntityRecord: vi.fn(),
} ) );

vi.mock( '@wordpress/data', () => ( {
	resolveSelect: () => ( { getEntityRecord } ),
} ) );
vi.mock( '@wordpress/core-data', () => ( { store: {} } ) );
vi.mock( '@wordpress/admin-ui', () => ( { Page: () => null } ) );
vi.mock( '../../root', () => ( { default: () => null } ) );
vi.mock( '../../error-boundary', () => ( { default: () => null } ) );
vi.mock( '../../../lock-unlock', () => ( {
	unlock: ( value: unknown ) => value,
} ) );
vi.mock( '@wordpress/route', () => ( {
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

	renderToString( <Router routes={ [ { path: '/', content_module: 'test-page' } ] } /> );

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
