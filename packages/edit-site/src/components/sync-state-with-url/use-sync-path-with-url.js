/**
 * WordPress dependencies
 */
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLocation, useHistory } from '../routes';

export default function useSyncPathWithURL() {
	const history = useHistory();
	const { params } = useLocation();
	const { path = '/' } = params;
	const { location, goTo } = useNavigator();
	const currentPath = useRef( path );
	const currentNavigatorLocation = useRef( location.path );
	useEffect( () => {
		currentPath.current = path;
		if ( path !== currentNavigatorLocation.current ) {
			goTo( path );
		}
	}, [ path ] );
	useEffect( () => {
		currentNavigatorLocation.current = location.path;
		if ( location.path !== currentPath.current ) {
			history.push( {
				...params,
				path: location.path,
			} );
		}
	}, [ location.path, history ] );

	return path;
}
