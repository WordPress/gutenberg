/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';

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
 */
export const useBlockSelectionListener = () => {
	const { hasBlockSelection, isEditorSidebarOpened, isDistractionFree } =
		useSelect( ( select ) => {
			const { get } = select( preferencesStore );
			return {
				hasBlockSelection:
					!! select( blockEditorStore ).getBlockSelectionStart(),
				isEditorSidebarOpened:
					select( STORE_NAME ).isEditorSidebarOpened(),
				isDistractionFree: get( 'core', 'distractionFree' ),
			};
		}, [] );

	const { openGeneralSidebar } = useDispatch( STORE_NAME );

	useEffect( () => {
		if ( ! isEditorSidebarOpened || isDistractionFree ) {
			return;
		}
		if ( hasBlockSelection ) {
			openGeneralSidebar( 'edit-post/block' );
		} else {
			openGeneralSidebar( 'edit-post/document' );
		}
	}, [
		hasBlockSelection,
		isDistractionFree,
		isEditorSidebarOpened,
		openGeneralSidebar,
	] );
};

/**
 * This listener hook monitors any change in permalink and updates the view
 * post link in the admin bar.
 */
export const useUpdatePostLinkListener = () => {
	const { newPermalink } = useSelect(
		( select ) => ( {
			newPermalink: select( editorStore ).getCurrentPost().link,
		} ),
		[]
	);
	const nodeToUpdate = useRef();

	useEffect( () => {
		nodeToUpdate.current =
			document.querySelector( VIEW_AS_PREVIEW_LINK_SELECTOR ) ||
			document.querySelector( VIEW_AS_LINK_SELECTOR );
	}, [] );

	useEffect( () => {
		if ( ! newPermalink || ! nodeToUpdate.current ) {
			return;
		}
		nodeToUpdate.current.setAttribute( 'href', newPermalink );
	}, [ newPermalink ] );
};
