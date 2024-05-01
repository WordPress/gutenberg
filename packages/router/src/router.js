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
		// `/wp_template_part/all` path is no longer used and redirects to
		// Patterns page for backward compatibility.
		const { path } = location?.params;

		if ( path === '/wp_template_part/all' ) {
			history.push( {
				path: '/patterns',
			} );
			setLocation( {
				...location,
				params: {
					path: '/patterns',
				},
			} );
		}

		return history.listen( ( { location: updatedLocation } ) => {
			setLocation( getLocationWithParams( updatedLocation ) );
		} );
	}, [ location ] );

	return (
		<HistoryContext.Provider value={ history }>
			<RoutesContext.Provider value={ location }>
				{ children }
			</RoutesContext.Provider>
		</HistoryContext.Provider>
	);
}
