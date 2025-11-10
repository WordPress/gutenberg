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
	redirect,
} from '@tanstack/react-router';
import { parseHref } from '@tanstack/history';
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { lazy, useState, useEffect } from '@wordpress/element';
import { Page } from '@wordpress/admin-ui';

/**
 * Internal dependencies
 */
import Root from '../root';
import type { Route, RouteLoaderContext } from '../../store/types';

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
					<Stage />
				</div>
			) }
			{ Inspector && (
				<div className="boot-layout__inspector">
					<Inspector />
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
async function createRouteFromDefinition(
	route: Route,
	parentRoute: AnyRoute
) {
	// Create lazy components for stage and inspector surfaces
	const SurfacesModule = route.content_module
		? lazy( async () => {
				const module = await import( route.content_module! );
				// Return a component that renders the surfaces
				return {
					default: () => (
						<RouteComponent
							stage={ module.stage }
							inspector={ module.inspector }
						/>
					),
				};
		  } )
		: () => null;

	// Load route module for lifecycle functions if specified
	let routeConfig: {
		beforeLoad?: (
			context: RouteLoaderContext & { redirect: Function }
		) => void | Promise< void >;
		loader?: ( context: RouteLoaderContext ) => Promise< unknown >;
		canvas?: ( context: RouteLoaderContext ) => Promise< any >;
	} = {};

	if ( route.route_module ) {
		const module = await import( route.route_module );
		routeConfig = module.route || {};
	}

	return createRoute( {
		getParentRoute: () => parentRoute,
		path: route.path,
		beforeLoad: routeConfig.beforeLoad
			? ( opts: any ) =>
					routeConfig.beforeLoad!( {
						params: opts.params || {},
						search: opts.search || {},
						redirect,
					} )
			: undefined,
		loader: async ( opts: any ) => {
			const context: RouteLoaderContext = {
				params: opts.params || {},
				search: opts.deps || {},
			};

			// Call both loader and canvas functions if they exist
			const [ loaderData, canvasData ] = await Promise.all( [
				routeConfig.loader
					? routeConfig.loader( context )
					: Promise.resolve( undefined ),
				routeConfig.canvas
					? routeConfig.canvas( context )
					: Promise.resolve( undefined ),
			] );

			return {
				...( loaderData as any ),
				canvas: canvasData,
			};
		},
		loaderDeps: ( opts: any ) => opts.search,
		component: SurfacesModule,
	} );
}

/**
 * Creates a route tree from route definitions.
 *
 * @param routes        Routes definition.
 * @param rootComponent Root component to use for the router.
 * @return Router tree.
 */
async function createRouteTree(
	routes: Route[],
	rootComponent: ComponentType = Root
) {
	const rootRoute = createRootRoute( {
		component: rootComponent as any,
		context: () => ( {} ),
	} );

	// Create routes from definitions
	const dynamicRoutes = await Promise.all(
		routes.map( ( route ) => createRouteFromDefinition( route, rootRoute ) )
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
	rootComponent?: ComponentType;
}

export default function Router( {
	routes,
	rootComponent = Root,
}: RouterProps ) {
	const [ router, setRouter ] = useState< any >( null );

	useEffect( () => {
		let cancelled = false;

		async function initializeRouter() {
			const history = createPathHistory();
			const routeTree = await createRouteTree( routes, rootComponent );

			if ( ! cancelled ) {
				const newRouter = createRouter( {
					history,
					routeTree,
					defaultNotFoundComponent: NotFoundComponent,
				} );
				setRouter( newRouter );
			}
		}

		initializeRouter();

		return () => {
			cancelled = true;
		};
	}, [ routes, rootComponent ] );

	if ( ! router ) {
		return <div>Loading routes...</div>;
	}

	return <RouterProvider router={ router } />;
}
