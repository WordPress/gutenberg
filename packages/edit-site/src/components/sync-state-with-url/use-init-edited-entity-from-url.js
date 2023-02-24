/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useLocation } from '../routes';
import { store as editSiteStore } from '../../store';

export default function useInitEditedEntityFromURL() {
	const { params: { postId, postType } = {} } = useLocation();
	const { isRequestingSite, homepageId } = useSelect( ( select ) => {
		const { getSite } = select( coreDataStore );
		const siteData = getSite();

		return {
			isRequestingSite: ! siteData,
			homepageId:
				siteData?.show_on_front === 'page'
					? siteData.page_on_front
					: null,
		};
	}, [] );

	const { setTemplate, setTemplatePart, setPage } =
		useDispatch( editSiteStore );

	useEffect( () => {
		if (
			postType &&
			postId &&
			// This is just a special case to support old WP versions that perform redirects.
			// This code should be removed when we minimum WP version becomes 6.2.
			postId !== 'none'
		) {
			switch ( postType ) {
				case 'wp_template':
					setTemplate( postId );
					break;
				case 'wp_template_part':
					setTemplatePart( postId );
					break;
				default:
					setPage( {
						context: { postType, postId },
					} );
			}

			return;
		}

		// In all other cases, we need to set the home page in the site editor view.
		if ( homepageId ) {
			setPage( {
				context: { postType: 'page', postId: homepageId },
			} );
		} else if ( ! isRequestingSite ) {
			setPage( {
				path: '/',
			} );
		}
	}, [
		postId,
		postType,
		homepageId,
		isRequestingSite,
		setPage,
		setTemplate,
		setTemplatePart,
	] );
}
