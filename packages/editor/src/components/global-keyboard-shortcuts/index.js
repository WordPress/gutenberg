/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function EditorKeyboardShortcuts() {
	const { redo, undo, savePost } = useDispatch( editorStore );
	const { isEditedPostDirty, isPostSavingLocked } = useSelect( editorStore );
	const { getLastFocus, getSelectedBlockClientId } =
		useSelect( blockEditorStore );

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

	useShortcut( 'core/block-editor/focus-editor', ( event ) => {
		event.preventDefault();
		const lastFocus = getLastFocus();
		// Only move focus if the selected block is a match with the last focused block
		if (
			getSelectedBlockClientId() &&
			lastFocus?.current &&
			lastFocus?.current.id.includes( getSelectedBlockClientId() )
		) {
			lastFocus.current.focus();
		}
	} );

	return null;
}
