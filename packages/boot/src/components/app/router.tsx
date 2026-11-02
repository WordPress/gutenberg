import type { ComponentType } from 'react';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { Page } from '@wordpress/admin-ui';
import {
	privateApis as routePrivateApis,
	type AnyRoute,
	type AnyRouter,
} from '@wordpress/route';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import Root from '../root';
import styles from '../root/style.module.scss';
import ErrorBoundary from '../error-boundary';
import type { Route, RouteConfig, RouteLoaderContext } from '../../store/types';
import { unlock } from '../../lock-unlock';
import { getPageKey } from './page-key';
import { PageScope } from './page-visibility';

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

/**
 * Creates a browser history that reads the route from the `?p=` query
 * argument.
 *
 * Several apps can share one document (see `startAdminShell`). Each app's
 * history belongs to one wp-admin page. While the URL points at another page:
 *
 * - the history keeps returning the location it last saw on its own page and
 *   does not notify its router, so a hidden app ignores the visible app's
 *   navigation and resumes from the URL when it is shown again;
 * - links it creates still point at its own page;
 * - its own navigation doesn't write to the URL, so a hidden app can't change
 *   the address of the page that is showing.
 *
 * @param pageKey Page this history belongs to. See `getPageKey`.
 */
function createPathHistory( pageKey: string ) {
	let lastOwnLocation: ReturnType< typeof parseHref > | undefined;
	// The page's own URL, without its route, to build links from while
	// another page is showing.
	let ownPageUrl = new URL( window.location.href );
	const isOwnUrl = () => getPageKey() === pageKey;

	const history = createBrowserHistory( {
		parseLocation: () => {
			if ( ! isOwnUrl() && lastOwnLocation ) {
				return lastOwnLocation;
			}
			const url = new URL( window.location.href );
			ownPageUrl = url;
			const path = url.searchParams.get( 'p' ) || '/';
			const pathHref = `${ path }${ url.hash }`;
			lastOwnLocation = parseHref( pathHref, window.history.state );
			return lastOwnLocation;
		},
		createHref: ( href: string ) => {
			const base = isOwnUrl()
				? new URL( window.location.href )
				: ownPageUrl;
			const searchParams = new URLSearchParams( base.search );
			searchParams.set( 'p', href );
			return `${ base.pathname }?${ searchParams }`;
		},
	} );

	// Only the app whose page is in the URL reacts to history changes.
	type Subscriber = ( ...args: unknown[] ) => void;
	const subscribe: ( callback: Subscriber ) => () => void = history.subscribe;
	history.subscribe = ( callback: Subscriber ) =>
		subscribe( ( ...args ) => {
			if ( isOwnUrl() ) {
				callback( ...args );
			}
		} );

	// Only the app whose page is in the URL writes to it.
	for ( const method of [ 'push', 'replace' ] as const ) {
		const write: ( ...args: unknown[] ) => void = history[ method ];
		history[ method ] = ( ...args: unknown[] ) => {
			if ( isOwnUrl() ) {
				write( ...args );
			}
		};
	}

	return history;
}

/*
 * One history per page, reused when the admin shell mounts a page again
 * after unmounting it. A browser history adds window listeners and wraps
 * `history.pushState` when it is created, and can't safely undo that while
 * other pages' histories have wrapped it since, so a new history on every
 * mount would leak both.
 */
const pathHistories = new Map<
	string,
	ReturnType< typeof createPathHistory >
>();

function getPathHistory( pageKey: string ) {
	let history = pathHistories.get( pageKey );
	if ( ! history ) {
		history = createPathHistory( pageKey );
		pathHistories.set( pageKey, history );
	}
	return history;
}

interface RouterProps {
	routes: Route[];
	rootComponent?: ComponentType;
	/**
	 * wp-admin page the router belongs to. Defaults to the page in the URL
	 * when the router is created.
	 */
	pageKey?: string;
}

/*
 * The router of each page, reused when the admin shell mounts the page again
 * with the same routes. Every router adds a document scroll listener for
 * scroll restoration that is never removed, and that listener keeps the
 * router, its routes and its loaded data in memory.
 */
const pageRouters = new Map<
	string,
	{ routes: Route[]; rootComponent: ComponentType; router: AnyRouter }
>();

function createPageRouter(
	pageKey: string,
	routes: Route[],
	rootComponent: ComponentType
) {
	const history = getPathHistory( pageKey );
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
}

export default function Router( {
	routes,
	rootComponent = Root,
	pageKey,
}: RouterProps ) {
	const ownPageKey = useMemo( () => pageKey ?? getPageKey(), [ pageKey ] );
	const router = useMemo( () => {
		const existing = pageRouters.get( ownPageKey );
		if (
			existing &&
			existing.routes === routes &&
			existing.rootComponent === rootComponent
		) {
			return existing.router;
		}
		const pageRouter = createPageRouter(
			ownPageKey,
			routes,
			rootComponent
		);
		pageRouters.set( ownPageKey, {
			routes,
			rootComponent,
			router: pageRouter,
		} );
		return pageRouter;
	}, [ routes, rootComponent, ownPageKey ] );

	return (
		<PageScope pageKey={ ownPageKey }>
			<RouterProvider router={ router } />
		</PageScope>
	);
}
