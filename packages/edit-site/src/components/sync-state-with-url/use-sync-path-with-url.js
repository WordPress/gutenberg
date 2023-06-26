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

const { useLocation, useHistory } = unlock( routerPrivateApis );

export function getPathFromURL( urlParams ) {
	let path = urlParams?.path ?? '/';

	// Compute the navigator path based on the URL params.
	if ( urlParams?.postType && urlParams?.postId ) {
		switch ( urlParams.postType ) {
			case 'wp_block':
			case 'wp_template':
			case 'wp_template_part':
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

export default function useSyncPathWithURL() {
	const history = useHistory();
	const { params: urlParams } = useLocation();
	const {
		location: navigatorLocation,
		params: navigatorParams,
		goTo,
	} = useNavigator();
	const currentUrlParams = useRef( urlParams );
	const currentPath = useRef( navigatorLocation.path );
	const isMounting = useRef( true );

	useEffect( () => {
		// The navigatorParams are only initially filled properly when the
		// navigator screens mount. so we ignore the first synchronisation.
		if ( isMounting.current ) {
			isMounting.current = false;
			return;
		}

		function updateUrlParams( newUrlParams ) {
			if (
				Object.entries( newUrlParams ).every( ( [ key, value ] ) => {
					return currentUrlParams.current[ key ] === value;
				} )
			) {
				return;
			}
			const updatedParams = {
				...currentUrlParams.current,
				...newUrlParams,
			};
			currentUrlParams.current = updatedParams;
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
		} else if ( navigatorLocation.path === '/library' ) {
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
	}, [ navigatorLocation?.path, navigatorParams, history ] );

	useEffect( () => {
		currentUrlParams.current = urlParams;
		const path = getPathFromURL( urlParams );
		if ( currentPath.current !== path ) {
			currentPath.current = path;
			goTo( path );
		}
	}, [ urlParams, goTo ] );
}
