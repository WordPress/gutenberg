/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	STORE_KEY,
	VIEW_AS_LINK_SELECTOR,
	VIEW_AS_PREVIEW_LINK_SELECTOR,
} from '../../store/constants';

/**
 * This listener hook monitors for block selection and triggers the appropriate
 * sidebar state.
 *
 * @param {number} postId  The current post id.
 */
export const useBlockSelectionListener = ( postId ) => {
	const { hasBlockSelection, isEditorSidebarOpened } = useSelect(
		( select ) => ( {
			hasBlockSelection: !! select(
				'core/block-editor'
			).getBlockSelectionStart(),
			isEditorSidebarOpened: select( STORE_KEY ).isEditorSidebarOpened(),
		} ),
		[ postId ]
	);

	const { openGeneralSidebar } = useDispatch( STORE_KEY );

	useEffect( () => {
		if ( ! isEditorSidebarOpened ) {
			return;
		}
		if ( hasBlockSelection ) {
			openGeneralSidebar( 'edit-post/block' );
		} else {
			openGeneralSidebar( 'edit-post/document' );
		}
	}, [ hasBlockSelection, isEditorSidebarOpened ] );
};

/**
 * This listener hook is used to monitor viewport size and adjust the sidebar
 * accordingly.
 *
 * @param {number} postId  The current post id.
 */
export const useAdjustSidebarListener = ( postId ) => {
	const { isSmall, activeGeneralSidebarName } = useSelect(
		( select ) => ( {
			isSmall: select( 'core/viewport' ).isViewportMatch( '< medium' ),
			activeGeneralSidebarName: select(
				STORE_KEY
			).getActiveGeneralSidebarName(),
		} ),
		[ postId ]
	);

	const { openGeneralSidebar, closeGeneralSidebar } = useDispatch(
		STORE_KEY
	);

	const previousIsSmall = useRef( null );
	const sidebarToReOpenOnExpand = useRef( null );

	useEffect( () => {
		if ( previousIsSmall.current === isSmall ) {
			return;
		}
		previousIsSmall.current = isSmall;

		if ( isSmall ) {
			sidebarToReOpenOnExpand.current = activeGeneralSidebarName;
			if ( activeGeneralSidebarName ) {
				closeGeneralSidebar();
			}
		} else if (
			sidebarToReOpenOnExpand.current &&
			! activeGeneralSidebarName
		) {
			openGeneralSidebar( sidebarToReOpenOnExpand.current );
			sidebarToReOpenOnExpand.current = null;
		}
	}, [ isSmall, activeGeneralSidebarName ] );
};

/**
 * This listener hook monitors any change in permalink and updates the view
 * post link in the admin bar.
 *
 * @param {number} postId
 */
export const useUpdatePostLinkListener = ( postId ) => {
	const { newPermalink } = useSelect(
		( select ) => ( {
			newPermalink: select( 'core/editor' ).getCurrentPost().link,
		} ),
		[ postId ]
	);
	const nodeToUpdate = useRef();

	useEffect( () => {
		nodeToUpdate.current =
			document.querySelector( VIEW_AS_PREVIEW_LINK_SELECTOR ) ||
			document.querySelector( VIEW_AS_LINK_SELECTOR );
	}, [ postId ] );

	useEffect( () => {
		if ( ! newPermalink || ! nodeToUpdate.current ) {
			return;
		}
		nodeToUpdate.current.setAttribute( 'href', newPermalink );
	}, [ newPermalink ] );
};
