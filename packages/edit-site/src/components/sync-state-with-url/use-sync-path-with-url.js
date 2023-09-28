/**
 * WordPress dependencies
 */
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_TYPES,
} from '../../utils/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export function getPathFromURL( urlParams ) {
	let path = urlParams?.path ?? '/';

	// Compute the navigator path based on the URL params.
	if ( urlParams?.postType && urlParams?.postId ) {
		switch ( urlParams.postType ) {
			case PATTERN_TYPES.user:
			case TEMPLATE_POST_TYPE:
			case TEMPLATE_PART_POST_TYPE:
			case 'page':
				path = `/${ encodeURIComponent(
					urlParams.postType
				) }/${ encodeURIComponent( urlParams.postId ) }`;
				break;
			default:
				path = `/navigation/${ encodeURIComponent(
					urlParams.postType
				) }/${ encodeURIComponent( urlParams.postId ) }`;
		}
	}

	return path;
}

function isSubset( subset, superset ) {
	return Object.entries( subset ).every( ( [ key, value ] ) => {
		return superset[ key ] === value;
	} );
}

export default function useSyncPathWithURL() {
	const history = useHistory();
	const { params: urlParams } = useLocation();
	const {
		location: navigatorLocation,
		params: navigatorParams,
		goTo,
	} = useNavigator();
	const isMounting = useRef( true );

	useEffect(
		() => {
			// The navigatorParams are only initially filled properly when the
			// navigator screens mount. so we ignore the first synchronisation.
			if ( isMounting.current ) {
				isMounting.current = false;
				return;
			}

			function updateUrlParams( newUrlParams ) {
				if ( isSubset( newUrlParams, urlParams ) ) {
					return;
				}
				const updatedParams = {
					...urlParams,
					...newUrlParams,
				};
				history.push( updatedParams );
			}

			if ( navigatorParams?.postType && navigatorParams?.postId ) {
				updateUrlParams( {
					postType: navigatorParams?.postType,
					postId: navigatorParams?.postId,
					path: undefined,
				} );
			} else if (
				navigatorLocation.path.startsWith( '/page/' ) &&
				navigatorParams?.postId
			) {
				updateUrlParams( {
					postType: 'page',
					postId: navigatorParams?.postId,
					path: undefined,
				} );
			} else if ( navigatorLocation.path === '/patterns' ) {
				updateUrlParams( {
					postType: undefined,
					postId: undefined,
					canvas: undefined,
					path: navigatorLocation.path,
				} );
			} else {
				updateUrlParams( {
					postType: undefined,
					postId: undefined,
					categoryType: undefined,
					categoryId: undefined,
					path:
						navigatorLocation.path === '/'
							? undefined
							: navigatorLocation.path,
				} );
			}
		},
		// Trigger only when navigator changes to prevent infinite loops.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ navigatorLocation?.path, navigatorParams ]
	);

	useEffect(
		() => {
			const path = getPathFromURL( urlParams );
			if ( navigatorLocation.path !== path ) {
				goTo( path );
			}
		},
		// Trigger only when URL changes to prevent infinite loops.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ urlParams ]
	);
}
