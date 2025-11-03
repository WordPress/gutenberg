/**
 * External dependencies
 */
import {
	createRouter,
	createRootRoute,
	createRoute,
	RouterProvider,
	createBrowserHistory,
	type AnyRoute,
} from '@tanstack/react-router';
import { parseHref } from '@tanstack/history';
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { lazy, Suspense, useMemo } from '@wordpress/element';
import { Page } from '@wordpress/admin-ui';

/**
 * Internal dependencies
 */
import Root from '../root';
import type { Route, RouteLoaderContext } from '../../store/types';
import * as homeRoute from '../home';

// Not found component
function NotFoundComponent() {
	return (
		<div className="boot-layout__stage">
			<Page title={ __( 'Route not found' ) } hasPadding>
				{ __( "The page you're looking for does not exist" ) }
			</Page>
		</div>
	);
}

function RouteComponent( {
	stage: Stage,
	inspector: Inspector,
}: {
	stage?: ComponentType;
	inspector?: ComponentType;
} ) {
	return (
		<>
			{ Stage && (
				<div className="boot-layout__stage">
					<Suspense fallback={ <div>Loading...</div> }>
						<Stage />
					</Suspense>
				</div>
			) }
			{ Inspector && (
				<div className="boot-layout__inspector">
					<Suspense fallback={ <div>Loading...</div> }>
						<Inspector />
					</Suspense>
				</div>
			) }
		</>
	);
}

/**
 * Creates a TanStack route from a Route definition.
 *
 * @param route       Route configuration
 * @param parentRoute Parent route.
 * @return Tanstack Route.
 */
function createRouteFromDefinition( route: Route, parentRoute: AnyRoute ) {
	if ( ! route.content && ! route.content_module ) {
		throw new Error( 'Route must have content or content_module property' );
	}

	// Create lazy components for stage and inspector surfaces
	const SurfacesModule = route.content
		? () => <RouteComponent { ...route.content } />
		: lazy( async () => {
				const module = await import( route.content_module as string );
				// Return a component that renders the surfaces
				return {
					default: () => (
						<RouteComponent
							stage={ module.stage }
							inspector={ module.inspector }
						/>
					),
				};
		  } );

	return createRoute( {
		getParentRoute: () => parentRoute,
		path: route.path,
		beforeLoad: route.beforeLoad
			? async ( opts: any ) => {
					const context: RouteLoaderContext = {
						params: opts.params || {},
						search: opts.search || {},
					};
					await route.beforeLoad?.( context );
			  }
			: undefined,
		loader: route.loader
			? async ( opts: any ) => {
					const context: RouteLoaderContext = {
						params: opts.params || {},
						search: opts.search || {},
					};
					return await route.loader?.( context );
			  }
			: undefined,
		component: SurfacesModule,
	} );
}

/**
 * Creates a route tree from route definitions.
 *
 * @param routes Routes definition.
 * @return Router tree.
 */
function createRouteTree( routes: Route[] ) {
	const rootRoute = createRootRoute( {
		component: Root,
		context: () => ( {} ),
	} );

	// Create home route using the route system
	const homeRouteDefinition: Route = {
		path: '/',
		content: homeRoute,
	};

	// Create routes from definitions including home
	const allRoutes = [ homeRouteDefinition, ...routes ];
	const dynamicRoutes = allRoutes.map( ( route ) =>
		createRouteFromDefinition( route, rootRoute )
	);

	return rootRoute.addChildren( dynamicRoutes );
}

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

interface RouterProps {
	routes: Route[];
}

export default function Router( { routes }: RouterProps ) {
	// Create router with dynamic routes
	const router = useMemo( () => {
		const history = createPathHistory();
		const routeTree = createRouteTree( routes );

		return createRouter( {
			history,
			routeTree,
			defaultNotFoundComponent: NotFoundComponent,
		} );
	}, [ routes ] );

	return <RouterProvider router={ router } />;
}
