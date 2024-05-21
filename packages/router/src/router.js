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

const locationCache = new Map();
function getLocationWithParams( location ) {
	if ( locationCache.get( location.search ) ) {
		return locationCache.get( location.search );
	}
	const searchParams = new URLSearchParams( location.search );
	const ret = {
		...location,
		params: Object.fromEntries( searchParams.entries() ),
	};
	locationCache.clear();
	locationCache.set( location.search, ret );

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
