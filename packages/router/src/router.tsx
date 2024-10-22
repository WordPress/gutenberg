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
import type { EnhancedHistory } from './history';

const RoutesContext = createContext< Location | null >( null );
const HistoryContext = createContext< EnhancedHistory >( history );

export function useLocation() {
	return useContext( RoutesContext );
}

export function useHistory() {
	return useContext( HistoryContext );
}

export function RouterProvider( { children }: { children: React.ReactNode } ) {
	const location = useSyncExternalStore(
		history.listen,
		history.getLocationWithParams,
		history.getLocationWithParams
	);

	return (
		<HistoryContext.Provider value={ history }>
			<RoutesContext.Provider value={ location }>
				{ children }
			</RoutesContext.Provider>
		</HistoryContext.Provider>
	);
}
