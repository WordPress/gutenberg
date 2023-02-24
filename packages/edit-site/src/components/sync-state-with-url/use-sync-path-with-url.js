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
	const { params: urlParams } = useLocation();
	const {
		location: navigatorLocation,
		params: navigatorParams,
		goTo,
	} = useNavigator();
	const currentUrlParams = useRef( urlParams );
	const currentPath = useRef();

	useEffect( () => {
		// Don't trust the navigator path on initial render.
		if ( currentPath.current === null ) {
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
		} else if ( navigatorParams?.postType && ! navigatorParams?.postId ) {
			updateUrlParams( {
				postType: navigatorParams?.postType,
				path: navigatorLocation.path,
				postId: undefined,
			} );
		} else {
			updateUrlParams( {
				postType: undefined,
				postId: undefined,
				path: navigatorLocation.path,
			} );
		}
	}, [ navigatorLocation?.path, navigatorParams, history ] );

	useEffect( () => {
		currentUrlParams.current = urlParams;
		let path = urlParams?.path ?? '/';

		// Compute the navigator path based on the URL params.
		if (
			urlParams?.postType &&
			urlParams?.postId &&
			// This is just a special case to support old WP versions that perform redirects.
			// This code should be removed when we minimum WP version becomes 6.2.
			urlParams?.postId !== 'none'
		) {
			switch ( urlParams.postType ) {
				case 'wp_template':
				case 'wp_template_part':
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

		if ( currentPath.current !== path ) {
			currentPath.current = path;
			goTo( path );
		}
		goTo( path );
	}, [ urlParams, goTo ] );
}
