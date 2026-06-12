/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Handles the keyboard shortcuts for the editor.
 *
 * It provides functionality for various keyboard shortcuts such as toggling editor mode,
 * toggling distraction-free mode, undo/redo, saving the post, toggling list view,
 * and toggling the sidebar.
 */
export default function EditorKeyboardShortcuts() {
	const isModeToggleDisabled = useSelect( ( select ) => {
		const { richEditingEnabled, codeEditingEnabled } =
			select( editorStore ).getEditorSettings();
		return ! richEditingEnabled || ! codeEditingEnabled;
	}, [] );
	const { getBlockSelectionStart } = useSelect( blockEditorStore );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	const {
		redo,
		undo,
		savePost,
		setIsListViewOpened,
		switchEditorMode,
		toggleDistractionFree,
	} = useDispatch( editorStore );
	const {
		isEditedPostDirty,
		isPostSavingLocked,
		isListViewOpened,
		getEditorMode,
		getCurrentPostId,
		getCurrentPostType,
	} = useSelect( editorStore );
	const { getEditedEntityRecord } = useSelect( coreStore );
	const { createNotice } = useDispatch( noticesStore );

	useShortcut(
		'core/editor/toggle-mode',
		() => {
			switchEditorMode(
				getEditorMode() === 'visual' ? 'text' : 'visual'
			);
		},
		{
			isDisabled: isModeToggleDisabled,
		}
	);

	useShortcut( 'core/editor/toggle-distraction-free', () => {
		toggleDistractionFree();
	} );

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

	useShortcut( 'core/editor/toggle-sidebar', ( event ) => {
		// This shortcut has no known clashes, but use preventDefault to prevent any
		// obscure shortcuts from triggering.
		event.preventDefault();
		const isEditorSidebarOpened = [
			'edit-post/document',
			'edit-post/block',
		].includes( getActiveComplementaryArea( 'core' ) );

		if ( isEditorSidebarOpened ) {
			disableComplementaryArea( 'core' );
		} else {
			const sidebarToOpen = getBlockSelectionStart()
				? 'edit-post/block'
				: 'edit-post/document';
			enableComplementaryArea( 'core', sidebarToOpen );
		}
	} );

	useShortcut( 'core/editor/copy-all', ( event ) => {
		event.preventDefault();

		const record = getEditedEntityRecord(
			'postType',
			getCurrentPostType(),
			getCurrentPostId()
		);

		if ( ! record ) {
			return;
		}

		let content = '';

		// If the record has blocks, serialize them.
		if ( record.blocks ) {
			content = __unstableSerializeAndClean( record.blocks );
			// If the record has content, use it.
		} else if ( record.content ) {
			content = record.content;
		}

		if ( ! content ) {
			return;
		}

		// Copy to clipboard.
		window?.navigator?.clipboard?.writeText( content ).then( () => {
			createNotice( 'info', __( 'All blocks copied.' ), {
				isDismissible: true,
				type: 'snackbar',
			} );
		} );
	} );

	return null;
}
