/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useEffect,
	useContext,
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

function getLocationWithParams( location ) {
	const searchParams = new URLSearchParams( location.search );
	return {
		...location,
		params: Object.fromEntries( searchParams.entries() ),
	};
}

export function RouterProvider( { children } ) {
	const [ location, setLocation ] = useState( () =>
		getLocationWithParams( history.location )
	);

	useEffect( () => {
		return history.listen( ( { location: updatedLocation } ) => {
			setLocation( ( currentLocation ) => {
				// Skip location update if query args are identical.
				if ( currentLocation.search === updatedLocation.search ) {
					return currentLocation;
				}

				return getLocationWithParams( updatedLocation );
			} );
		} );
	}, [] );

	return (
		<HistoryContext.Provider value={ history }>
			<RoutesContext.Provider value={ location }>
				{ children }
			</RoutesContext.Provider>
		</HistoryContext.Provider>
	);
}
