import type { ComponentType } from 'react';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { Page } from '@wordpress/admin-ui';
import {
	privateApis as routePrivateApis,
	type AnyRoute,
} from '@wordpress/route';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import Root from '../root';
import styles from '../root/style.module.scss';
import ErrorBoundary from '../error-boundary';
import type { Route, RouteConfig, RouteLoaderContext } from '../../store/types';
import { unlock } from '../../lock-unlock';

const {
	createLazyRoute,
	createRouter,
	createRootRoute,
	createRoute,
	RouterProvider,
	createBrowserHistory,
	parseHref,
	useLoaderData,
} = unlock( routePrivateApis );

// Not found component
function NotFoundComponent() {
	return (
		<div className={ styles.stage }>
			<Page title={ __( 'Route not found' ) } hasPadding>
				{ __( "The page you're looking for does not exist" ) }
			</Page>
		</div>
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
	// Create route without component initially
	let tanstackRoute = createRoute( {
		getParentRoute: () => parentRoute,
		path: route.path,
		beforeLoad: async ( opts: any ) => {
			// Import route module here (lazy)
			if ( route.route_module ) {
				const module = await import( route.route_module );
				const routeConfig = module.route || {};

				if ( routeConfig.beforeLoad ) {
					return routeConfig.beforeLoad( {
						params: opts.params || {},
						search: opts.search || {},
					} );
				}
			}
		},
		loader: async ( opts: any ) => {
			// Import route module here (lazy)
			let routeConfig: RouteConfig = {};
			if ( route.route_module ) {
				const module = await import( route.route_module );
				routeConfig = module.route || {};
			}

			const context: RouteLoaderContext = {
				params: opts.params || {},
				search: opts.deps || {},
			};

			const [ , loaderData, canvasData, titleData ] = await Promise.all( [
				resolveSelect( coreStore ).getEntityRecord(
					'root',
					'__unstableBase'
				),
				routeConfig.loader
					? routeConfig.loader( context )
					: Promise.resolve( undefined ),
				routeConfig.canvas
					? routeConfig.canvas( context )
					: Promise.resolve( undefined ),
				routeConfig.title
					? routeConfig.title( context )
					: Promise.resolve( undefined ),
			] );

			let inspector = true;
			if ( routeConfig.inspector ) {
				inspector = await routeConfig.inspector( context );
			}

			let stage = true;
			if ( routeConfig.stage ) {
				stage = await routeConfig.stage( context );
			}

			return {
				...( loaderData as any ),
				canvas: canvasData,
				inspector,
				stage,
				title: titleData,
				routeContentModule: route.content_module,
			};
		},
		loaderDeps: ( opts: any ) => opts.search,
	} );

	// Chain .lazy() to preload content module on intent
	tanstackRoute = tanstackRoute.lazy( async () => {
		const module = route.content_module
			? await import( route.content_module )
			: {};

		const Stage = module.stage;
		const Inspector = module.inspector;

		return createLazyRoute( route.path )( {
			component: function RouteComponent() {
				const { inspector: showInspector, stage: showStage } =
					useLoaderData( { from: route.path } ) ?? {};

				return (
					<>
						{ Stage && showStage && (
							<div className={ styles.stage }>
								<ErrorBoundary>
									<Stage />
								</ErrorBoundary>
							</div>
						) }
						{ Inspector && showInspector && (
							<div className={ styles.inspector }>
								<ErrorBoundary>
									<Inspector />
								</ErrorBoundary>
							</div>
						) }
					</>
				);
			},
		} );
	} );

	return tanstackRoute;
}

/**
 * Creates a route tree from route definitions.
 *
 * @param routes        Routes definition.
 * @param rootComponent Root component to use for the router.
 * @return Router tree.
 */
function createRouteTree(
	routes: Route[],
	rootComponent: ComponentType = Root
) {
	const rootRoute = createRootRoute( {
		component: rootComponent as any,
		context: () => ( {} ),
	} );

	// Create routes from definitions (now synchronous)
	const dynamicRoutes = routes.map( ( route ) =>
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
		createHref: ( href: string ) => {
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
	const router = useMemo( () => {
		const history = createPathHistory();
		const routeTree = createRouteTree( routes, rootComponent );

		return createRouter( {
			history,
			routeTree,
			defaultPreload: 'intent',
			defaultNotFoundComponent: NotFoundComponent,
			defaultViewTransition: {
				types: ( {
					fromLocation,
				}: {
					fromLocation?: unknown;
					toLocation: unknown;
					pathChanged: boolean;
					hrefChanged: boolean;
					hashChanged: boolean;
				} ) => {
					// Disable view transition on initial navigation (no previous location)
					if ( ! fromLocation ) {
						return false;
					}

					// Enable with navigation type for subsequent navigations
					return [ 'navigate' ];
				},
			},
		} );
	}, [ routes, rootComponent ] );

	return <RouterProvider router={ router } />;
}
