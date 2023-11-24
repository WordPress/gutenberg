/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import EditTemplateNotification from './edit-template-notification';
import BackToPageNotification from './back-to-page-notification';
import { unlock } from '../../lock-unlock';

export default function PageContentFocusNotifications( { contentRef } ) {
	const { pageContentFocusType, canvasMode } = useSelect( ( select ) => {
		const { getPageContentFocusType, getCanvasMode } = unlock(
			select( editSiteStore )
		);
		const _canvasMode = getCanvasMode();
		return {
			canvasMode: _canvasMode,
			pageContentFocusType: getPageContentFocusType(),
		};
	}, [] );
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
	}, [ canvasMode, pageContentFocusType, setPageContentFocusType ] );

	return (
		<>
			<EditTemplateNotification contentRef={ contentRef } />
			<BackToPageNotification />
		</>
	);
}
