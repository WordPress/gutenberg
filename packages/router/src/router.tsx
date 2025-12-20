/**
 * External dependencies
 */
import RouteRecognizer from 'route-recognizer';
import { createBrowserHistory } from 'history';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useSyncExternalStore,
	useMemo,
	useState,
	useEffect,
} from '@wordpress/element';
import {
	addQueryArgs,
	getQueryArgs,
	getPath,
	buildQueryString,
} from '@wordpress/url';
import { useEvent, usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { ReactNode } from 'react';

const history = createBrowserHistory();
interface Route {
	name: string;
	path: string;
	areas: Record< string, ReactNode >;
	widths: Record< string, number >;
}

type LocationWithQuery = Location & {
	query?: Record< string, any >;
};

interface Match {
	name: string;
	path: string;
	areas: Record< string, ReactNode >;
	widths: Record< string, number >;
	query?: Record< string, any >;
	params?: Record< string, any >;
}

export type BeforeNavigate = ( arg: {
	path: string;
	query: Record< string, any >;
} ) => {
	path: string;
	query: Record< string, any >;
};

interface Config {
	pathArg: string;
	beforeNavigate?: BeforeNavigate;
}

export interface NavigationOptions {
	transition?: string;
	state?: Record< string, any >;
}

const RoutesContext = createContext< Match | null >( null );
RoutesContext.displayName = 'RoutesContext';

export const ConfigContext = createContext< Config >( { pathArg: 'p' } );
ConfigContext.displayName = 'ConfigContext';

const locationMemo = new WeakMap();
function getLocationWithQuery() {
	const location = history.location;
	let locationWithQuery = locationMemo.get( location );
	if ( ! locationWithQuery ) {
		locationWithQuery = {
			...location,
			query: Object.fromEntries( new URLSearchParams( location.search ) ),
		};
		locationMemo.set( location, locationWithQuery );
	}
	return locationWithQuery;
}

export function useLocation() {
	const context = useContext( RoutesContext );
	if ( ! context ) {
		throw new Error( 'useLocation must be used within a RouterProvider' );
	}
	return context;
}

export function useHistory() {
	const { pathArg, beforeNavigate } = useContext( ConfigContext );

	const navigate = useEvent(
		async ( rawPath: string, options: NavigationOptions = {} ) => {
			const query = getQueryArgs( rawPath );
			const path = getPath( 'http://domain.com/' + rawPath ) ?? '';
			const performPush = () => {
				const result = beforeNavigate
					? beforeNavigate( { path, query } )
					: { path, query };
				return history.push(
					{
						search: buildQueryString( {
							[ pathArg ]: result.path,
							...result.query,
						} ),
					},
					options.state
				);
			};

			/*
			 * Skip transition in mobile, otherwise it crashes the browser.
			 * See: https://github.com/WordPress/gutenberg/pull/63002.
			 */
			const isMediumOrBigger =
				window.matchMedia( '(min-width: 782px)' ).matches;
			if (
				! isMediumOrBigger ||
				! document.startViewTransition ||
				! options.transition
			) {
				performPush();
				return;
			}

			await new Promise< void >( ( resolve ) => {
				const classname = options.transition ?? '';
				document.documentElement.classList.add( classname );
				const transition = document.startViewTransition( () =>
					performPush()
				);
				transition.finished.finally( () => {
					document.documentElement.classList.remove( classname );
					resolve();
				} );
			} );
		}
	);

	return useMemo(
		() => ( {
			navigate,
			back: history.back,
			invalidate: () => {
				history.replace( {
					search: history.location.search,
				} );
			},
		} ),
		[ navigate ]
	);
}

export default function useMatch(
	location: LocationWithQuery,
	matcher: RouteRecognizer,
	pathArg: string,
	matchResolverArgs: Record< string, any >
): Match | undefined {
	const { query: rawQuery = {} } = location;
	const [ resolvedMatch, setMatch ] = useState< Match | undefined >();

	useEffect( () => {
		const { [ pathArg ]: path = '/', ...query } = rawQuery;
		const ret = matcher.recognize( path )?.[ 0 ];
		async function resolveMatch( result: any ) {
			const matchedRoute = result.handler as Route;
			const resolveFunctions = async (
				record: Record< string, any > = {}
			) => {
				const entries = await Promise.all(
					Object.entries( record ).map( async ( [ key, value ] ) => {
						if ( typeof value === 'function' ) {
							return [
								key,
								await value( {
									query,
									params: result.params,
									...matchResolverArgs,
								} ),
							];
						}
						return [ key, value ];
					} )
				);
				return Object.fromEntries( entries );
			};
			const [ resolvedAreas, resolvedWidths ] = await Promise.all( [
				resolveFunctions( matchedRoute.areas ),
				resolveFunctions( matchedRoute.widths ),
			] );
			setMatch( {
				name: matchedRoute.name,
				areas: resolvedAreas,
				widths: resolvedWidths,
				params: result.params,
				query,
				path: addQueryArgs( path, query ),
			} );
		}

		if ( ! ret ) {
			setMatch( {
				name: '404',
				path: addQueryArgs( path, query ),
				areas: {},
				widths: {},
				query,
				params: {},
			} );
		} else {
			resolveMatch( ret );
		}

		return () => setMatch( undefined );
	}, [ matcher, rawQuery, pathArg, matchResolverArgs ] );

	return resolvedMatch;
}

export function RouterProvider( {
	routes,
	pathArg,
	beforeNavigate,
	children,
	matchResolverArgs,
}: {
	routes: Route[];
	pathArg: string;
	beforeNavigate?: BeforeNavigate;
	children: React.ReactNode;
	matchResolverArgs: Record< string, any >;
} ) {
	const location = useSyncExternalStore(
		history.listen,
		getLocationWithQuery,
		getLocationWithQuery
	);
	const matcher = useMemo( () => {
		const ret = new RouteRecognizer();
		( routes ?? [] ).forEach( ( route ) => {
			ret.add( [ { path: route.path, handler: route } ], {
				as: route.name,
			} );
		} );
		return ret;
	}, [ routes ] );
	const match = useMatch( location, matcher, pathArg, matchResolverArgs );
	const previousMatch = usePrevious( match );
	const config = useMemo(
		() => ( { beforeNavigate, pathArg } ),
		[ beforeNavigate, pathArg ]
	);
	const renderedMatch = match || previousMatch;

	if ( ! renderedMatch ) {
		return null;
	}

	return (
		<ConfigContext.Provider value={ config }>
			<RoutesContext.Provider value={ renderedMatch }>
				{ children }
			</RoutesContext.Provider>
		</ConfigContext.Provider>
	);
}
