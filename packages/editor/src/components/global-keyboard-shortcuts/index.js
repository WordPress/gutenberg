import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as editorStore } from '../../store';
import { getNextDeviceType } from '../../utils/device-type';
import { unlock } from '../../lock-unlock';

const { usesNativeUndo } = unlock( blockEditorPrivateApis );

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
	// Mirrors when the header's device preview dropdown is hidden or disabled.
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isStylesCanvasActive = useSelect( ( select ) => {
		const { getStylesPath, getShowStylebook } = unlock(
			select( editorStore )
		);
		return (
			!! getStylesPath()?.startsWith( '/revisions' ) || getShowStylebook()
		);
	}, [] );
	const { getBlockSelectionStart, getSettings } =
		useSelect( blockEditorStore );
	const { resetZoomLevel } = unlock( useDispatch( blockEditorStore ) );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	const {
		redo,
		undo,
		savePost,
		setDeviceType,
		setIsListViewOpened,
		switchEditorMode,
		toggleDistractionFree,
	} = useDispatch( editorStore );
	const {
		isEditedPostDirty,
		isPostSavingLocked,
		isListViewOpened,
		getDeviceType,
		getEditorMode,
		isSavingNonPostEntityChanges,
	} = useSelect( editorStore );

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

	useShortcut(
		'core/editor/cycle-device-type',
		( event ) => {
			event.preventDefault();
			setDeviceType(
				getNextDeviceType(
					getDeviceType(),
					getSettings().__experimentalFeatures?.viewport
				)
			);
			resetZoomLevel();
		},
		{
			isDisabled: isMobileViewport || isStylesCanvasActive,
		}
	);

	useShortcut( 'core/editor/toggle-distraction-free', () => {
		toggleDistractionFree();
	} );

	useShortcut( 'core/editor/undo', ( event ) => {
		if ( usesNativeUndo( event ) ) {
			return;
		}
		undo();
		event.preventDefault();
	} );

	useShortcut( 'core/editor/redo', ( event ) => {
		if ( usesNativeUndo( event ) ) {
			return;
		}
		redo();
		event.preventDefault();
	} );

	useShortcut( 'core/editor/save', ( event ) => {
		event.preventDefault();

		/**
		 * Do not save the post if post saving is locked.
		 */
		if ( isPostSavingLocked() || isSavingNonPostEntityChanges() ) {
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

	return null;
}
