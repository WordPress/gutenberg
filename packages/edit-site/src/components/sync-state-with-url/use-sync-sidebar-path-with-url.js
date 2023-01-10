/**
 * WordPress dependencies
 */
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLocation, useHistory } from '../routes';

export default function useSyncSidebarPathWithURL() {
	const history = useHistory();
	const { params } = useLocation();
	const { sidebar = '/' } = params;
	const { location, goTo } = useNavigator();
	const currentSidebar = useRef( sidebar );
	const currentNavigatorLocation = useRef( location.path );
	useEffect( () => {
		currentSidebar.current = sidebar;
		if ( sidebar !== currentNavigatorLocation.current ) {
			goTo( sidebar );
		}
	}, [ sidebar ] );
	useEffect( () => {
		currentNavigatorLocation.current = location.path;
		if ( location.path !== currentSidebar.current ) {
			history.push( {
				...params,
				sidebar: location.path,
			} );
		}
	}, [ location.path, history ] );

	return sidebar;
}
