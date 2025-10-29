/**
 * External dependencies
 */
import {
	createRouter,
	createRootRoute,
	createRoute,
	RouterProvider,
	createBrowserHistory,
} from '@tanstack/react-router';
import { parseHref } from '@tanstack/history';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Root from '../root';
import Home from '../home';

// Not found component
function NotFoundComponent() {
	return (
		<div className="boot-layout__stage">
			<h1>{ __( 'Route not found' ) }</h1>
		</div>
	);
}

// Create root route
const rootRoute = createRootRoute( {
	component: Root,
} );

// Create home route
const homeRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/',
	component: Home,
} );

// Create route tree
const routeTree = rootRoute.addChildren( [ homeRoute ] );

// Create custom history that parses ?p= query parameter
function createPathHistory() {
	return createBrowserHistory( {
		parseLocation: () => {
			const url = new URL( window.location.href );
			const path = url.searchParams.get( 'p' ) || '/';
			const pathHref = `${ path }${ url.hash }`;
			return parseHref( pathHref, window.history.state );
		},
		createHref: ( href ) => {
			const searchParams = new URLSearchParams( window.location.search );
			searchParams.set( 'p', href );
			return `${ window.location.pathname }?${ searchParams }`;
		},
	} );
}

const history = createPathHistory();

// Create router
const router = createRouter( {
	history,
	routeTree,
	defaultNotFoundComponent: NotFoundComponent,
} );

export default function Router() {
	return <RouterProvider router={ router } />;
}
