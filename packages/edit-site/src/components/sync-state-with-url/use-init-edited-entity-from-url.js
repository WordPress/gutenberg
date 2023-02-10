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
	const { params: { postId, path = '/' } = {} } = useLocation();
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
		switch ( path ) {
			case '/templates/single':
				setTemplate( postId );
				break;
			case '/template-parts/single':
				setTemplatePart( postId );
				break;
			default: {
				if ( homepageId ) {
					setPage( {
						context: { postType: 'page', postId: homepageId },
					} );
				} else if ( ! isRequestingSite ) {
					setPage( {
						path: '/',
					} );
				}
			}
		}
	}, [
		path,
		postId,
		homepageId,
		isRequestingSite,
		setPage,
		setTemplate,
		setTemplatePart,
	] );
}
