/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import HistoryContext from './history-context';
import matchPath from './match-path';
import RouterContext from './router-context';

export function useHistory() {
	return useContext( HistoryContext );
}

export function useLocation() {
	return useContext( RouterContext )?.location;
}

export function useParams() {
	const match = useContext( RouterContext )?.match;
	return match ? match.params : {};
}

export function useRouteMatch( path ) {
	const location = useLocation();
	const match = useContext( RouterContext )?.match;
	return path ? matchPath( location.pathname, path ) : match;
}
