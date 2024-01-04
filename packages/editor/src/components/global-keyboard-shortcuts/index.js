/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function EditorKeyboardShortcuts() {
	const { redo, undo, savePost, setIsListViewOpened } =
		useDispatch( editorStore );
	const { isEditedPostDirty, isPostSavingLocked, isListViewOpened } =
		useSelect( editorStore );

	useShortcut( 'core/editor/undo', ( event ) => {
		undo();
		event.preventDefault();
	} );

	useShortcut( 'core/editor/redo', ( event ) => {
		redo();
		event.preventDefault();
	} );

	useShortcut( 'core/editor/save', ( event ) => {
		event.preventDefault();

		/**
		 * Do not save the post if post saving is locked.
		 */
		if ( isPostSavingLocked() ) {
			return;
		}

		// TODO: This should be handled in the `savePost` effect in
		// considering `isSaveable`. See note on `isEditedPostSaveable`
		// selector about dirtiness and meta-boxes.
		//
		// See: `isEditedPostSaveable`
		if ( ! isEditedPostDirty() ) {
			return;
		}

		savePost();
	} );

	// Only opens the list view. Other functionality for this shortcut happens in the rendered sidebar.
	useShortcut( 'core/editor/toggle-list-view', ( event ) => {
		if ( ! isListViewOpened() ) {
			event.preventDefault();
			setIsListViewOpened( true );
		}
	} );

	return null;
}
