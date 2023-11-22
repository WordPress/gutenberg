/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import DisableNonPageContentBlocks from './disable-non-page-content-blocks';
import EditTemplateNotification from './edit-template-notification';
import BackToPageNotification from './back-to-page-notification';
import { unlock } from '../../lock-unlock';

export default function PageContentFocusManager( { contentRef } ) {
	const { hasPageContentFocus, pageContentFocusType, canvasMode } = useSelect(
		( select ) => {
			const { getPageContentFocusType, getCanvasMode } = unlock(
				select( editSiteStore )
			);
			const _canvasMode = getCanvasMode();
			return {
				canvasMode: _canvasMode,
				pageContentFocusType: getPageContentFocusType(),
				hasPageContentFocus:
					select( editSiteStore ).hasPageContentFocus(),
			};
		},
		[]
	);
	const { setPageContentFocusType } = unlock( useDispatch( editSiteStore ) );

	/*
	 * Ensure that the page content focus type is set to `disableTemplate` when
	 * the canvas mode is not `edit`. This makes the experience consistent with
	 * refreshing the page, which resets the page content focus type.
	 */
	useEffect( () => {
		if ( canvasMode !== 'edit' && !! pageContentFocusType ) {
			setPageContentFocusType( null );
		}
	}, [ canvasMode, pageContentFocusType ] );

	return (
		<>
			{ hasPageContentFocus && <DisableNonPageContentBlocks /> }
			<EditTemplateNotification contentRef={ contentRef } />
			<BackToPageNotification />
		</>
	);
}
