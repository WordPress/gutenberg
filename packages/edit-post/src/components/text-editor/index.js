/**
 * WordPress dependencies
 */
import {
	PostTextEditor,
	PostTitle,
	store as editorStore,
	TextEditorGlobalKeyboardShortcuts,
} from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { CodeEditorScreen } from '@wordpress/interface';
import { useCallback } from '@wordpress/element';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function TextEditor() {
	const { isRichEditingEnabled, shortcut } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		return {
			isRichEditingEnabled: getEditorSettings().richEditingEnabled,
			shortcut: getShortcutRepresentation( 'core/edit-post/toggle-mode' ),
		};
	}, [] );
	const { switchEditorMode } = useDispatch( editPostStore );
	const onExit = useCallback( () => switchEditorMode( 'visual' ), [
		switchEditorMode,
	] );
	return (
		<>
			<TextEditorGlobalKeyboardShortcuts />
			<CodeEditorScreen
				className="edit-post-text-editor"
				onExit={ isRichEditingEnabled ? onExit : undefined }
				exitShortcut={ shortcut }
			>
				<PostTitle />
				<PostTextEditor />
			</CodeEditorScreen>
		</>
	);
}
