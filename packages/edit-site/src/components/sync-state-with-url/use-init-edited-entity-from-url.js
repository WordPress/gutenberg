/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import normalizeRecordKey from '../../utils/normalize-record-key';

const { useLocation } = unlock( routerPrivateApis );

export default function useInitEditedEntityFromURL() {
	const { params } = useLocation();

	const { postType } = params;

	const postId = normalizeRecordKey( params?.postId );

	const { isRequestingSite, homepageId, url } = useSelect( ( select ) => {
		const { getSite, getUnstableBase } = select( coreDataStore );
		const siteData = getSite();
		const base = getUnstableBase();

		return {
			isRequestingSite: ! base,
			homepageId:
				siteData?.show_on_front === 'page'
					? siteData.page_on_front
					: null,
			url: base?.home,
		};
	}, [] );

	const {
		setEditedEntity,
		setTemplate,
		setTemplatePart,
		setPage,
		setNavigationMenu,
	} = useDispatch( editSiteStore );

	useEffect( () => {
		if ( postType && postId ) {
			switch ( postType ) {
				case 'wp_template':
					setTemplate( postId );
					break;
				case 'wp_template_part':
					setTemplatePart( postId );
					break;
				case 'wp_navigation':
					setNavigationMenu( postId );
					break;
				case 'wp_block':
					setEditedEntity( postType, postId );
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
				context: { postType: 'page', postId: Number( homepageId ) },
			} );
		} else if ( ! isRequestingSite ) {
			setPage( {
				path: url,
			} );
		}
	}, [
		url,
		postId,
		postType,
		homepageId,
		isRequestingSite,
		setEditedEntity,
		setPage,
		setTemplate,
		setTemplatePart,
		setNavigationMenu,
	] );
}
