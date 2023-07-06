/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useEffect,
	useContext,
	startTransition,
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
			startTransition( () => {
				setLocation( getLocationWithParams( updatedLocation ) );
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
