/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useSyncExternalStore,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import history from './history';

const RoutesContext = createContext();
const HistoryContext = createContext();

export function useLocation() {
	return useContext( RoutesContext );
}

export function useHistory() {
	return useContext( HistoryContext );
}

const locationCache = new WeakMap();
function getLocationWithParams( location ) {
	if ( locationCache.get( location ) ) {
		return locationCache.get( location );
	}
	const searchParams = new URLSearchParams( location.search );
	const ret = {
		...location,
		params: Object.fromEntries( searchParams.entries() ),
	};
	locationCache.set( location, ret );

	return ret;
}

export function RouterProvider( { children } ) {
	const location = useSyncExternalStore( history.listen, () =>
		getLocationWithParams( history.location )
	);

	return (
		<HistoryContext.Provider value={ history }>
			<RoutesContext.Provider value={ location }>
				{ children }
			</RoutesContext.Provider>
		</HistoryContext.Provider>
	);
}
