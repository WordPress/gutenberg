/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import {
	STORE_NAME,
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
				blockEditorStore
			).getBlockSelectionStart(),
			isEditorSidebarOpened: select( STORE_NAME ).isEditorSidebarOpened(),
		} ),
		[ postId ]
	);

	const { openGeneralSidebar } = useDispatch( STORE_NAME );

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
 * This listener hook monitors any change in permalink and updates the view
 * post link in the admin bar.
 *
 * @param {number} postId
 */
export const useUpdatePostLinkListener = ( postId ) => {
	const { newPermalink } = useSelect(
		( select ) => ( {
			newPermalink: select( editorStore ).getCurrentPost().link,
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
