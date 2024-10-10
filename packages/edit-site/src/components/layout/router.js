/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	NAVIGATION_POST_TYPE,
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../utils/constants';
import { store as editSiteStore } from '../../store';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function useRedirectOldPaths() {
	const history = useHistory();
	const { params } = useLocation();
	useEffect( () => {
		const { postType, path, categoryType, ...rest } = params;

		if ( path === '/wp_template_part/all' ) {
			history.replace( { postType: TEMPLATE_PART_POST_TYPE } );
		}

		if ( path === '/page' ) {
			history.replace( {
				postType: 'page',
				...rest,
			} );
		}

		if ( path === '/wp_template' ) {
			history.replace( {
				postType: TEMPLATE_POST_TYPE,
				...rest,
			} );
		}

		if ( path === '/patterns' ) {
			history.replace( {
				postType:
					categoryType === TEMPLATE_PART_POST_TYPE
						? TEMPLATE_PART_POST_TYPE
						: PATTERN_TYPES.user,
				...rest,
			} );
		}

		if ( path === '/navigation' ) {
			history.replace( {
				postType: NAVIGATION_POST_TYPE,
				...rest,
			} );
		}
	}, [ history, params ] );
}

export default function useLayoutAreas() {
	const { params } = useLocation();
	useRedirectOldPaths();
	const routes = useSelect( ( select ) => {
		return unlock( select( editSiteStore ) ).getRoutes();
	}, [] );
	const matchedRoute = routes.find( ( route ) => route.match( params ) );
	if ( ! matchedRoute ) {
		return {
			key: 404,
			areas: {},
			widths: {},
		};
	}

	return {
		key: matchedRoute.name,
		areas: matchedRoute.areas,
		widths: matchedRoute.widths,
	};
}
